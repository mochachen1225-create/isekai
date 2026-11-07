"""在網站每一頁的 </head> 前加 GoatCounter 計數（不用 cookie、不收個資）：python3 tools/add_goatcounter.py [網站根目錄]
掃網站底下所有 .html（10/29 起，不再寫死清單）。已經有的頁面不重複加；
有 <meta name="robots" content="noindex"> 的頁面（還沒上架的小遊戲、測試頁）跳過，正式上架拿掉 noindex 後會自動加上。
上線時 main 的 release.yml 會自動跑。"""
import pathlib, sys
root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
TAG = '<script data-goatcounter="https://catheroparty.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>\n'
SKIP_DIRS = {'.git', '.github', 'node_modules', 'tools'}
n = 0
for page in sorted(root.rglob('*.html')):
    if SKIP_DIRS & set(page.relative_to(root).parts):
        continue
    t = page.read_text(encoding='utf-8')
    if 'goatcounter' in t or '</head>' not in t or 'noindex' in t:
        continue
    page.write_text(t.replace('</head>', TAG + '</head>', 1), encoding='utf-8'); n += 1
print(f'加了 {n} 頁')
