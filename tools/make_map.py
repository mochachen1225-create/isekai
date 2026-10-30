"""首頁世界地圖（10/30 改版）：AI 畫的藏寶圖 assets/home/map.jpg 當底，上面蓋一層黑霧；
到過的國家在霧上挖洞亮出來（js/home.js 幫 [data-country] 加 reached／current，霧的洞和名牌都靠這兩個 class）。
新國家：在 C 加一行（id 要跟 data/arcs.json 一樣），座標是 map.jpg（1200×896）上的位置。"""
C = [  # id, 中心 x, y, 半徑 rx, ry, 名字（空的＝不放名牌）, 名牌位置；10/30 她說貓國走到狗國是陸路 → 地圖換成陸地相連的 m4
    ('moonpupil', 414, 440, 165, 150, '月瞳國', (414, 600)),
    ('road', 740, 455, 165, 155, '', None),          # 第 14～17 話：森林、農地、過河
    ('xiaoyuan', 975, 380, 200, 140, '嘯原', (1000, 500)),
    ('', 565, 130, 240, 100, '', None), ('', 215, 285, 200, 110, '', None), ('', 190, 690, 210, 200, '', None),
    ('', 600, 790, 170, 90, '', None), ('', 1000, 740, 220, 150, '', None)]
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
    s = [f'<g{g}>', f'<text class="unk" x="{x}" y="{y + 18}" text-anchor="middle">？</text>' if nm or not cid else '']
    if cid:
        if nm: s.append(f'<text class="name" x="{lab[0]}" y="{lab[1]}" text-anchor="middle">{nm}</text>')
        s.append(f'<g class="you" transform="translate({x + 70} {y - 40})"><path d="M-14 -14 L14 14 M14 -14 L-14 14"/></g>')
    s.append('</g>'); o += s
o.append('</svg>')
print('\n'.join(o))
