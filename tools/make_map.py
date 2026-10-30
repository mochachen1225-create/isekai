"""首頁世界地圖（10/30 改版）：AI 畫的藏寶圖 assets/home/map.jpg 當底，上面蓋一層黑霧；
到過的國家在霧上挖洞亮出來（js/home.js 幫 [data-country] 加 reached／current，霧的洞和名牌都靠這兩個 class）。
新國家：在 C 加一行（id 要跟 data/arcs.json 一樣），座標是 map.jpg（1200×896）上的位置。"""
C = [  # id, 中心 x, y, 半徑 rx, ry, 名字, 名牌位置
    ('moonpupil', 600, 444, 185, 165, '月瞳國', (600, 600)),
    ('xiaoyuan', 990, 400, 200, 150, '嘯原', (990, 520)),
    ('', 565, 140, 240, 105, '', None), ('', 210, 290, 210, 115, '', None), ('', 200, 670, 230, 210, '', None),
    ('', 600, 760, 170, 110, '', None), ('', 985, 720, 230, 165, '', None)]
o = ['<svg viewBox="0 0 1200 896" role="img" aria-label="世界地圖：只有已經去過的國家會亮起來">',
     '<defs><filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="28"/></filter>',
     '<filter id="smoke"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="4" seed="5"/><feColorMatrix values="0 0 0 0 .07  0 0 0 0 .05  0 0 0 0 .04  0 0 0 -.9 1.25"/></filter>',
     '<mask id="fogmask"><rect width="1200" height="896" fill="#fff"/>']
for cid, x, y, rx, ry, nm, lab in C:
    if cid: o.append(f'<g data-country="{cid}"><ellipse class="hole" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#000" filter="url(#soft)"/></g>')
o += ['</mask></defs>', '<image href="assets/home/map.jpg" width="1200" height="896"/>',
      '<g mask="url(#fogmask)"><rect width="1200" height="896" fill="#120c07" opacity=".9"/><rect width="1200" height="896" filter="url(#smoke)" opacity=".7"/></g>']
for cid, x, y, rx, ry, nm, lab in C:
    g = f' data-country="{cid}"' if cid else ''
    s = [f'<g{g}>', f'<text class="unk" x="{x}" y="{y + 18}" text-anchor="middle">？</text>']
    if cid:
        s.append(f'<text class="name" x="{lab[0]}" y="{lab[1]}" text-anchor="middle">{nm}</text>')
        s.append(f'<g class="you" transform="translate({x + 70} {y - 40})"><path d="M-14 -14 L14 14 M14 -14 L-14 14"/></g>')
    s.append('</g>'); o += s
o.append('</svg>')
print('\n'.join(o))
