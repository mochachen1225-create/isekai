"""網站和 itch.io 的每日數字（GitHub Actions 跑，見 .github/workflows/stats.yml）。

python3 tools/site_stats.py web     GoatCounter：昨天（台灣時間）各頁的瀏覽數，寫到 stats/web/YYYY-MM-DD.json
python3 tools/site_stats.py itch    itch.io：我的遊戲累計瀏覽／下載數，寫到 stats/itch/YYYY-MM-DD.json

金鑰放 GitHub secrets：GOATCOUNTER_TOKEN（GoatCounter 設定裡建的 API key，只要讀取權限）、
ITCH_API_KEY（itch.io 設定 → API keys）。沒設就跳過，不算失敗。
API 的欄位名稱官方文件沒寫全，讀不到的欄位就是 null，不會讓整次失敗；第一次跑完要人看一次結果。
網址裡帶的金鑰不會印出來（錯誤訊息只寫狀態碼）。
"""
import datetime, json, os, pathlib, sys, urllib.error, urllib.parse, urllib.request

root = pathlib.Path(__file__).resolve().parent.parent
TW = datetime.timezone(datetime.timedelta(hours=8))
now = datetime.datetime.now(TW)
GOAT = 'https://catheroparty.goatcounter.com/api/v0'
SECTIONS = (('quiz', ('quiz/', 'r/')), ('games', ('games/',)), ('story', ('story/',)))


def get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:   # 不把網址（可能含金鑰）印出來
        raise RuntimeError(f'HTTP {e.code}：{e.read().decode(errors="replace")[:200]}') from None


def save(kind, data, day):
    f = root / 'stats' / kind / f'{day}.json'
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{f.relative_to(root)} 已存')


def section(path):
    """GitHub Pages 的網址前面有 /isekai/，拿掉之後依開頭分類；首頁是 home。"""
    p = (path or '').split('?')[0].split('#')[0]
    p = p[len('/isekai'):] if p.startswith('/isekai') else p
    p = p.lstrip('/')
    if p in ('', 'index.html'):
        return 'home'
    if p.startswith('html/'):          # itch.io 內嵌的遊戲（iframe 網址是 /html/<編號>/index.html）
        return 'itch_embed'
    for name, prefixes in SECTIONS:
        if p.startswith(prefixes):
            return name
    return 'other'


def cmd_web():
    token = os.environ.get('GOATCOUNTER_TOKEN', '')
    if not token:
        print('還沒設定 GOATCOUNTER_TOKEN，跳過'); return
    start = (now - datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    day = start.strftime('%Y-%m-%d')
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    # 時間要給到時分（API 收 datetime、整點），昨天 00:00 到今天 00:00（台灣時間）；一次最多 100 頁，網站還小，夠用
    q = {'start': start.isoformat(), 'end': (start + datetime.timedelta(days=1)).isoformat(), 'limit': 100}
    try:
        r = get(f'{GOAT}/stats/hits?{urllib.parse.urlencode(q)}', headers)
    except RuntimeError as e:
        if not str(e).startswith('HTTP 404'):
            raise
        print('GoatCounter 回 404，當成這段時間沒有瀏覽（0）；如果一直是 0，檢查網址和金鑰')
        r = {'hits': [], 'more': False}
    pages = [{'path': (h.get('path') or '').split('?')[0], 'title': h.get('title'), 'count': h.get('count')}
             for h in r.get('hits') or []]   # 拿掉 ?v= 之類的參數
    by = {'home': 0, 'quiz': 0, 'games': 0, 'itch_embed': 0, 'story': 0, 'other': 0}
    for p in pages:
        if isinstance(p['count'], int):
            by[section(p['path'])] += p['count']
    pages.sort(key=lambda p: p['count'] if isinstance(p['count'], int) else -1, reverse=True)
    save('web', {'date': day, 'taken_at': now.isoformat(timespec='seconds'),
                 'total': sum(by.values()), 'by_section': by, 'more_pages': bool(r.get('more')),
                 'pages': pages[:30]}, day)


def cmd_itch():
    key = os.environ.get('ITCH_API_KEY', '')
    if not key:
        print('還沒設定 ITCH_API_KEY，跳過'); return
    r = get(f'https://itch.io/api/1/{key}/my-games')
    games = [{'id': g.get('id'), 'title': g.get('title'), 'url': g.get('url'),
              'views': g.get('views_count'), 'downloads': g.get('downloads_count'),
              'purchases': g.get('purchases_count'), 'published': g.get('published')}
             for g in r.get('games') or []]
    day = now.strftime('%Y-%m-%d')
    save('itch', {'taken_at': now.isoformat(timespec='seconds'), 'games': games}, day)


if __name__ == '__main__':
    {'web': cmd_web, 'itch': cmd_itch}[sys.argv[1]]()
