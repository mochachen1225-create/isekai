"""Threads 自動發文（GitHub Actions 跑，見 .github/workflows/threads.yml）。

python3 tools/threads_post.py post      發 posts/threads.json 裡「已審核、時間到、還沒發」的貼文
python3 tools/threads_post.py token     把 THREADS_TOKEN 換成（或延長成）60 天的長效 token，印出新的
python3 tools/threads_post.py stats     抓 30 天內每則貼文的數字和追蹤人數，寫到 stats/threads/YYYY-MM-DD.json（要 threads_manage_insights 權限）

貼文格式（posts/threads.json，一則一個物件）：
  {"id": "bts1", "at": "2026-11-12T20:00:00+08:00", "text": "...", "images": ["https://.../a.jpg"],
   "approved": true, "posted": false, "tag": "AI"}
images 可以是 0 張（純文字）、1 張、2～20 張（輪播）。圖片要是公開網址（GitHub Pages）。
tag 是 Threads 的主題標籤（一則一個，可以不寫）：1～50 字，「.」和「&」會自動拿掉；標籤被拒絕時改發沒標籤的，不擋發文。
只有使用者說 OK 的才會由 Claude 設成 approved: true。
"""
import datetime, json, os, pathlib, sys, time, urllib.parse, urllib.request

API = 'https://graph.threads.net/v1.0'
root = pathlib.Path(__file__).resolve().parent.parent
queue = root / 'posts' / 'threads.json'
token = os.environ.get('THREADS_TOKEN', '')


def call(method, path, **params):
    params['access_token'] = token
    data = urllib.parse.urlencode(params).encode()
    if method == 'GET':
        req = urllib.request.Request(f'{API}/{path}?{data.decode()}')
    else:
        req = urllib.request.Request(f'{API}/{path}', data=data, method='POST')
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def clean_tag(tag):
    """Threads 主題標籤：不能有「.」「&」，1～50 字；不合格就當作沒有。"""
    tag = (tag or '').replace('.', '').replace('&', '').strip()[:50]
    return tag or None


def container(text=None, image=None, carousel_item=False, children=None, tag=None):
    p = {}
    if children:
        p.update(media_type='CAROUSEL', children=','.join(children))
    elif image:
        p.update(media_type='IMAGE', image_url=image)
    else:
        p.update(media_type='TEXT')
    if text and not carousel_item:
        p['text'] = text
    if tag and not carousel_item:     # 標籤放在主容器（輪播放在 CAROUSEL 那層），子項目不放
        p['topic_tag'] = tag
    if carousel_item:
        p['is_carousel_item'] = 'true'
    return call('POST', 'me/threads', **p)['id']


def publish(post):
    imgs = post.get('images') or []
    kids = [container(image=u, carousel_item=True) for u in imgs] if len(imgs) > 1 else None
    main = dict(text=post['text'], children=kids, image=None if kids else (imgs[0] if imgs else None))
    tag = clean_tag(post.get('tag'))
    try:
        cid = container(**main, tag=tag)
    except Exception as e:
        if not tag:
            raise
        print(f'{post["id"]}：主題標籤「{tag}」被拒絕（{e}），改發沒有標籤的')
        cid = container(**main)
    if imgs:
        time.sleep(30)  # Meta 建議有圖的貼文等容器處理好再發
    return call('POST', 'me/threads_publish', creation_id=cid)['id']


def cmd_post():
    if not token:
        print('還沒設定 THREADS_TOKEN，跳過'); return
    posts = json.loads(queue.read_text(encoding='utf-8'))
    now = datetime.datetime.now(datetime.timezone.utc)
    changed = False
    for p in posts:
        if p.get('posted') or not p.get('approved'):
            continue
        if datetime.datetime.fromisoformat(p['at']) > now:
            continue
        p['thread_id'] = publish(p)
        p['posted'] = True
        p['posted_at'] = now.isoformat(timespec='seconds')
        changed = True
        print('已發：', p['id'], p['thread_id'])
    if changed:
        queue.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def cmd_token():
    """短效 token 換長效（要 THREADS_APP_SECRET）；已經是長效就延長。結果只印到 stdout，由 workflow 寫回加密設定。"""
    secret = os.environ.get('THREADS_APP_SECRET', '')
    for url in (
        f'https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret={secret}&access_token={token}',
        f'https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token={token}',
    ):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                print(json.load(r)['access_token']); return
        except Exception:
            continue
    sys.exit('換 token 失敗：token 可能已過期，請重新產生一次')


def insight_value(item):
    """insights 回傳的一個指標：貼文的是 values[0].value，帳號的是 total_value.value。"""
    if 'total_value' in item:
        return item['total_value'].get('value')
    vals = item.get('values') or []
    return vals[-1].get('value') if vals else None


def post_insights(media_id):
    """views、shares 官方標註還在開發中，拿不到就退回其他四個；再失敗就整則填 null，不讓一則壞掉整次。"""
    for metrics in ('views,likes,replies,reposts,quotes,shares', 'likes,replies,reposts,quotes'):
        try:
            data = call('GET', f'{media_id}/insights', metric=metrics)['data']
            return {d['name']: insight_value(d) for d in data}
        except Exception:
            continue
    return {}


def cmd_stats():
    """自己帳號 30 天內的貼文（包含手動發的）＋追蹤人數。數字都是累計值，每週增加量由雲端 Claude 統整時算。"""
    if not token:
        print('還沒設定 THREADS_TOKEN，跳過'); return
    tw = datetime.timezone(datetime.timedelta(hours=8))
    now = datetime.datetime.now(tw)
    since = int((now - datetime.timedelta(days=30)).timestamp())
    queued = {p.get('thread_id'): p['id'] for p in json.loads(queue.read_text(encoding='utf-8')) if p.get('thread_id')}
    out = {'taken_at': now.isoformat(timespec='seconds'), 'followers': None, 'posts': []}
    try:
        data = call('GET', 'me/threads_insights', metric='followers_count')['data']
        out['followers'] = insight_value(data[0]) if data else None
    except Exception as e:
        print('追蹤人數抓不到：', e)
    after = None
    while True:
        params = {'fields': 'id,timestamp,permalink', 'since': since, 'limit': 50}
        if after:
            params['after'] = after
        page = call('GET', 'me/threads', **params)
        for m in page.get('data', []):
            row = {'id': m['id'], 'queue_id': queued.get(m['id']), 'posted_at': m.get('timestamp'),
                   'permalink': m.get('permalink')}
            ins = post_insights(m['id'])
            for k in ('views', 'likes', 'replies', 'reposts', 'quotes', 'shares'):
                row[k] = ins.get(k)
            out['posts'].append(row)
        after = page.get('paging', {}).get('cursors', {}).get('after') if page.get('paging', {}).get('next') else None
        if not after:
            break
    f = root / 'stats' / 'threads' / f'{now:%Y-%m-%d}.json'
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{f.relative_to(root)}：{len(out["posts"])} 則，追蹤 {out["followers"]}')


if __name__ == '__main__':
    {'post': cmd_post, 'token': cmd_token, 'stats': cmd_stats}[sys.argv[1]]()
