"""用 Gemini API（Nano Banana）畫一張圖，可附參考圖。

一次執行只呼叫一次 API，失敗就結束、不重試（見 CLAUDE.md）。
預設走 Vertex AI（用 Google Cloud 試用送的額度付錢，模型跟 AI Studio 同一個）；
加 --api=studio 改走 AI Studio 的 Gemini API（用預付儲值）。
兩邊的金鑰都由環境的 Network secrets 代理自動加上（Claude 看不到）。
每天最多 DAILY_MAX 張（記在 ~/.isekai_image_log.json），超過就拒絕執行。

用法：
  python3 tools/gemini_image.py prompt.txt out.png [ref1.jpg ref2.jpg ...] [--model=gemini-3.1-flash-image] [--ratio=3:4] [--api=vertex|studio] [--loc=global|us-central1…]
"""
import base64, datetime, io, json, os, sys, urllib.request
from PIL import Image

MODEL = 'gemini-3.1-flash-image'  # Nano Banana 2
REF_MAX = 1536
PROJECT = 'gen-lang-client-0406332141'  # Google Cloud 專案「isekai」
DAILY_MAX = 40
LOG = os.path.expanduser('~/.isekai_image_log.json')


def count_today(add=0):
    today = datetime.date.today().isoformat()
    try:
        log = json.load(open(LOG))
    except (OSError, ValueError):
        log = {}
    log[today] = log.get(today, 0) + add
    if add:
        json.dump(log, open(LOG, 'w'))
    return log[today]


def ref_part(path):
    im = Image.open(path).convert('RGB')
    im.thumbnail((REF_MAX, REF_MAX), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=90)
    return {'inline_data': {'mime_type': 'image/jpeg', 'data': base64.b64encode(buf.getvalue()).decode()}}


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    opt = dict(a[2:].split('=', 1) for a in argv if a.startswith('--') and '=' in a)
    if len(args) < 2:
        sys.exit(__doc__)
    model, ratio, api = opt.get('model', MODEL), opt.get('ratio', '3:4'), opt.get('api', 'vertex')
    loc = opt.get('loc', 'global')  # global 被 429 時可試指定區域
    if count_today() >= DAILY_MAX:
        sys.exit(f'今天已經畫了 {DAILY_MAX} 張，到每日上限，停下來問使用者。')
    prompt = open(args[0], encoding='utf-8').read().strip()
    out_path, refs = args[1], args[2:]

    body = {
        'contents': [{'role': 'user', 'parts': [*map(ref_part, refs), {'text': prompt}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': ratio}},
    }
    req = urllib.request.Request(
        f'https://aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/{loc}/publishers/google/models/{model}:generateContent'
        if api == 'vertex' else f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        data=json.dumps(body).encode(), method='POST', headers={'Content-Type': 'application/json'})
    count_today(1)  # 送出就可能被收費，先記帳
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            data = json.loads(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'API 錯誤 {e.code}：{e.read().decode(errors="replace")[:800]}')

    parts = (data.get('candidates') or [{}])[0].get('content', {}).get('parts', [])
    img = next((p.get('inlineData') or p.get('inline_data') for p in parts if p.get('inlineData') or p.get('inline_data')), None)
    if not img:
        sys.exit(f'回傳裡沒有圖片：{json.dumps(data, ensure_ascii=False)[:800]}')
    with open(out_path, 'wb') as f:
        f.write(base64.b64decode(img['data']))
    print('ok', api, out_path, Image.open(out_path).size, data.get('usageMetadata', {}))


if __name__ == '__main__':
    main(sys.argv[1:])
