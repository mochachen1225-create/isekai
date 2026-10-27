"""用 Gemini API（Nano Banana）畫一張圖，可附參考圖。

一次執行只呼叫一次 API，失敗就結束、不重試（見 CLAUDE.md）。
API 金鑰由環境的 Network secrets 代理自動加到 generativelanguage.googleapis.com（Claude 看不到）。

用法：
  python3 tools/gemini_image.py prompt.txt out.png [ref1.jpg ref2.jpg ...] [--model=gemini-3.1-flash-image] [--ratio=3:4]
"""
import base64, io, json, sys, urllib.request
from PIL import Image

MODEL = 'gemini-3.1-flash-image'  # Nano Banana 2
REF_MAX = 1536


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
    model, ratio = opt.get('model', MODEL), opt.get('ratio', '3:4')
    prompt = open(args[0], encoding='utf-8').read().strip()
    out_path, refs = args[1], args[2:]

    body = {
        'contents': [{'parts': [*map(ref_part, refs), {'text': prompt}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': ratio}},
    }
    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        data=json.dumps(body).encode(), method='POST', headers={'Content-Type': 'application/json'})
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
    print('ok', out_path, Image.open(out_path).size, data.get('usageMetadata', {}))


if __name__ == '__main__':
    main(sys.argv[1:])
