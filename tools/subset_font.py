"""把 jf open 粉圓（OFL 授權）縮成只包含網站用到的字，輸出 fonts/huninn.woff2。

文字內容有改動時要重跑：
  curl -L -o /tmp/huninn.ttf https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf
  python3 tools/subset_font.py /tmp/huninn.ttf
"""
import pathlib
import sys

from fontTools import subset

root = pathlib.Path(__file__).resolve().parent.parent
chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set('，。、：；！？「」『』（）…—～·・→←↑↓▼★☆％＋／')
for path in [root / 'index.html', *sorted((root / 'js').glob('*.js')), *sorted((root / 'story').glob('*.html'))]:
    chars |= set(path.read_text(encoding='utf-8'))
chars = {c for c in chars if c.isprintable() and ord(c) >= 0x20}

opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['*']
opts.name_IDs = ['*']
font = subset.load_font(sys.argv[1], opts)
sub = subset.Subsetter(opts)
sub.populate(text=''.join(sorted(chars)))
sub.subset(font)
out = root / 'fonts' / 'huninn.woff2'
subset.save_font(font, str(out), opts)
print(f'{len(chars)} chars -> {out} ({out.stat().st_size // 1024} KB)')
