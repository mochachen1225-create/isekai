# 異世界轉生職業測驗

三分鐘的異世界小冒險：在點陣小地圖上自由走動，完成 6 個事件，得到你的「轉生職業」，再用分享連結和朋友組成四人隊伍。純屬娛樂，不收集任何個人資料。

- 設計稿：[`DESIGN.md`](DESIGN.md)
- Gemini 插畫指令與進度：[`PROMPTS.md`](PROMPTS.md)
- 地圖背景是 `assets/map/village.webp`（Gemini 繪製），可以走的格子和事件位置定義在 `js/world.js` 最上面的 `ROWS`
- 插畫放在 `assets/illustrations/`，檔名照 `PROMPTS.md` 的表格（例如 `hero_f.jpg`），放進去就會自動顯示

## 本機試玩

這是純靜態網站，不需要安裝任何東西：

```
python3 -m http.server 8000
```

然後打開 http://localhost:8000

## 檢查計分平衡

```
node tools/simulate.mjs     # 跑過全部 4,096 種選法，檢查每個職業出現的比例
node tools/tune.mjs         # 重新計算平衡用的微調值（改了選項的分數之後才需要）
```

## 字型

標題和內文使用 [jf open 粉圓](https://github.com/justfont/open-huninn-font)（SIL Open Font License 1.1，授權全文在 `fonts/OFL.txt`）。
`fonts/huninn.woff2` 只包含網站用到的字；改了遊戲文字之後，要用 `tools/subset_font.py` 重新產生。
