"""在網站每一頁的 </head> 前加 GoatCounter 計數（不用 cookie、不收個資）：python3 tools/add_goatcounter.py [網站根目錄]
已經有的頁面不重複加。遊戲還在測試（noindex），不加。新增一話之後要再跑一次。"""
import pathlib, sys
root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
TAG = '<script data-goatcounter="https://catheroparty.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n'
n = 0
for page in [root / 'index.html', *sorted((root / 'r').glob('*.html')), *sorted((root / 'story').glob('*.html'))]:
    t = page.read_text(encoding='utf-8')
    if 'goatcounter' in t or '</head>' not in t:
        continue
    page.write_text(t.replace('</head>', TAG + '</head>', 1), encoding='utf-8'); n += 1
print(f'加了 {n} 頁')
