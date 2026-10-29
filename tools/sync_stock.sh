#!/usr/bin/env bash
# 把 site 的修改帶進所有還沒上線的存稿分支（照 release.json 順序一條接一條：site → 第一條 → 第二條 …）：
#   bash tools/sync_stock.sh release.json          只在本機合併，先看結果
#   bash tools/sync_stock.sh release.json --push   全部成功才一起推上去
# 什麼時候要跑：site 上改了存稿分支也會改到的檔案之後（首頁、r/、story/index.html、工具程式等），
# 不跑的話週三上線合併可能衝突。每天的預演 workflow 抓到衝突時，通常也是跑這支解決。
# 有真的衝突（不是自動產生的檔案）就停下來，什麼都不推。
set -u
RELEASE="$1"; PUSH="${2:-}"
MERGE=$(mktemp); cp "$(dirname "$0")/release_merge.sh" "$MERGE"; trap 'rm -f "$MERGE"' EXIT   # 切到存稿分支後 tools/ 可能是舊的，先複製一份
TODAY=$(TZ=Asia/Taipei date +%F)
BRS=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); [print(v) for k, v in sorted(d.items()) if k[:1].isdigit() and k >= sys.argv[2]]" "$RELEASE" "$TODAY")
[ -z "$BRS" ] && { echo "沒有還沒上線的存稿分支"; exit 0; }
git diff --quiet && git diff --cached --quiet || { echo "工作目錄有沒 commit 的修改，先處理"; exit 1; }
START=$(git rev-parse --abbrev-ref HEAD)
git fetch -q origin site $BRS || exit 1
PREV=origin/site
for BR in $BRS; do
  git checkout -q -B "$BR" "origin/$BR" || exit 1
  if ! bash "$MERGE" "$PREV"; then
    echo "✗ $BR：停下來，沒有推任何東西"; git checkout -q "$START"; exit 1
  fi
  echo "✓ $BR ← $PREV"
  PREV="$BR"
done
git checkout -q "$START"
if [ "$PUSH" = "--push" ]; then
  git push -q origin $BRS && echo "已推上去：$(echo $BRS)"
else
  echo "只在本機合併。確認沒問題後加 --push 再跑一次。"
fi
