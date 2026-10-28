"""產生 RSS 訂閱 story/feed.xml 和網站地圖 sitemap.xml：python3 tools/make_feed.py

- 每一話的資料從 story/index.html 的目錄讀（第N話、話名、小說和漫畫連結），簡介用 NN.html 的 description。
- 每一話第一次出現在目錄的日期記在 story/feed-dates.json（台灣時間），之後不再變。
- sitemap.xml 列出首頁、職業結果頁 r/、連載的每一頁；遊戲還在測試（noindex）不列。
定時上線（main 的 release.yml）合併存稿後會跑這支，再一起推上去。
"""
import datetime, html, json, pathlib, re

BASE = 'https://mochachen1225-create.github.io/isekai/'
root = pathlib.Path(__file__).resolve().parent.parent
story = root / 'story'
tw = datetime.timezone(datetime.timedelta(hours=8))
now = datetime.datetime.now(tw)

index = (story / 'index.html').read_text(encoding='utf-8')
eps = re.findall(r'<small>(第.+?話)</small>(.*?)\s*<span class="links"><a href="(\d+)\.html">', index)

dates_file = story / 'feed-dates.json'
dates = json.loads(dates_file.read_text(encoding='utf-8')) if dates_file.exists() else {}
for _, _, nn in eps:
    dates.setdefault(nn, now.strftime('%Y-%m-%dT%H:%M:%S+08:00'))
dates_file.write_text(json.dumps(dates, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def desc(nn):
    m = re.search(r'<meta name="description" content="([^"]*)"', (story / f'{nn}.html').read_text(encoding='utf-8'))
    return m.group(1) if m else ''

items = []
for no, title, nn in reversed(eps):
    when = datetime.datetime.fromisoformat(dates[nn])
    items.append(f'''  <item>
    <title>{html.escape(f"{no}　{title.strip()}")}</title>
    <link>{BASE}story/{nn}.html</link>
    <guid>{BASE}story/{nn}.html</guid>
    <pubDate>{when.strftime('%a, %d %b %Y %H:%M:%S +0800')}</pubDate>
    <description>{html.escape(desc(nn) + f' 漫畫版：{BASE}story/{nn}-comic.html')}</description>
  </item>''')
(story / 'feed.xml').write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>貓貓勇者小隊</title>
  <link>{BASE}story/</link>
  <atom:link href="{BASE}story/feed.xml" rel="self" type="application/rss+xml"/>
  <description>一個累到忘了生活的台灣上班族，掉進了異世界。小說和漫畫每週同步連載。</description>
  <language>zh-TW</language>
{chr(10).join(items)}
</channel>
</rss>
''', encoding='utf-8')

pages = ['', 'story/'] + [f'r/{p.name}' for p in sorted((root / 'r').glob('*.html'))]
pages += [f'story/{p.name}' for p in sorted(story.glob('[0-9][0-9]*.html'))]
urls = '\n'.join(f'  <url><loc>{BASE}{p}</loc></url>' for p in pages)
(root / 'sitemap.xml').write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls}
</urlset>
''', encoding='utf-8')
print(f'feed: {len(items)} 話；sitemap: {len(pages)} 頁')
