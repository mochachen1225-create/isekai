"""首頁世界地圖（藏寶圖風，10/30 她選）：羊皮紙底、手繪海岸線；沒到過的國家蓋黑霧，到過的亮起來（js/home.js 加 reached／current）。
輸出一段 <svg>，貼進 index.html 的 .map 裡。國家 id 要跟 data/arcs.json 一致。"""
import math, random
def blob(cx, cy, rx, ry, seed, n=90, wob=0.13):
    r = random.Random(seed); ph = [r.uniform(0, 6.28) for _ in range(4)]
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        k = 1 + wob * (math.sin(3 * a + ph[0]) * .5 + math.sin(5 * a + ph[1]) * .3 + math.sin(9 * a + ph[2]) * .2) + r.uniform(-.025, .025)
        pts.append((cx + rx * k * math.cos(a), cy + ry * k * math.sin(a)))
    return 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
# id（沒有就是還不知道的國家）、中心、大小、名字
C = [('moonpupil', 300, 245, 92, 68, '月瞳國'), ('xiaoyuan', 500, 290, 78, 56, '嘯原'),
     (None, 140, 120, 80, 50, ''), (None, 470, 105, 85, 48, ''), (None, 115, 330, 70, 55, ''),
     (None, 300, 410, 70, 34, ''), (None, 560, 425, 50, 30, ''), (None, 280, 90, 45, 28, '')]
def tree(x, y, s=1):
    return f'<g class="ink" transform="translate({x} {y}) scale({s})"><path d="M0 0 v-9"/><circle cx="0" cy="-15" r="7"/><circle cx="-6" cy="-11" r="5"/><circle cx="6" cy="-11" r="5"/></g>'
def house(x, y):
    return f'<g class="ink" transform="translate({x} {y})"><path d="M-7 0 v-9 l7 -7 l7 7 v9z"/><path d="M-2 0 v-5 h4 v5"/></g>'
def mount(x, y, s=1):
    return f'<g class="ink" transform="translate({x} {y}) scale({s})"><path d="M-16 0 l9 -16 l6 8 l5 -6 l12 14"/><path d="M-7 -16 l3 7"/></g>'
DECO = {'moonpupil': tree(300, 228, 2.2) + house(262, 262) + house(280, 275) + house(330, 270) + tree(240, 238) + tree(355, 240) + mount(330, 215, .9),
        'xiaoyuan': mount(480, 285) + mount(510, 300, .8) + tree(540, 285) + house(470, 312)}
out = ['<svg viewBox="0 0 640 480" role="img" aria-label="世界地圖：只有已經去過的國家會亮起來">',
 '<defs><filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .15  0 0 0 .35 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="multiply"/></filter>',
 '<filter id="fog"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 .08  0 0 0 0 .06  0 0 0 0 .05  0 0 0 1.4 -.2"/><feComposite in2="SourceGraphic" operator="in"/></filter>',
 '<radialGradient id="burn" cx="50%" cy="50%" r="65%"><stop offset="35%" stop-color="#1e1208" stop-opacity="0"/><stop offset="100%" stop-color="#140b04" stop-opacity=".85"/></radialGradient>',
 '<linearGradient id="parch" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9C7748"/><stop offset="1" stop-color="#5E4022"/></linearGradient></defs>']
# 撕邊羊皮紙
r = random.Random(4); edge = []
for x in range(10, 631, 20): edge.append((x, 12 + r.uniform(-6, 6)))
for y in range(12, 469, 20): edge.append((628 + r.uniform(-6, 6), y))
for x in range(630, 9, -20): edge.append((x, 468 + r.uniform(-6, 6)))
for y in range(468, 11, -20): edge.append((12 + r.uniform(-6, 6), y))
paper = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in edge) + 'Z'
out += [f'<path d="{paper}" fill="url(#parch)" filter="url(#paper)"/>',
 '<g class="sea"><path d="M40 200 q8 -6 16 0 t16 0"/><path d="M560 170 q8 -6 16 0 t16 0"/><path d="M200 340 q8 -6 16 0 t16 0"/><path d="M420 400 q8 -6 16 0 t16 0"/><path d="M60 430 q8 -6 16 0 t16 0"/></g>',
 '<rect x="30" y="30" width="580" height="420" fill="none" stroke="#6b4a26" stroke-width="1.5" stroke-dasharray="6 5" opacity=".6"/>']
for cid, cx, cy, rx, ry, nm in C:
    d = blob(cx, cy, rx, ry, hash(nm or cx) % 999 if False else cx * 7 + cy)
    attrs = f' data-country="{cid}"' if cid else ''
    g = [f'<g{attrs}>', f'<ellipse class="glow" cx="{cx}" cy="{cy}" rx="{rx*1.25:.0f}" ry="{ry*1.25:.0f}"/>', f'<path class="land" d="{d}"/>']
    if cid:
        g.append(f'<g class="deco">{DECO.get(cid, "")}</g>')
        g.append(f'<text class="name" x="{cx}" y="{cy + ry*0.75:.0f}" text-anchor="middle">{nm}</text>')
        if cid == 'xiaoyuan': g.insert(1, '<path class="route" d="M345 262 q60 -10 105 25"/>')
    g.append(f'<path class="fog" d="{d}" filter="url(#fog)"/>')
    g.append(f'<text class="unk" x="{cx}" y="{cy + 6}" text-anchor="middle">？</text>')
    if cid: g.append(f'<g class="you" transform="translate({cx + rx*0.42:.0f} {cy + ry*0.05:.0f})"><path d="M-7 -7 L7 7 M7 -7 L-7 7"/></g>')
    g.append('</g>'); out += g
# 羅盤（腳印當指針）
out += ['<g class="compass" transform="translate(565 85)"><circle r="30"/><circle r="24" stroke-dasharray="2 3"/><path d="M0 -34 L6 0 L0 34 L-6 0Z" class="fillink"/><path d="M-34 0 L0 5 L34 0 L0 -5Z"/><circle r="3" class="fillink"/></g>',
        f'<path d="{paper}" fill="url(#burn)" pointer-events="none"/>', '</svg>']
print('\n'.join(out))
