#!/usr/bin/env bash
# 預演上線：照 release.json 的順序，把還沒上線的存稿分支一個一個合併進 site 的複本，
# 每次都跑 after_merge.sh 和 check_site.py，跟週三真的上線一樣，但不推任何東西。
# 用法：bash tools/rehearse.sh release.json [基準分支，預設 origin/site] [字型 ttf]
# 例：預演首頁改版上線後會不會跟存稿衝突 → bash tools/rehearse.sh release.json origin/claude/mocha-worker-handoff-p25oto
# 有任何一話合併衝突或檢查不過，回傳 1（每天的預演 workflow 會因此失敗、寄信）。
# STOCK=local 時用本機的存稿分支（例如 sync_stock.sh 還沒 --push 前，先預演同步後的結果）。
set -u
PFX="origin/"; [ "${STOCK:-}" = "local" ] && PFX=
RELEASE="$1"; BASE="${2:-origin/site}"; TTF="${3:-}"
TOOLS="$(cd "$(dirname "$0")" && pwd)"          # 用這一份的 release_merge.sh，基準分支舊的也能預演
TODAY=$(TZ=Asia/Taipei date +%F)
PLAN=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); [print(k, v) for k, v in sorted(d.items()) if k[:1].isdigit() and k >= sys.argv[2]]" "$RELEASE" "$TODAY")
[ -z "$PLAN" ] && { echo "release.json 沒有 $TODAY 以後的上線"; exit 0; }

WT=$(mktemp -d)
trap 'git worktree remove --force "$WT" >/dev/null 2>&1; rm -rf "$WT"' EXIT
[ -n "$PFX" ] && { git fetch -q origin $(echo "$PLAN" | awk '{print $2}') || exit 1; }
git worktree add -q --detach "$WT" "$BASE" || exit 1
cd "$WT"
git config user.name "rehearsal"; git config user.email "rehearsal@localhost"

FAIL=0
while read -r DATE BR; do
  if ! bash "$TOOLS/release_merge.sh" "$PFX$BR" >/tmp/rehearse.$$ 2>&1; then
    echo "✗ $DATE $BR：$(tail -1 /tmp/rehearse.$$)"; FAIL=1; break
  fi
  if [ -f tools/after_merge.sh ]; then
    if ! bash tools/after_merge.sh $TTF >/tmp/rehearse.$$ 2>&1; then
      echo "✗ $DATE $BR：after_merge.sh 失敗"; sed 's/^/    /' /tmp/rehearse.$$; FAIL=1; break
    fi
  else                                          # 基準分支還沒有 after_merge.sh：照舊的 release.yml 步驟
    python3 tools/make_feed.py >/dev/null && python3 tools/add_goatcounter.py >/dev/null
  fi
  git add -A && git commit -q -m "預演 $BR" --allow-empty
  if OUT=$(python3 tools/check_site.py 2>&1); then
    echo "✓ $DATE $BR"
  else
    echo "✗ $DATE $BR：檢查沒過"; echo "$OUT" | sed 's/^/    /'; FAIL=1; break
  fi
done <<< "$PLAN"
rm -f /tmp/rehearse.$$
exit $FAIL
