"""IG 自動發文（GitHub Actions 跑，見 .github/workflows/ig.yml）。做法比照 tools/threads_post.py。

python3 tools/ig_post.py check     只檢查 posts/ig.json 的圖和影片合不合 IG 規格，不發文（隨時可跑）
python3 tools/ig_post.py post      發「已審核、時間到、還沒發」的貼文
python3 tools/ig_post.py token     確認 IG_TOKEN 還能用（系統用戶權杖永遠不會過期，不用換）
python3 tools/ig_post.py stats     抓追蹤人數和 30 天內貼文的數字，寫到 stats/ig/YYYY-MM-DD.json

貼文格式（posts/ig.json，一則一個物件）：
  {"id": "ig_ep1", "at": "2026-11-12T20:00:00+08:00", "text": "...",
   "images": ["https://.../a.jpg"], "video": "https://.../a.mp4", "approved": true, "posted": false}
- images 1 張＝單圖，2～10 張＝輪播；video＝Reels（有 video 就不看 images）。都要是公開網址（GitHub Pages）。
- 圖只能是 JPEG，寬高比要在 4:5（0.8）到 1.91:1 之間；輪播會照第一張的比例裁，最好全部一樣比例。
- 不合規格的貼文不會送出，寫 error 欄位並跳過，之後每 15 分鐘也不會再試；修好檔案後把 error 刪掉就會重試。
- 只有使用者說 OK 的才會由 Claude 設成 approved: true。

API：Meta 後台「API setup with Unified login」產生的系統用戶權杖（EAA 開頭、永遠不會過期），走 graph.facebook.com，
用 IG 帳號編號（IG_USER_ID）發文。權限 instagram_basic、instagram_content_publish；
stats 的觸及、收藏要 instagram_manage_insights，沒有就只抓按讚和留言數。
token 外流時：到 Meta 商家資產管理組合「貓貓勇者小隊」→ 系統工作人員，撤銷這個權杖，再產生新的貼進 GitHub。
"""
import datetime, json, os, pathlib, struct, sys, time, urllib.error, urllib.parse, urllib.request

API = 'https://graph.facebook.com/v26.0'
root = pathlib.Path(__file__).resolve().parent.parent
queue = root / 'posts' / 'ig.json'
token = os.environ.get('IG_TOKEN', '')
uid = os.environ.get('IG_USER_ID', '')   # IG 帳號編號（不是機密），寫在 ig.yml
TW = datetime.timezone(datetime.timedelta(hours=8))


def call(method, path, **params):
    params['access_token'] = token
    data = urllib.parse.urlencode(params).encode()
    if method == 'GET':
        req = urllib.request.Request(f'{API}/{path}?{data.decode()}')
    else:
        req = urllib.request.Request(f'{API}/{path}', data=data, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:   # 把 Meta 回的錯誤訊息帶出來，token 不會出現在這裡
        raise RuntimeError(f'{method} {path}：{e.code} {e.read().decode(errors="replace")[:300]}') from None


# ---------- 檢查規格（不用 API） ----------

def jpeg_size(url):
    """只抓檔頭讀 JPEG 寬高，不是 JPEG 就回 None。"""
    req = urllib.request.Request(url, headers={'Range': 'bytes=0-65535'})
    with urllib.request.urlopen(req, timeout=60) as r:
        b = r.read()
    if b[:2] != b'\xff\xd8':
        return None
    i = 2
    while i + 9 < len(b):
        if b[i] != 0xFF:
            i += 1
            continue
        marker, seglen = b[i + 1], struct.unpack('>H', b[i + 2:i + 4])[0]
        if marker in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', b[i + 5:i + 9])
            return w, h
        i += 2 + seglen
    return None


def problems(post):
    errs = []
    if post.get('video'):
        try:
            with urllib.request.urlopen(urllib.request.Request(post['video'], method='HEAD'), timeout=60) as r:
                if 'video' not in r.headers.get('Content-Type', ''):
                    errs.append(f'影片網址不是影片：{post["video"]}')
        except Exception as e:
            errs.append(f'影片打不開：{post["video"]}（{e}）')
        return errs
    imgs = post.get('images') or []
    if not 1 <= len(imgs) <= 10:
        errs.append(f'圖要 1～10 張，現在 {len(imgs)} 張')
    for u in imgs:
        try:
            size = jpeg_size(u)
        except Exception as e:
            errs.append(f'圖打不開：{u}（{e}）'); continue
        if not size:
            errs.append(f'不是 JPEG：{u}'); continue
        ratio = size[0] / size[1]
        if not 0.8 - 0.005 <= ratio <= 1.91 + 0.005:
            errs.append(f'比例 {size[0]}×{size[1]} 超出 4:5～1.91:1：{u}')
    return errs


def cmd_check():
    bad = 0
    for p in json.loads(queue.read_text(encoding='utf-8')):
        errs = problems(p)
        bad += bool(errs)
        print(('✗ ' if errs else '✓ ') + p['id'] + ''.join('\n    ' + e for e in errs))
    sys.exit(1 if bad else 0)


# ---------- 發文 ----------

def wait_ready(cid, minutes=10):
    """影片容器要等 Meta 處理完（FINISHED）才能發；圖片通常馬上好。"""
    for _ in range(minutes * 6):
        status = call('GET', cid, fields='status_code').get('status_code')
        if status in (None, 'FINISHED'):
            return
        if status in ('ERROR', 'EXPIRED'):
            raise RuntimeError(f'容器 {cid} 狀態 {status}')
        time.sleep(10)
    raise RuntimeError(f'容器 {cid} 等了 {minutes} 分鐘還沒處理好')


def publish(post):
    if post.get('video'):
        cid = call('POST', f'{uid}/media', media_type='REELS', video_url=post['video'], caption=post['text'])['id']
    elif len(post['images']) > 1:
        kids = [call('POST', f'{uid}/media', image_url=u, is_carousel_item='true')['id'] for u in post['images']]
        for k in kids:
            wait_ready(k)
        cid = call('POST', f'{uid}/media', media_type='CAROUSEL', children=','.join(kids), caption=post['text'])['id']
    else:
        cid = call('POST', f'{uid}/media', image_url=post['images'][0], caption=post['text'])['id']
    wait_ready(cid)
    mid = call('POST', f'{uid}/media_publish', creation_id=cid)['id']
    link = call('GET', mid, fields='permalink').get('permalink')
    return mid, link


def cmd_post():
    if not token:
        print('還沒設定 IG_TOKEN，跳過'); return
    posts = json.loads(queue.read_text(encoding='utf-8'))
    now = datetime.datetime.now(datetime.timezone.utc)
    due = [p for p in posts if p.get('approved') and not p.get('posted') and not p.get('error')
           and datetime.datetime.fromisoformat(p['at']) <= now]
    if not due:
        return
    failed = False
    for p in due:
        errs = problems(p)
        try:
            if errs:
                raise RuntimeError('；'.join(errs))
            p['ig_id'], p['permalink'] = publish(p)
            p['posted'] = True
            p['posted_at'] = now.isoformat(timespec='seconds')
            print('已發：', p['id'], p['permalink'])
        except Exception as e:     # 一則失敗不影響其他則；寫 error，修好前不再重試
            p['error'] = str(e)[:500]
            failed = True
            print('失敗：', p['id'], p['error'])
    queue.write_text(json.dumps(posts, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if failed:
        sys.exit(1)                # 讓 Actions 顯示紅色、寄信給使用者


# ---------- token ----------

def cmd_token():
    """系統用戶權杖不會過期，這裡只確認還能用、連到的是對的 IG 帳號。"""
    if not token:
        print('還沒設定 IG_TOKEN，跳過'); return
    me = call('GET', uid, fields='username')
    print(f'IG_TOKEN 可以用，帳號：{me.get("username")}')


# ---------- 數字 ----------

def cmd_stats():
    """追蹤人數＋30 天內自動發的貼文數字。數字都是累計值，每週增加量由雲端 Claude 統整時算。"""
    if not token:
        print('還沒設定 IG_TOKEN，跳過'); return
    now = datetime.datetime.now(TW)
    out = {'taken_at': now.isoformat(timespec='seconds'), 'followers': None, 'media_count': None, 'posts': []}
    try:
        me = call('GET', uid, fields='followers_count,media_count')
        out['followers'], out['media_count'] = me.get('followers_count'), me.get('media_count')
    except Exception as e:
        print('帳號數字抓不到：', e)
    since = now - datetime.timedelta(days=30)
    for p in json.loads(queue.read_text(encoding='utf-8')):
        if not p.get('ig_id') or datetime.datetime.fromisoformat(p['posted_at']) < since:
            continue
        row = {'id': p['ig_id'], 'queue_id': p['id'], 'posted_at': p['posted_at'], 'permalink': p.get('permalink')}
        try:
            basic = call('GET', p['ig_id'], fields='like_count,comments_count')
            row['likes'], row['comments'] = basic.get('like_count'), basic.get('comments_count')
        except Exception as e:
            print(p['id'], '按讚留言數抓不到：', e)
        try:                       # 要 instagram_manage_insights；沒有權限就只有上面兩個
            data = call('GET', f'{p["ig_id"]}/insights', metric='reach,saved,shares,views')['data']
            row.update({d['name']: (d.get('values') or [{}])[-1].get('value') for d in data})
        except Exception as e:
            print(p['id'], 'insights 抓不到：', e)
        out['posts'].append(row)
    f = root / 'stats' / 'ig' / f'{now:%Y-%m-%d}.json'
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{f.relative_to(root)}：{len(out["posts"])} 則，追蹤 {out["followers"]}')


if __name__ == '__main__':
    {'check': cmd_check, 'post': cmd_post, 'token': cmd_token, 'stats': cmd_stats}[sys.argv[1]]()
