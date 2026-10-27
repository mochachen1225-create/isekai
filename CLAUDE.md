# 給 Claude 的工作規則

換新 session 時從這裡接。這個 repo 是公開的（`site` 分支會發到 GitHub Pages），草稿、沒用到的圖、個人資料都不要放進來。

## 1. 專案地圖

| 東西 | 在哪裡 |
|---|---|
| 網站（測驗＋連載） | 這個 repo 的 `site` 分支，push 後 GitHub Pages 自動更新；同時推一份到 `story-draft` |
| 測驗設計稿 | `DESIGN.md`（第 12 章是插畫美術規範和各職業定稿紀錄） |
| 職業插畫指令 | `PROMPTS.md` |
| 推廣計畫 | https://claude.ai/artifact/MZpjDvX1fNDdtxfv3eqyjT（Claude Docs） |
| 進度表（待辦＋發文排程） | https://claude.ai/artifact/EbWR1U1Twg1p5f6trDkwDT（資料在 db 的 `tasks`） |
| 連載草稿本（還沒上線的小說、分鏡、prompt） | https://claude.ai/artifact/N9vUVni1oPJ4f1FYmzQySi（Claude Docs；「總覽」分頁放打勾清單和各話連結，每一話一個分頁） |
| 世界觀設定集 | https://claude.ai/artifact/LYw7AbqJjjDvJ9hwCDfxno（Claude Docs） |
| 素材庫（沒用在連載、可單獨發的圖） | https://claude.ai/artifact/VpLeUwx1DQxYUz4pReewvp |
| 預告片工作檯 | https://claude.ai/artifact/3UpfrfLTVP8vi9Lzvn2UYU |
| 冷啟動數據紀錄表 | https://claude.ai/artifact/6BXsmJZF8TZYbUWAXTXD76 |
| 工作檔（漫畫原圖、設定圖、修圖和排字程式、LINE 貼圖原始檔、預告片素材、使用者傳的圖） | 私人 repo `mochachen1225-create/isekai-studio`（main）。暫存資料夾會隨容器回收消失，做完一批就推上去 |

以上 artifact 都是私人的，只有使用者看得到。

## 2. 分工和排程

- 小說：Claude 寫草稿放草稿本，使用者在總覽打勾 OK（或留言要改），Claude 上線。
- 漫畫：Claude 寫分鏡和 prompt、自己用 API 畫、自己檢查、修圖、排字、上線（規則見第 3 節）。
- 發文：Claude 在進度表準備好配圖和可複製的文案；使用者自己在 app 排程、上傳巴哈和 LINE WEBTOON。
- 影片：使用者用 Gemini App 做（比 API 便宜），Claude 剪接（第 5 節）。
- 進度表每一項都要有 owner（你／我／一起）和 due。欄位：done、owner、due、time、title、note、link、linkText、caption。每話做好後，把那一話的 Threads／IG 項目補上配圖和文案。
- 排程任務（都送回這個 session）：
  - 每週日 19:41（台灣時間）：準備下一話的草稿、分鏡、prompt 和下週文案，推播通知。
  - 每天 18:47：讀進度表，有「你／一起」今天到期或逾期的項目就推播，沒有就不出聲。
- 更新節奏：每週三 21:00 小說＋漫畫一起上線，週四 IG 輪播。11/11 正式開跑，開跑前存稿到第 5 話。

## 3. 生圖（Gemini API）

- 工具：`tools/gemini_image.py prompt.txt out.png [參考圖…] --ratio=4:5`，預設模型 `gemini-3.1-flash-image`。金鑰在 Network secrets。
- 費用：每張約 NT$2.2。帳戶是預付制，不要開自動儲值。Google Cloud 帳單幣別是台幣，設預算或上限時填的是台幣（曾誤設成 NT$5 害 API 被擋）。**預估餘額不到 NT$20 就停下來告訴使用者。** 2026-10-28 報表顯示 10 月已花 NT$107.15，使用者要再儲值。
- 連載漫畫和設定圖（2026-10-28 使用者同意）：Claude 自己決定生成，不用每格問。
  - 參考圖用 `isekai-studio` 的 `work/model/`：s1 女主角三視圖、s2 Q 版表情、s3 橘貓比例（站著比她高一個頭）、s4 樹屋內、s5 夜市街、s6 超市、s7 鵜鶘和貓頭鷹。
  - 每格 prompt 都貼同一段 [STYLE]、[WOMAN]、[CAT] 描述，場景格再加 [WORLD]（都在草稿本第三話分頁）。世界觀不是中世紀歐洲風，是人類、動物和想像混搭，有金屬也有天然材質（設定集「世界的樣子」）。
  - 畫完自己檢查：手臂和手的數量、頭的數量、大小比例、畫風、有沒有字或標誌、同一個人有沒有被畫兩次。不合格只重畫那一格。
  - 每話畫完把比較圖放進草稿本。
- 職業插畫和其他新圖：先給使用者看英文 prompt 和中文構圖說明，使用者回「生成」才呼叫。一次最多 3 張。
- 省錢：全新構圖畫 2 張挑；修改只畫 1 張，想改的地方一次寫進同一個 prompt。同一張圖改太多次會被舊構圖綁住，改不動就用定稿參考圖重畫。
- 失敗就停下來回報，不自動重試、不寫會自己重跑的迴圈。連續畫多張用 `set -e` 或 `|| exit`，不要把輸出接 pipe（`| cut` 會吃掉錯誤碼）。
- 圖片小問題優先用程式修（放大貓、去標誌、縮小人物、疊暖光），不用重畫。做法見 `isekai-studio` 的 `work/comic2/`。
- 光影改不出來時，可以用程式在光源方向疊暖色（見 `DESIGN.md` 守護騎士的紀錄）。
- 職業插畫選定後縮成 900 寬放進 `assets/illustrations/`。28 張已在 2026-10-27 全部換成新畫風，定稿紀錄在 `DESIGN.md` 第 12 章。
- 試過 Cloudflare Workers AI 的 FLUX.2（`tools/cf_image.py`），使用者覺得太醜，不採用。

## 4. 連載《貓貓勇者小隊》

- 頁面在 `story/`：目錄 `index.html`，每話小說 `NN.html`、漫畫 `NN-comic.html`（圖在 `story/comic/NN-1.jpg`…），共用 `story.css`。遊戲首頁有連結。
- 新增一話：複製上一話的 html 改內容；在 `story/index.html` 目錄加一行，把上一話的「準備中」改成連結；重跑 `tools/subset_font.py`（它會掃 `story/*.html`）。
- 使用者常常用碎片的方式想設定：每次聽到新的想法，就幫她釐清、寫進設定集對應的地方，檢查有沒有跟舊設定或已寫的話數衝突；有衝突或缺的，列在設定集最後「設定檢視」區，給二到三個草案讓她選。不要的設定刪掉，不要越堆越多。
- 寫新的一話前先讀設定集，照「寫作口氣指南」：異世界輕小說風格、短句、少用「我」、可以有台味、設定只露不解釋（讓讀者自己發現）、前面輕鬆。
- 用字：敘述裡叫「橘貓」，不要叫「喵導員」；她在第六話（暫定）有禮貌地問名字、牠自我介紹之後，才改叫「喵導員」。故事裡不出現使用者的家人。
- 漫畫不用跟小說逐字對應，要有 webtoon 的節奏感。台詞全部後製排字，圖裡不放字；每格 prompt 最後加「Leave clear empty space for speech bubbles.」。
- 漫畫的字（2026-10-28 使用者定）：
  - 內心話：沒有框，一排小字（粉圓體，白字加淡淡的深色陰影；淺色底用深字）。`s.line()`，或 `bubble(kind='thought')`。
  - 劇情旁白（不是內心話）：白色方框、黑框線、黑字。`s.narr()`。
  - 說話：橢圓對話框加尾巴。`s.bubble()`。不要用一圈小圓圓的雲朵框（使用者覺得醜）。
  - 很大的聲音、吶喊：大大的貼圖字（小瀨體、粗描邊）。`s.sfx()`，或 `bubble(kind='shout')`。
- 漫畫排成一整條直式條漫（2026-10-28 起）：排版程式 `isekai-studio` 的 `work/wt/webtoon.py`，每話寫一個 `epNN.py`（格間底色跟著時間變、滿版／小框、對話框、心聲、旁白、狀聲詞、留白停頓）。輸出切成 800×1280（LINE WEBTOON 規格），放 `story/comic/NN-s-XX.jpg`，`NN-comic.html` 用 `<div class="strip">` 連續排。單格圖 `NN-1.jpg`… 留著給 IG 輪播用。每話的排版計畫寫在草稿本該話分頁的「條漫排版」。

## 5. 職業短片預告

- 使用者用 Gemini App 做 10 秒短片（每天 3 支），Claude 用 `tools/make_trailer.py config.json` 剪成直式預告：字卡 → 三個鏡頭（慢動作，不要放大推近）→ 個性字卡 → 片名＋遊戲網址。範例在 `tools/trailer_example.json`。
- 配樂用 Gemini 做的歌的「中段比較豐富的段落」；男版咖啡師配慵懶法式（Rainfall on Saint-Germain），女版配 Bossa Nova（Café Promenade）；勇者配輕快冒險風，從第 42 秒開始。可愛的鏡頭（例如貓咬麵包）放更慢、多停一兩秒。
- 橫式來源用「置中＋上下模糊背景」，不要裁成直式填滿。請使用者在影片 prompt 最後加「Vertical 9:16 video.」。
- 個性字卡三段：第一句結論（例：你是讓人安心的那種人。）→ 兩三句具體行為 → 身邊的人跟你在一起的感覺。正向。
- 做好的預告放 `promo/<職業>_<m|f>.mp4`（commit 到 site 分支，手機可以從 GitHub Pages 存影片）。同時加進工作檯頁面：先用 Artifact read 讀回原始檔，在 `DONE` 物件加 key 和貼文文字，影片放 artifact 的 `video/<key>.mp4`。

## 6. 一定要遵守

- 任何事實、數字、日期、平台規定，先搜尋再說。
- 不貼金鑰。筆名帳號（巴哈、LINE WEBTOON）跟使用者的個人身分分開。
- AI 作品要誠實標示（巴哈勾「AI 創作」、LINE WEBTOON 簡介寫「AI 輔助作畫」、不參加禁止 AI 的比賽）。
- 不畫任天堂、薩爾達等現有作品的官方角色。
