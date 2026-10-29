"""發布前檢查（GitHub Actions 和本機都可以跑）：python3 tools/check_site.py
- story/ 底下每一頁的圖片和連結，指到的檔案都要存在
- 條漫切片 story/comic/NN-s-XX.jpg 每張 ≤500KB（LINE WEBTOON 規格）
- promo/epNN_comic.zip 裡的檔名只有英數字、每張 ≤500KB、合計 ≤50MB
- story/ 的每一話（NN.html、NN-comic.html）都要在目錄 story/index.html 裡
- 首頁（10/29 改版起）：Search Console 驗證、舊分享網址轉測驗的那行還在；測驗在 quiz/；r/ 都轉到 quiz/；首頁的連結都指得到
有問題就列出來並回傳 1，Actions 會因此失敗、不發布。
"""
import pathlib, re, sys, zipfile

root = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
story = root / 'story'
errs = []

for page in sorted(story.glob('*.html')):
    text = page.read_text(encoding='utf-8')
    for ref in re.findall(r'(?:src|href)="([^"]+)"', text):
        if re.match(r'^(https?:|//|mailto:|#|data:)', ref):
            continue
        target = (page.parent / ref.split('#')[0].split('?')[0]).resolve()
        if target.is_dir():
            target = target / 'index.html'
        if not target.exists():
            errs.append(f'{page.relative_to(root)}：找不到 {ref}')

for img in sorted((story / 'comic').glob('*-s-*.jpg')):
    if img.stat().st_size > 500_000:
        errs.append(f'{img.relative_to(root)} 超過 500KB')

for z in sorted((root / 'promo').glob('ep*_comic.zip')):
    total = 0
    with zipfile.ZipFile(z) as f:
        for info in f.infolist():
            total += info.file_size
            if not re.fullmatch(r'[A-Za-z0-9]+\.jpg', info.filename):
                errs.append(f'{z.name}：檔名 {info.filename} 不是只有英數字')
            if info.file_size > 500_000:
                errs.append(f'{z.name}：{info.filename} 超過 500KB')
    if total > 50_000_000:
        errs.append(f'{z.name} 合計超過 50MB')

index = (story / 'index.html').read_text(encoding='utf-8')
for page in sorted(story.glob('[0-9][0-9]*.html')):
    if f'href="{page.name}"' not in index:
        errs.append(f'目錄 story/index.html 沒有連到 {page.name}')

quiz = root / 'quiz' / 'index.html'
if quiz.exists():
    home = (root / 'index.html').read_text(encoding='utf-8')
    if 'google-site-verification' not in home:
        errs.append('首頁 index.html 少了 google-site-verification（Search Console 驗證會失效）')
    if "location.replace('quiz/' + location.hash)" not in home:
        errs.append('首頁 index.html 少了「#隊伍碼轉到 quiz/」那一行，舊的分享網址會壞')
    if '<base href="../">' not in quiz.read_text(encoding='utf-8'):
        errs.append('quiz/index.html 少了 <base href="../">，測驗的圖和程式會載不到')
    for page in sorted((root / 'r').glob('*.html')):
        if "location.replace('../quiz/'" not in page.read_text(encoding='utf-8'):
            errs.append(f'{page.relative_to(root)} 沒有轉到 ../quiz/')
    for ref in re.findall(r'(?<![\w-])(?:src|href)="([^"]+)"', home):   # 不算 data-home-src 這類
        if re.match(r'^(https?:|//|mailto:|#|data:)', ref):
            continue
        target = (root / ref.split('#')[0].split('?')[0]).resolve()
        if target.is_dir():
            target = target / 'index.html'
        if not target.exists():
            errs.append(f'index.html：找不到 {ref}')

if errs:
    print('\n'.join(errs))
    sys.exit(1)
print('OK')
