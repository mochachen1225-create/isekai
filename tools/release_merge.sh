#!/usr/bin/env bash
# 把一個分支合併進目前的分支：bash tools/release_merge.sh origin/ep04-stock
# 上線（release.yml）、每天預演（rehearse.sh）、同步存稿（sync_stock.sh）都用這支，規則只寫在這裡。
# 自動產生的檔案（字型、RSS、網站地圖、首頁資料）兩邊都改過時，先留目前分支的版本，合併後由 after_merge.sh 重新產生。
# 其他檔案衝突就放棄這次合併、回傳 1，不硬合（要人工看）。
set -u
BR="$1"
REGEN="fonts/huninn.woff2 story/feed.xml story/feed-dates.json sitemap.xml data/home.json"
git merge -q --no-edit "$BR" && exit 0
U=$(git diff --name-only --diff-filter=U)
if [ -z "$U" ]; then git merge --abort 2>/dev/null; echo "合併 $BR 失敗（不是檔案衝突，看上面的訊息）"; exit 1; fi
BAD=""
for f in $U; do case " $REGEN " in *" $f "*) ;; *) BAD="$BAD $f" ;; esac; done
if [ -n "$BAD" ]; then
  echo "合併 $BR 有衝突，要人工處理：$BAD"
  git merge --abort
  exit 1
fi
git checkout --ours -- $U && git add -- $U && git commit -q --no-edit || exit 1
echo "合併 $BR：自動產生的檔案先用目前版本，等一下重新產生：$U"
