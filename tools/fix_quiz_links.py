"""把連載頁上「玩轉生職業測驗」的按鈕從首頁改連到 quiz/：python3 tools/fix_quiz_links.py [網站根目錄]
測驗 10/29 從首頁搬到 quiz/，但存稿分支裡已經做好的頁面還是連 ../。上線時 after_merge.sh 會跑這支，所以存稿頁不用手改；
新做的頁面請直接寫 href="../quiz/"。"""
import pathlib, re, sys
root = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
n = 0
for page in sorted((root / 'story').glob('*.html')):
    t = page.read_text(encoding='utf-8')
    t2 = re.sub(r'href="\.\./"(>[^<]*測驗)', r'href="../quiz/"\1', t)
    if t2 != t:
        page.write_text(t2, encoding='utf-8'); n += 1
print(f'測驗連結改了 {n} 頁')
