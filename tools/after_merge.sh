#!/usr/bin/env bash
# 存稿合併進 site 之後，重新產生自動檔案：bash tools/after_merge.sh [字型 ttf 路徑]
# 給了 ttf 才重新縮減字型。上線（release.yml）和預演（rehearse.sh）跑的是同一套。
set -eu
TTF="${1:-}"
if [ -n "$TTF" ]; then python3 tools/subset_font.py "$TTF"; fi
python3 tools/make_feed.py
python3 tools/add_goatcounter.py
# 首頁改版（10/29）之後才有的兩支
if [ -f tools/fix_quiz_links.py ]; then python3 tools/fix_quiz_links.py; fi
if [ -f tools/make_home_data.py ]; then python3 tools/make_home_data.py; fi
