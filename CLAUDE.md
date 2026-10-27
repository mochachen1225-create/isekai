# 給 Claude 的工作規則

## 職業插畫（Gemini 生圖）

- 美術規範和每個職業的角色設定都在 `DESIGN.md` 第 12 章。畫新圖前先讀。
- **呼叫圖片 API 前一定要先確認**：先輸出英文 Prompt 和構圖構想（中文說明）給使用者看，等使用者回覆「生成」才可以呼叫 API。使用者沒說「生成」，就只討論、不呼叫。
- 每次呼叫前說清楚這次會產生幾張圖。一次最多 3 張；不要自動重試、不要寫會自己一直重跑的迴圈。呼叫失敗就停下來，回報錯誤。
- 例外：連載漫畫（2026-10-28 起）。每話先把整份分鏡和 12 格的 prompt 一次講清楚（構圖、參考圖、比例、要避免的錯），使用者回一次「生成」就畫完整話（每格 1 張，約 NT$26）。失敗就停下來回報、不重試。之後重畫個別格子，還是一張一張確認。目標是一次到位，不要來回浪費 API 費用。
- 產生的圖先整理成比較圖給使用者挑，選定後才縮成 900 寬、放進 `assets/illustrations/`。
- 同一張圖修改太多次會被舊構圖綁住。改不動時，換成用定稿參考圖重新生成。
- 光影改不出來時，可以用程式在光源方向疊暖色（見 `DESIGN.md` 守護騎士的紀錄）。

## 目前進度（換新 session 時從這裡接）

- 2026-10-27 全部 28 張職業插畫都換成新畫風了。之後若要再改，照 `DESIGN.md` 第 12 章各職業的定稿紀錄。
- 新畫風已完成：咖啡館店長、勇者、熱血格鬥家、守護騎士（男女版共 8 張）、結界師、聖職者、伙食長、吟遊詩人、祭典花火師、鍊金術師、占星術師、探險家、馴獸師（男女版共 26 張；結界師已重畫成 v2）、貓之勇者（全部完成），設定在 `DESIGN.md` 第 12 章的表格。
- 2026-10-27 試過 Cloudflare Workers AI 的免費 FLUX.2（`tools/cf_image.py`）：畫風勉強接近，但使用者覺得太醜，不採用。插畫繼續用 Gemini。
- 生成前檢查：人物的手臂和手的數量、動物的頭數、有沒有重複畫出同一個人。動作越複雜越容易出錯。
- 省錢原則：全新構圖一次畫 2 張挑選；修改只畫 1 張，而且把想改的地方一次寫進同一個 prompt（「一次改到位」）。
- Gemini API 已接好（2026-10-27）：`tools/gemini_image.py`，預設模型 `gemini-3.1-flash-image`（Nano Banana 2）。金鑰在 Network secrets，帳戶是預付制（NT$150，用完自動停），不要開自動儲值。Google Cloud 的帳單幣別是台幣：設預算或花費上限時填的數字是台幣（曾經誤設成 NT$5，害 API 被擋）。
- 這個網站在 `site` 分支，push 後 GitHub Pages 自動更新。
- 連續畫多張時用 `set -e` 或 `|| exit`，不要把 `tools/gemini_image.py` 的輸出接 pipe（`| cut` 會吃掉錯誤碼，失敗了也不會停）。

## 職業短片預告（2026-10-27 起）

- 使用者用 Gemini App 做 10 秒短片（每天 3 支，不用 API），我用 `tools/make_trailer.py config.json` 剪成直式預告：字卡 → 三個鏡頭（慢動作，不要放大推近：使用者覺得放大很醜）→ 個性字卡 → 片名＋遊戲網址。範例設定在 `tools/trailer_example.json`。
- 使用者偏好：配樂用 Gemini 做的歌的「中段比較豐富的段落」；男版咖啡師配慵懶法式（Rainfall on Saint-Germain），女版配 Bossa Nova（Café Promenade）；勇者配輕快冒險風，從歌曲第 42 秒的輕快段落開始。有可愛重點的鏡頭（例如貓咬麵包）放得更慢、多停一兩秒。
- 橫式來源：使用者選「置中＋上下模糊背景」的版本，不要裁成直式填滿。請使用者在影片 prompt 最後加「Vertical 9:16 video.」。
- 個性字卡三段：第一句結論（例：你是讓人安心的那種人。）→ 兩三句具體行為的立體描述 → 身邊的人跟你在一起的感覺。正向。
- 每支影片的三段故事 prompt 在工作檯頁面 https://claude.ai/artifact/3UpfrfLTVP8vi9Lzvn2UYU（私人）。
- 做好的預告放在 `promo/<職業>_<m|f>.mp4`（commit 到 site 分支，GitHub Pages 的網址可以在手機開啟、存影片）。同時加進工作檯頁面：在頁面的 `DONE` 物件加上 key 和貼文文字，影片放到 artifact 的 `video/<key>.mp4`。工作檯頁面的原始檔要先用 Artifact read 讀回來再改。

## 線上小說《貓貓勇者小隊》（2026-10-27 起）

- 頁面在 `story/`（目錄 `index.html`、每話一個 `01.html`、`02.html`…，共用 `story.css`），遊戲首頁有「開始連載中」的連結。
- 世界觀、角色、寫作口氣都在設定集文件 https://claude.ai/artifact/LYw7AbqJjjDvJ9hwCDfxno（私人），寫新的一話前先讀，照「寫作口氣指南」寫：短句、不一五一十交代、少用「我」、可以有台味。
- 沒用在連載、但適合單獨發 IG／Threads 的圖，放在素材庫頁面 https://claude.ai/artifact/VpLeUwx1DQxYUz4pReewvp（私人）。不要放進 repo：這個 repo 推上去就會出現在 GitHub Pages，任何人都看得到（還沒定稿的草稿也一樣）。
- 分工（2026-10-28 起）：小說由 Claude 寫草稿，使用者看過微調，說 OK 就由 Claude 上線。漫畫由 Claude 寫分鏡和 prompt，使用者回「生成」後用 API 畫，Claude 修圖、排字、上線。還沒上線的小說草稿和漫畫 prompt 放連載草稿本 https://claude.ai/artifact/N9vUVni1oPJ4f1FYmzQySi（Claude Docs，私人，使用者可以直接在上面改），不放 repo、也不只放 scratchpad（容器回收就不見了）。每週日 19:41（台灣時間）有排程任務自動準備下一週的內容。每天 18:47 另有一個排程任務：讀進度表，有「你／一起」今天到期或逾期的項目就推播提醒，沒有就不出聲。進度表每一項都要寫 owner（你／我／一起）和 due。
- 推廣計畫在 https://claude.ai/artifact/MZpjDvX1fNDdtxfv3eqyjT（Claude Docs）：11/11 正式開跑，開跑前存稿到第 5 話。
- 更新節奏：每週三晚上小說＋漫畫一起上線，週四 IG 輪播。待辦和發文排程（日期、配圖連結、可複製的文案）都在進度表 https://claude.ai/artifact/EbWR1U1Twg1p5f6trDkwDT 的 `tasks`（欄位 due、time、caption、link、linkText）。每話做好後，把那一話的 Threads／IG 項目補上配圖和文案。
- 新增一話：複製 `story/01.html` 改內容，在 `story/index.html` 目錄加一行、把上一話的「準備中」改成連結，然後重跑 `tools/subset_font.py`（它也會掃 `story/*.html`）。
