"""發布前檢查（GitHub Actions 和本機都可以跑）：python3 tools/check_site.py
- story/ 底下每一頁的圖片和連結，指到的檔案都要存在
- 條漫切片 story/comic/NN-s-XX.jpg 每張 ≤500KB（LINE WEBTOON 規格）
- promo/epNN_comic.zip 裡的檔名只有英數字、每張 ≤500KB、合計 ≤50MB
- story/ 的每一話（NN.html、NN-comic.html）都要在目錄 story/index.html 裡
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

if errs:
    print('\n'.join(errs))
    sys.exit(1)
print('OK')
