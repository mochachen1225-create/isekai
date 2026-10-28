"""Threads 自動發文（GitHub Actions 跑，見 .github/workflows/threads.yml）。

python3 tools/threads_post.py post      發 posts/threads.json 裡「已審核、時間到、還沒發」的貼文
python3 tools/threads_post.py token     把 THREADS_TOKEN 換成（或延長成）60 天的長效 token，印出新的

貼文格式（posts/threads.json，一則一個物件）：
  {"id": "bts1", "at": "2026-11-12T20:00:00+08:00", "text": "...", "images": ["https://.../a.jpg"],
   "approved": true, "posted": false}
images 可以是 0 張（純文字）、1 張、2～20 張（輪播）。圖片要是公開網址（GitHub Pages）。
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


def container(text=None, image=None, carousel_item=False, children=None):
    p = {}
    if children:
        p.update(media_type='CAROUSEL', children=','.join(children))
    elif image:
        p.update(media_type='IMAGE', image_url=image)
    else:
        p.update(media_type='TEXT')
    if text and not carousel_item:
        p['text'] = text
    if carousel_item:
        p['is_carousel_item'] = 'true'
    return call('POST', 'me/threads', **p)['id']


def publish(post):
    imgs = post.get('images') or []
    if len(imgs) > 1:
        kids = [container(image=u, carousel_item=True) for u in imgs]
        cid = container(text=post['text'], children=kids)
    else:
        cid = container(text=post['text'], image=imgs[0] if imgs else None)
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


if __name__ == '__main__':
    {'post': cmd_post, 'token': cmd_token}[sys.argv[1]]()
