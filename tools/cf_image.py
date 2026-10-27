"""用 Cloudflare Workers AI 的 FLUX.2 畫一張圖（可附最多 4 張參考圖）。

一次執行只呼叫一次 API，失敗就結束、不重試（見 CLAUDE.md）。

需要的環境變數：CLOUDFLARE_ACCOUNT_ID。
API Token 由環境的 Network secrets 代理自動加上（Claude 看不到）；本機測試時才需要 CLOUDFLARE_API_TOKEN。

用法：
  python3 tools/cf_image.py prompt.txt out.png [ref1.jpg ref2.jpg ...] [--model=@cf/black-forest-labs/flux-2-dev] [--size=768x1024]
"""
import base64, io, json, os, sys, urllib.request, uuid
from PIL import Image

MODEL = '@cf/black-forest-labs/flux-2-dev'
REF_MAX = 511  # 參考圖必須小於 512×512


def ref_bytes(path):
    im = Image.open(path).convert('RGB')
    im.thumbnail((REF_MAX, REF_MAX), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'PNG')
    return buf.getvalue()


def multipart(fields, files):
    boundary = uuid.uuid4().hex
    out = io.BytesIO()
    for k, v in fields.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    for k, data in files.items():
        out.write(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"; filename="{k}.png"\r\nContent-Type: image/png\r\n\r\n'.encode())
        out.write(data)
        out.write(b'\r\n')
    out.write(f'--{boundary}--\r\n'.encode())
    return out.getvalue(), f'multipart/form-data; boundary={boundary}'


def main(argv):
    args = [a for a in argv if not a.startswith('--')]
    model = next((a.split('=', 1)[1] for a in argv if a.startswith('--model=')), MODEL)
    w, h = next((a.split('=', 1)[1] for a in argv if a.startswith('--size=')), '768x1024').split('x')
    if len(args) < 2:
        sys.exit(__doc__)
    prompt = open(args[0], encoding='utf-8').read().strip()
    out_path, refs = args[1], args[2:6]
    account, token = os.environ.get('CLOUDFLARE_ACCOUNT_ID'), os.environ.get('CLOUDFLARE_API_TOKEN')
    if not account:
        sys.exit('缺少 CLOUDFLARE_ACCOUNT_ID')

    # 直式 3:4
    body, ctype = multipart({'prompt': prompt, 'width': w, 'height': h},
                            {f'input_image_{i}': ref_bytes(p) for i, p in enumerate(refs)})
    req = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/{model}',
        data=body, method='POST',
        headers={'Content-Type': ctype, **({'Authorization': f'Bearer {token}'} if token else {})})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            raw, rtype = r.read(), r.headers.get('Content-Type', '')
    except urllib.error.HTTPError as e:
        sys.exit(f'API 錯誤 {e.code}：{e.read().decode(errors="replace")[:800]}')

    if rtype.startswith('image/'):
        img = raw
    else:
        data = json.loads(raw)
        result = data.get('result', data)
        b64 = result.get('image') if isinstance(result, dict) else None
        if not b64:
            sys.exit(f'回傳裡沒有圖片：{raw[:800]!r}')
        img = base64.b64decode(b64)
    with open(out_path, 'wb') as f:
        f.write(img)
    print('ok', out_path, Image.open(out_path).size)


if __name__ == '__main__':
    main(sys.argv[1:])
