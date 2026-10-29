"""產生首頁用的 data/home.json（最新一話、世界地圖亮到哪一國）：python3 tools/make_home_data.py [網站根目錄]

- 每一話從 story/index.html 的目錄讀（跟 make_feed.py 同一套），日期用 story/feed-dates.json。
- 國家從 data/arcs.json 讀：countries 照順序列，每國寫 id、name、from（第幾話小說開始進入這一國）。
  沒有這個檔就不亮任何國家。arcs.json 是內容，由雲端 Claude 維護。
- 只在上線時（main 的 release.yml，合併之後）跑，存稿分支不要產生、也不要 commit 這個檔，避免合併衝突。
網址都是相對於網站根目錄。首頁用 js/home.js 讀它。
"""
import json, pathlib, re, sys

root = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent
story = root / 'story'
index = (story / 'index.html').read_text(encoding='utf-8')
eps = re.findall(r'<small>(第.+?話)</small>(.*?)\s*<span class="links"><a href="(\d+)\.html">', index)
if not eps:
    sys.exit('story/index.html 的目錄讀不到任何一話，格式改了的話要一起改這支和 make_feed.py')

dates_file = story / 'feed-dates.json'
dates = json.loads(dates_file.read_text(encoding='utf-8')) if dates_file.exists() else {}

def entry(no, title, nn):
    comic, thumb = f'story/{nn}-comic.html', f'story/comic/{nn}-1.jpg'
    return {
        'no': no, 'n': int(nn), 'title': title.strip(),
        'novel': f'story/{nn}.html',
        'comic': comic if (root / comic).exists() else None,
        'thumb': thumb if (root / thumb).exists() else None,
        'date': dates.get(nn),
    }

latest = entry(*eps[-1])
arcs_file = root / 'data' / 'arcs.json'
countries = json.loads(arcs_file.read_text(encoding='utf-8')).get('countries', []) if arcs_file.exists() else []
reached = [c['id'] for c in countries if c['from'] <= latest['n']]

data = {
    'latest': latest,
    'count': len(eps),
    'reached': reached,
    'current': reached[-1] if reached else None,
}
out = root / 'data' / 'home.json'
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{out.relative_to(root)}：最新 {latest["no"]}，目前在 {data["current"]}')
