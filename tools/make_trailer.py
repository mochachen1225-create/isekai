# 動畫預告片（通用版）：直式 720x1280。橫式來源會放在中間、背景用同一段畫面模糊填滿。
# 用法：python3 trailer2.py config.json
import json, subprocess, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
C = json.load(open(sys.argv[1], encoding='utf-8'))
SRC, MUSIC, WORK, OUT = C['src'], C['music'], C['work'], C['out']
FONT = C.get('font', '/tmp/huninn.ttf')  # 粉圓體完整字型，下載方式見 tools/subset_font.py 開頭
W, H, FPS = 720, 1280, 24
GRADE = 'eq=contrast=1.06:saturation=0.92,vignette=PI/5,noise=alls=5:allf=t'
def f(s): return ImageFont.truetype(FONT, s)
def run(*a): subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)
sw, sh = map(int, subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', SRC]).decode().strip().split(','))
landscape = sw > sh

def center(d, y, s, size, fill):
    w = d.textlength(s, font=f(size)); d.text(((W - w) / 2, y), s, font=f(size), fill=fill)

def card(name, lines):
    im = Image.new('RGB', (W, H), (10, 8, 6)); d = ImageDraw.Draw(im)
    y = H // 2 - 40 * len(lines)
    for s in lines: center(d, y, s, 46, (240, 228, 210)); y += 80
    im.save(f'{WORK}/{name}.png')

def shot(name, ss, dur, speed, z0, z1, cx=0.5, cy=0.5, px0=None, px1=None):
    out_d = dur / speed; n = int(out_d * FPS)
    z = f"{z0}+({z1}-{z0})*on/{n}"
    pre = f"setpts={1/speed}*PTS,fps={FPS}"
    if landscape and C.get('fill'):
        # 橫式來源裁成直式填滿：裁切框可以從 px0 平移到 px1（0~1 是畫面中心的水平位置）
        a = px0 if px0 is not None else 0.5; b = px1 if px1 is not None else a
        cw = round(sh * 9 / 16 / 2) * 2
        xexpr = f"max(0,min(iw-{cw},iw*({a}+({b}-{a})*t/{out_d})-{cw}/2))"
        vf = (f"{pre},crop={cw}:{sh}:'{xexpr}':0,scale={W*2}:{H*2},zoompan=z='{z}':x='iw*{cx}-iw/zoom/2':y='ih*{cy}-ih/zoom/2':d=1:s={W}x{H}:fps={FPS},"
              f"{GRADE},fade=in:d=0.4,fade=out:st={out_d-0.4}:d=0.4,format=yuv420p")
        run('-ss', str(ss), '-t', str(dur), '-i', SRC, '-an', '-vf', vf, '-t', str(out_d), f'{WORK}/{name}.mp4')
    elif landscape:
        fw = W; fh = round(W * sh / sw / 2) * 2
        vf = (f"[0:v]{pre},split[a][b];"
              f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},boxblur=20:2,eq=brightness=-0.18[bg];"
              f"[b]scale={fw*2}:{fh*2},zoompan=z='{z}':x='iw*{cx}-iw/zoom/2':y='ih*{cy}-ih/zoom/2':d=1:s={fw}x{fh}:fps={FPS}[fg];"
              f"[bg][fg]overlay=0:(H-h)/2,{GRADE},fade=in:d=0.4,fade=out:st={out_d-0.4}:d=0.4,format=yuv420p")
        run('-ss', str(ss), '-t', str(dur), '-i', SRC, '-an', '-filter_complex', vf, '-t', str(out_d), f'{WORK}/{name}.mp4')
    else:
        vf = (f"{pre},scale={W*2}:{H*2},zoompan=z='{z}':x='iw*{cx}-iw/zoom/2':y='ih*{cy}-ih/zoom/2':d=1:s={W}x{H}:fps={FPS},"
              f"{GRADE},fade=in:d=0.4,fade=out:st={out_d-0.4}:d=0.4,format=yuv420p")
        run('-ss', str(ss), '-t', str(dur), '-i', SRC, '-an', '-vf', vf, '-t', str(out_d), f'{WORK}/{name}.mp4')

def still(name, png, dur, fi=0.5, fo=0.5):
    run('-loop', '1', '-t', str(dur), '-i', png, '-vf', f'fps={FPS},fade=in:d={fi},fade=out:st={dur-fo}:d={fo},format=yuv420p', f'{WORK}/{name}.mp4')

for i, lines in enumerate(C['cards'], 1): card(f't{i}', lines)
for i, s in enumerate(C['shots'], 1): shot(f's{i}', *s)

run('-sseof', '-0.05', '-i', SRC, '-frames:v', '1', f'{WORK}/last.png')
def backdrop(blur, dark):
    im = Image.open(f'{WORK}/last.png').convert('RGB')
    r = max(W / im.width, H / im.height); im = im.resize((round(im.width * r), round(im.height * r)))
    l, t = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((l, t, l + W, t + H)).filter(ImageFilter.GaussianBlur(blur))
    return Image.blend(im, Image.new('RGB', (W, H), (12, 9, 6)), dark)

pb = backdrop(8, 0.7); d = ImageDraw.Draw(pb)
center(d, 330, f"如果你轉生成了「{C['job']}」", 32, (214, 190, 150))
y = 420
for line in C['persona']:
    if line: center(d, y, line, 42, (250, 240, 222))
    y += 64 if line else 30
pb.save(f'{WORK}/persona.png')

bg = backdrop(3, 0.55); d = ImageDraw.Draw(bg)
if C.get('eyebrow'): center(d, 470, C['eyebrow'], 34, (214, 190, 150))
center(d, 530, C['job'], 70, (250, 240, 222))
center(d, 640, f"「{C['tagline']}」", 32, (222, 206, 180))
center(d, 1010, '你，會轉生成什麼？', 40, (250, 240, 222))
url = 'mochachen1225-create.github.io/isekai'; w = d.textlength(url, font=f(28))
d.rounded_rectangle([(W - w) / 2 - 22, 1080, (W + w) / 2 + 22, 1132], 26, outline=(214, 190, 150), width=2)
d.text(((W - w) / 2, 1090), url, font=f(28), fill=(240, 228, 210))
bg.save(f'{WORK}/title.png')

parts = []
for i in range(len(C['shots'])):
    still(f'c{i+1}', f'{WORK}/t{i+1}.png', C['card_secs'][i]); parts += [f'c{i+1}', f's{i+1}']
still('cp', f'{WORK}/persona.png', C.get('persona_secs', 6.5), 0.8, 0.6)
still('ct', f'{WORK}/title.png', 4.5, 0.6, 1.2)
parts += ['cp', 'ct']
with open(f'{WORK}/list.txt', 'w') as fh: fh.writelines(f"file '{WORK}/{p}.mp4'\n" for p in parts)
run('-f', 'concat', '-safe', '0', '-i', f'{WORK}/list.txt', '-c:v', 'libx264', '-crf', '19', '-r', str(FPS), f'{WORK}/video.mp4')
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{WORK}/video.mp4']))
run('-i', f'{WORK}/video.mp4', '-ss', str(C['music_start']), '-i', MUSIC, '-filter_complex',
    f'[1:a]atrim=0:{dur},asetpts=PTS-STARTPTS,afade=t=in:d=1.5,afade=t=out:st={dur-2.5}:d=2.5[a]',
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', str(dur), '-movflags', '+faststart', OUT)
print('ok', round(dur, 1))
