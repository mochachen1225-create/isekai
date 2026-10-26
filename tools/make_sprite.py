"""把 Gemini 畫的綠底小人去背、裁切、縮小，存成 assets/sprites/<名字>.png

用法：python3 tools/make_sprite.py 原圖.jpg player_m
"""
import pathlib
import sys

from PIL import Image

HEIGHT = 96  # 輸出高度（像素），遊戲裡大約顯示成 1.3 格高

src, name = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
px = im.load()
w, h = im.size
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        green = g - max(r, b)
        if green > 60 and g > 120:
            px[x, y] = (0, 0, 0, 0)            # 背景
        elif green > 20:
            px[x, y] = (r, max(r, b), b, a)    # 邊緣去掉綠色反光
box = im.getbbox()
im = im.crop(box)
scale = HEIGHT / im.height
im = im.resize((max(1, round(im.width * scale)), HEIGHT), Image.LANCZOS)
# 半透明的邊緣收乾淨，點陣圖才不會糊
px = im.load()
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        px[x, y] = (r, g, b, 255 if a > 110 else 0)
out = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'sprites' / f'{name}.png'
im.save(out, optimize=True)
print(out, im.size)
