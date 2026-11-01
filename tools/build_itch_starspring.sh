#!/bin/bash
# 星之泉 → itch.io 用的 ZIP：index.html 在最上層、所有檔案都在包裡（不連 ../../）。
# 從 isekai-studio 的 work/itch/build_itch.sh 搬來（11/1），給 .github/workflows/itch-starspring.yml 用。
# 用法：bash tools/build_itch_starspring.sh <site 分支的根目錄> <輸出 zip>
set -euo pipefail
SITE=$(cd "$1" && pwd); ZIP=$2
SRC=$SITE/games/starspring
OUT=$(mktemp -d)/build
mkdir -p "$OUT/assets/sprites"
cp -r "$SRC/audio" "$SRC/img" "$SRC/index.html" "$OUT/"
for f in $(grep -oE "\.\./\.\./assets/sprites/[A-Za-z0-9_.-]+" "$SRC/index.html" | sort -u); do
  cp "$SITE/${f#../../}" "$OUT/assets/sprites/"
done
python3 - "$OUT/index.html" <<'PY'
import sys, re
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
s = s.replace('../../assets/sprites/', 'assets/sprites/')
s = s.replace('href="../../story/"', 'href="https://mochachen1225-create.github.io/isekai/story/" target="_blank" rel="noopener"')
s = s.replace('小遊戲 歡樂版 測試中', '小遊戲（AI 協作）').replace('歡樂版（試玩中）<br>', '').replace('爬上星之泉 歡樂版｜', '爬上星之泉｜')
s = re.sub(r'<meta name="robots" content="noindex">\n?', '', s)
assert '../../' not in s, '還有 ../../'
open(p, 'w', encoding='utf-8').write(s)
PY
mkdir -p "$(dirname "$ZIP")"; ZIP=$(cd "$(dirname "$ZIP")" && pwd)/$(basename "$ZIP"); rm -f "$ZIP"
(cd "$OUT" && zip -qr "$ZIP" .)
echo "$ZIP（$(du -h "$ZIP" | cut -f1)）"
