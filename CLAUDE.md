# 給 Claude 的工作規則

換新 session 時從這裡接。這個 repo 是公開的（`site` 分支會發到 GitHub Pages），草稿、沒用到的圖、個人資料都不要放進來。

## 0. 交接（換 session 時先看這段，做完一件就改這段）

最後更新：2026-10-28。

**換 session 的規則**：對話很長（上下文被壓縮過一兩次）、或開始一件獨立的大工作（例如畫一整話漫畫）時，就開新 session。新 session 要選同一個 repo（`mochachen1225-create/isekai`，分支 `site`）和同一個環境（Network secrets 才會在）。開好後把兩個排程任務（每天 18:47 提醒、每週日 19:41 準備下週）重新綁到新 session，舊的刪掉。這件事由 Claude 自己判斷、自己做（使用者 10/28 交代）：先更新這段交接並 push，用 create_session 開新 session（給它清楚的開場任務），搬排程任務，最後告訴使用者新 session 的名字。私人工作檔 repo `isekai-studio` 要用 add_repo 加進來再 clone。

**現在最優先**（11/11 開跑，要存稿到第五話；10/28 晚上的狀態）：
1. 第三話漫畫：使用者 OK，已在 `ep03-stock`。夜市參考圖 s5 已重畫（巨樹＋圓石＋銅管）。
2. 第四話：10/28 使用者 OK（第 9、12 格重畫、第 11 格程式縮小她、最後一句改成「你們在幹嘛……」），已建 `ep04-stock`（在 `ep03-stock` 之上，含 `promo/ep04_comic.zip`、`ep04_bahamut.zip`；用 `work/wt/build_ep04_site.py`）。上線日合併到 site。
3. 第五話：10/28 使用者 OK（第 1、12 格橘貓放大、第 6 格補背景、第 7 格去空白框、搗蛋的是小貓），已建 `ep05-stock`（在 `ep04-stock` 之上，`work/wt/build_ep05_site.py`），進度表 bh1125／lw1125 已放上傳包。
4. 第六話：10/28 晚上畫完、排好條漫（`work/wt/ep06.py`，速寫頁是 Vertex 畫的 `comic6/psk.png`），已建 `ep06-stock`（在 `ep05-stock` 之上，`build_ep06_site.py`），進度表 bh1202／lw1202 已放上傳包；10/28 使用者 OK（速寫頁用 AI 版、第 4、5 格夜景不改）。第七話 10/28 晚上排好（`ep07.py`、`build_ep07_site.py`，已建 `ep07-stock`，bh1209／lw1209 已放上傳包），等使用者看。第八話 10/28 晚上排好（`ep08.py`、`build_ep08_site.py`，已建 `ep08-stock`，bh1216／lw1216 已放上傳包，release.json 加了 12/16），10/28 使用者 OK。第九話（貓頭鷹醫生，草稿本分頁 node `665ed922-428a`）小說 10/28 使用者 OK（她改了字：「病因：太認真工作。」等）；漫畫 10/28 晚上畫完排好（`ep09.py`、`build_ep09_site.py`，第 4 格用 Vertex 改成村莊市集背景 `p4c.png`），已建 `ep09-stock`，bh1223／lw1223 已放上傳包，release.json 加了 12/23，存稿閱讀器已加，等使用者看。第十話（魔王生日）小說 10/29 使用者 OK（她加了「包手、鐵板燒」那段，魔王下巴改藍灰）；分鏡寫在草稿本「第十話」分頁，prompt 在 `work/comic10/`（`mk.py`，13 格），等能畫圖再畫；傳單和牆上畫像用程式後製貼。第十一話（烏鴉用情報換十元硬幣、郵局情書是灰貓）小說 10/29 寫好放草稿本「第十一話」分頁，等使用者看。巴哈上架資料夾 10/29 加了子分類「輕小說」、分級「全年齡」、列表縮圖 cover.jpg；第二話巴哈已預約 11/11 21:30。每國一個小遊戲：鼠國蘑菇 → 人魚國漂流瓶 → 兔子國跑酷 → 哈士奇國雪橇賽車，連載到那國時放出（10/28 使用者：遊戲先放著，主軸優先）。
5. 第八話小說草稿（披風洋裝、郵局情書）10/28 寫好放草稿本，等使用者看。設定集 10/28 新增：每國試一個職業、時空裂縫（A＋B 並存）、結局新方向（待選）、魔王生日傳單（用她的手繪蠟筆賓士貓 `work/sprites/ref_tuxedo_drawing.jpg`，第三話牆上畫像不換）、海族居民＝人魚、會動的畫（故事裡不提哈利波特和捷運，讓讀者自己想到）。
6. 預告片：熱血格鬥家、守護騎士、結界師男女都剪好、都進了工作檯（結界師 10/28 晚上放進去）。使用者今天影片額度用完，明天會再傳；收到先給音樂 prompt（第 5 節）。
7. 星之泉遊戲：10/28 使用者 OK、正式上架（拿掉 noindex、首頁和連載目錄有入口、GoatCounter）。之前加了兩首配樂、Vertex 畫的點陣背景（地面、雲、城堡）、光影、鍵盤操作、可休息的大平台（地毯＋木板）、斷柱隨機、魔王關走路左右翻面。
7b. Vertex 影音 10/28 試過：Lyria（`lyria-002`，30 秒約 NT$2）和 Veo（`veo-3.1-lite-generate-001`，圖生影片，720p 每秒約 US$0.03，做法 `isekai-studio` 的 `work/vertex_test/veo.py`）。使用者想用在還沒做的職業預告（聖職者、伙食長、吟遊詩人、花火師、鍊金術師、占星術師、探險家、馴獸師），prompt 先給她看。插畫是 3:4，送 Veo 前先補成 9:16。
8. GoatCounter 10/28 加好（站台 catheroparty，`tools/add_goatcounter.py`，新的一話上線時 release.yml 會自動補；也可以做好一話就在存稿分支跑一次）；RSS `story/feed.xml` 和 `sitemap.xml` 10/28 做好；Search Console 10/28 驗證通過（index.html 的 google-site-verification，不要刪），使用者要提交 sitemap.xml；11/10 第 2–3 話巴哈和 LINE WEBTOON 上傳包、免費周邊頁（第一話三個平台 10/28 都已發）。

**定時上線（10/28 使用者同意，GitHub Actions，免費）**：`main` 分支的 `.github/workflows/release.yml` 每週三台灣時間 20:45 照 `main` 的 `release.json`（台灣日期 → 存稿分支）自動把那一話合併到 `site`，跑 `tools/check_site.py`，通過才推 site 和 story-draft，再請 Pages 重建；失敗 GitHub 會寄信給使用者。每做好一話的存稿，就在 `main` 的 `release.json` 加一行。也可以在 Actions 頁手動 Run workflow 填分支名。`site` 和存稿分支推上去時 `.github/workflows/check.yml` 會自動檢查（連結、條漫 ≤500KB、上傳包檔名、目錄）。合併後還會重新縮減字型、跑 `tools/make_feed.py` 更新 RSS（`story/feed.xml`）和 `sitemap.xml`。所以平常在 site 上改字不用重跑字型（避免跟存稿分支的字型檔衝突），上線時會自動補。上線日 Claude 只要確認 Actions 有成功、沒成功就手動合併。

**Threads 自動發文（10/28 使用者同意：她只做審核，其他 Claude 做）**：`main` 的 `.github/workflows/threads.yml` 每 15 分鐘發 `main` 的 `posts/threads.json` 裡 `approved: true`、時間到、還沒發的貼文（`tools/threads_post.py`，文字／單圖／輪播，圖要公開網址），發完寫回 `posted`。每週一自動延長 60 天 token。加密設定 THREADS_TOKEN、THREADS_APP_SECRET、GH_SECRETS_PAT 由使用者照設定頁 https://claude.ai/artifact/XgR1DZQvxQxN5rPCMPUwtf 設（10/29 做）。只有使用者對那則說 OK，Claude 才把它設成 approved；每週日排好下週貼文給她一次看完。Meta API 免費。IG 之後再開；巴哈、LINE WEBTOON 沒有 API，維持她手動上傳。

**本地助手（10/28 使用者定的分工）**：雲端 Claude（這個 session）負責創作和準備：小說、漫畫、排版、上傳包、文案、網站、Threads 自動發文。巴哈和 LINE WEBTOON 沒有 API，交給她電腦上的 Claude（桌面 app 或 `claude remote-control`）用 Chrome「貓貓勇者」個人資料裡的 Claude in Chrome 上傳：上架資料夾在 `isekai-studio` 的 `publish/queue/`（`work/publish/make_queue.py` 產生，規則見 `publish/README.md`）。10/29 使用者同意小弟直接按「預約發表」（第一次試跑先確認預約能編輯或取消；沒有預約選項就不送出，巴哈小說類改用「限本人觀看」），送出後移到 `publish/done/`。進度表 bh／lw 打勾的時機：`done/` 有新的一篇，而且使用者說她檢查過預約內容；只有雲端 Claude 改進度表。第一次試在 11/10～11/11 上傳第二、三話。

**發文口氣（10/28 使用者：要更像她、像真人）**：照她平常講話的樣子：短句、少標點（常用空格斷句）、會用「～」「😂」「Ｘ＿Ｘ」、括號吐槽、「我覺得」、台味；不寫成文案腔、不說教；結尾丟一個問題給讀者。她有給自己寫過的貼文就以那個為準。

**存稿分支**：第三話（小說＋漫畫頁、條漫、IG 單格、目錄）做好放在 `ep03-stock` 分支，使用者 10/28 說漫畫 OK。11/11 開跑時把它合併進 `site`（`git merge ep03-stock`），再推到 site 和 story-draft。之後每話照這個做法：做好先放 `epNN-stock`，上線日再合併。

**10/29 新增**：`isekai-studio` 有三個 skill（`.claude/skills/` 的 isekai-comic、isekai-trailer、isekai-story），畫漫畫、剪預告、寫小說照它們的步驟走。自動檢查工具在 `work/qc/`：`vision_check.py`（Gemini 3.8 Flash 量每格她和橘貓的比例、手腳數、有沒有字）、`media_check.py`（影片鏡頭、音樂段落）。設定集新增「角色尺寸表」，prompt 用 `comic3/shared.py` 的 `SIZE`。魔王畫像 10/29 照使用者家的貓的照片改白毛（`work/maou/portrait_v2.png`，`frames.py` 貼進各話空畫框）。**10/29 下午起 Vertex 每個請求都回 403「違反使用條款」**（生圖和看圖都是），原因是 Google Cloud Trust & Safety 認為專案違反 Gemini 服務條款，使用者 10/29 已送出申訴、收到確認信（論壇說可能要等 2–4 週）；不要另開專案繞過。AI Studio（`--api=studio`，預付真錢）還能用，要用先問她。第六話第 10 格橘貓放大還沒做完（程式放大有牆面接縫，等 Vertex 恢復重畫，prompt 在 `comic6/pr10b.txt`）。

**等使用者**：10/29 看 Google Cloud 帳單，確認 Vertex 扣的是試用額度（10/28 中午抵免額頁：剩 NT$9,520.96／原 NT$9,534，已開始扣，但預算頁寫「No credits used」、Vertex 當天約 NT$76 只扣到 13，應是延遲；10/29 再看剩餘有沒有約少 NT$76）→ 確認後撤銷 Cloudflare Token、刪 Network secrets 那筆、把第 3 節「遊戲周邊用 Cloudflare」改成 Vertex、刪 `tools/cf_image.py`。

**10/28 定的**：魔王 = 使用者自己的貓當原型（灰藍白賓士、黃眼、下巴一撮深色毛、最中二最屁像哈士奇，不是傳統魔王；公開頁面不寫貓的本名）。使用者手繪的圖有著作權、AI 圖沒有：重要角色定稿以後盡量用她的手繪。推廣上，零讀者階段用測驗和小遊戲當入口，連載是讓人留下來的。使用者不想去別人的貼文下面回文（覺得像廣告），推廣建議不要再提這招；改用自己貼文結尾丟問題、主題標籤、測驗分享卡、巴哈和 LINE WEBTOON 的新作曝光。Threads 置頂對外寫「11/11 起，每週不定期更新」（內部仍照週三 21:00 準備）。

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
| 漫畫存稿閱讀器（還沒上線的條漫，使用者從這裡看） | https://claude.ai/artifact/Wduivnp7d8KyU2hjTQucaY（原始檔 `isekai-studio` 的 `work/comicview/`；每話排好條漫就把切片放 `c/`、改 `EPS` 再發布） |
| 幕後筆記（一個人＋AI 做連載的幕後：改之前／改之後＋心得文案，那一話上線後才發） | https://claude.ai/artifact/M9EzdWhDTwafDtFX4JW4Yo（原始檔 `isekai-studio` 的 `work/behind/`；使用者 10/28：要有人性、像真人心得、分享；寫點子的由來，不寫修圖；［ ］留給她補真心話） |
| 製作日誌（不公開：「我如何跟 Claude 打造一個 IP」的素材，里程碑到了再整理成系列貼文；10/28 使用者：主軸不變、同時收集素材，之後可做番外篇「幕後直擊」；YouTube 頻道「貓貓工作室」放影片版幕後：AI 小貓員工從製作到配音的過程，全部 5 分鐘以內：YouTuber 介紹感或旅遊影片風格（喵導員帶你逛月瞳國），另剪 Shorts，1 月中開始） | https://claude.ai/artifact/4pESS1ynTFvyQq7VYRH8ZH（Claude Docs；表格一列一件事：日期、發生什麼、誰的點子、她說的話。每週日準備下週時補一筆。記點子和決定，不記修圖細節——使用者 10/28 說修圖很無聊） |
| 素材庫（沒用在連載、可單獨發的圖） | https://claude.ai/artifact/VpLeUwx1DQxYUz4pReewvp |
| 預告片工作檯 | https://claude.ai/artifact/3UpfrfLTVP8vi9Lzvn2UYU |
| 冷啟動數據紀錄表 | https://claude.ai/artifact/6BXsmJZF8TZYbUWAXTXD76 |
| 工作檔（漫畫原圖、設定圖、修圖和排字程式、LINE 貼圖原始檔、預告片素材、使用者傳的圖） | 私人 repo `mochachen1225-create/isekai-studio`（main）。暫存資料夾會隨容器回收消失，做完一批就推上去 |

以上 artifact 都是私人的，只有使用者看得到。

## 2. 分工和排程

- 小說：Claude 寫草稿放草稿本，使用者在總覽打勾 OK（或留言要改），Claude 上線。
- 漫畫：Claude 寫分鏡和 prompt、自己用 API 畫、自己檢查、修圖、排字、上線（規則見第 3 節）。
- 平台分工（2026-10-28 定）：巴哈只放小說，每話配 3 張插圖（從該話漫畫格挑，打包成 `promo/epNN_bahamut.zip`，文案裡標［插圖 1／2／3］位置，結尾一行導到漫畫版；資料夾「貓貓勇者小隊」；標籤：原創、異世界、輕小說、貓、搞笑、日常、轉生、貓貓勇者小隊、AI輔助）；LINE WEBTOON 只放漫畫（條漫切片改名成英數字 `epNNsXX.jpg` 打包成 `promo/epNN_comic.zip`，加一張話次縮圖 `epNNthumb.jpg` 202×142、不能有字；規格：檔名只能英文字母和數字、每張 ≤500KB 的縮圖、每話圖片合計 ≤50MB）；網站兩種都有。
- 發文：Claude 在進度表準備好配圖和可複製的文案；使用者自己在 app 排程、上傳巴哈和 LINE WEBTOON。
- 上線流程（10/28 使用者確認）：定稿後 Claude 只把那話放在 `epNN-stock`，網站等上線日才合併到 site。上傳包和文案一做好就放進進度表那一話的「巴哈小屋：發第 N 話」「LINE WEBTOON：上傳第 N 話」項目（caption＝可複製的標題和內文，link＝壓縮檔），使用者自己看時間下載、上傳。存稿期間 GitHub Pages 還沒有那話的檔案，所以 link 用分支的直接下載網址：`https://github.com/mochachen1225-create/isekai/raw/epNN-stock/promo/epNN_comic.zip`（公開 repo，可以直接下載）。
- 每話固定欄位（第一話 10/28 實際上傳過，每話照這個填，平台規定有變就更新這裡）：
  - 巴哈：標題「【貓貓勇者小隊】第N話　話名」；發文類型小說；勾「AI 創作」；不開贊助；資料夾「貓貓勇者小隊」；標籤 原創、異世界、輕小說、貓、搞笑、日常、轉生、貓貓勇者小隊、AI輔助；內文在［插圖 1／2／3：說明］的位置插圖；結尾兩行（漫畫版連結、AI 輔助作畫說明）。
  - LINE WEBTOON：話次標題＝話名（不加「第N話」）；內容圖 800 寬、英數字檔名 `epNNsXX.jpg`、每張 ≤500KB、合計 ≤50MB；話次縮圖 `epNNthumb.jpg` 202×142、不能有字；不參加官方比賽。作品頁：名稱 ≤50 字、簡介 ≤500 字、正方形 1080×1080 和直式 1080×1920 縮圖各 <500KB。
- 影片：使用者用 Gemini App 做（比 API 便宜），Claude 剪接（第 5 節）。
- 進度表每一項都要有 owner（你／我／一起）和 due。欄位：done、owner、due、time、title、note、link、linkText、caption。每話做好後，把那一話的 Threads／IG 項目補上配圖和文案。使用者只看進度表（10/28）：任何準備好給她用的東西（圖、縮圖、文案、上傳包）都放進對應項目的 link／caption，圖片放 `promo/` 用 GitHub Pages 網址，方便她直接複製、存檔、貼上。
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
- 失敗就停下來回報，不自動重試、不寫會自己重跑的迴圈。唯一例外（2026-10-28 使用者同意）：Vertex 回 429（新專案每分鐘上限很低，畫一兩張就被擋）時，用 `isekai-studio` 的 `work/comic3/slow.sh` 慢慢畫：每 3 分鐘 1 張，只有 429 才等 5／10／20 分鐘再試，最多 3 次，其他錯誤直接停。不用問使用者，在背景慢慢跑。連續畫多張用 `set -e` 或 `|| exit`，不要把輸出接 pipe（`| cut` 會吃掉錯誤碼）。
- 圖片小問題優先用程式修（放大貓、去標誌、縮小人物、疊暖光），不用重畫。做法見 `isekai-studio` 的 `work/comic2/`。
- 光影改不出來時，可以用程式在光源方向疊暖色（見 `DESIGN.md` 守護騎士的紀錄）。
- 職業插畫選定後縮成 900 寬放進 `assets/illustrations/`。28 張已在 2026-10-27 全部換成新畫風，定稿紀錄在 `DESIGN.md` 第 12 章。
- 錢的分配（2026-10-28 使用者定）：付費的 Gemini 只花在連載漫畫（和漫畫用的設定圖）。例外（10/28 使用者說）：走 Vertex 試用額度的生圖目前算「不花錢」，小遊戲的點陣背景可以用 Vertex 畫。小遊戲、周邊、桌布以外的雜項圖片，用免費的 Cloudflare Workers AI（`tools/cf_image.py`，FLUX.2，需要 `CLOUDFLARE_ACCOUNT_ID`，Token 由 Network secrets 代理加上）。能用程式畫（SVG、canvas）或從現有漫畫圖裁切的就不生圖。FLUX.2 畫風跟漫畫不完全一樣，所以不拿來畫漫畫和職業插畫。同樣一次只呼叫一次、失敗不重試。Cloudflare 只用免費方案、不升級付費：每天 10,000 Neurons，台灣時間早上 8 點重置，FLUX.2 很耗額度，一天大概只夠幾張，而且可能跟使用者其他專案共用；額度用完（429）就等隔天。這個專案沒有營利，錢要花在刀口上：能用現成素材（`assets/sprites/` 的點陣角色、`assets/portraits/`、LINE 貼圖、漫畫圖）就不生圖。連續呼叫時每一行都加 `|| exit 1`（`set -e` 在這個環境不一定會停）。

## 4. 連載《貓貓勇者小隊》

- 頁面在 `story/`：目錄 `index.html`，每話小說 `NN.html`、漫畫 `NN-comic.html`（圖在 `story/comic/NN-1.jpg`…），共用 `story.css`。遊戲首頁有連結。
- 新增一話：複製上一話的 html 改內容；在 `story/index.html` 目錄加一行，把上一話的「準備中」改成連結；重跑 `tools/subset_font.py`（它會掃 `story/*.html`）。
- 使用者常常用碎片的方式想設定：每次聽到新的想法，就幫她釐清、寫進設定集對應的地方，檢查有沒有跟舊設定或已寫的話數衝突；有衝突或缺的，列在設定集最後「設定檢視」區，給二到三個草案讓她選。不要的設定刪掉，不要越堆越多。使用者希望 Claude 主動給點子、不只照她的想法走：覺得很棒的建議一定要提出來（放在設定檢視區的「Claude 主動提案」，附推薦和理由）。
- 使用者改草稿的習慣（2026-10-28）：刪除線＝要刪掉（上線時拿掉，草稿本裡不要替她刪）；「（描述一下…）」「<--這邊稍微補一下」＝請 Claude 補寫，補的時候照她的方向、不改她的字；只修標點（「....」→「……」）。她的思維邏輯整理在設定集「寫作口氣指南」表格：不煽情不總結人生、主角能幹但不炫技、世界要講得通（有價錢、沒錢就打工、沒有白吃的午餐）、用正常說法不硬造可愛規則、都市人吐槽梗、還沒確定的事用問句。
- 寫新的一話前先讀設定集，照「寫作口氣指南」：異世界輕小說風格、短句、少用「我」、可以有台味、設定只露不解釋（讓讀者自己發現）、前面輕鬆。主軸是「兩副眼鏡」：她用異世界套路去理解，結果根本不是（笑點）；也發現很多事跟現代社會很像，只是換了樣子（共鳴）。後者透過她的視角和聯想讓讀者自己發現，不直接照搬、不說教。不要一下子講清楚、全部揭露：到處埋伏筆，每寫一話就更新設定集的「伏筆清單」（埋在哪、打算在哪收）。
- 用字：敘述裡叫「橘貓」，不要叫「喵導員」；她在第六話（暫定）有禮貌地問名字、牠自我介紹之後，才改叫「喵導員」。故事裡不出現使用者的家人。
- 漫畫不用跟小說逐字對應，要有 webtoon 的節奏感。台詞全部後製排字，圖裡不放字；每格 prompt 最後加「Leave clear empty space for speech bubbles.」。
- 漫畫的字（2026-10-28 使用者定）：
  - 內心話：沒有框，一排小字（粉圓體，白字加淡淡的深色陰影；淺色底用深字）。`s.line()`，或 `bubble(kind='thought')`。
  - 劇情旁白（不是內心話）：白色方框、黑框線、黑字。`s.narr()`。
  - 說話：橢圓對話框加尾巴。`s.bubble()`。不要用一圈小圓圓的雲朵框（使用者覺得醜）。
  - 很大的聲音、吶喊：大大的貼圖字（小瀨體、粗描邊）。`s.sfx()`，或 `bubble(kind='shout')`。
- 漫畫排成一整條直式條漫（2026-10-28 起）：排版程式 `isekai-studio` 的 `work/wt/webtoon.py`，每話寫一個 `epNN.py`（格間底色跟著時間變、滿版／小框、對話框、心聲、旁白、狀聲詞、留白停頓）。輸出切成 800×1280（LINE WEBTOON 規格），放 `story/comic/NN-s-XX.jpg`，`NN-comic.html` 用 `<div class="strip">` 連續排。單格圖 `NN-1.jpg`… 留著給 IG 輪播用。每話的排版計畫寫在草稿本該話分頁的「條漫排版」。

## 5. 職業短片預告

- 節奏（2026-10-28 使用者說）：她有空就做影片傳過來，沒有固定日期；Claude 收到就剪，要不要開 subagent 平行剪由 Claude 自己決定（多支一起來時可以開，避免主對話被卡住）。
- 使用者用 Gemini App 做 10 秒短片（每天 3 支），Claude 用 `tools/make_trailer.py config.json` 剪成直式預告：字卡 → 三個鏡頭（慢動作，不要放大推近）→ 個性字卡 → 片名＋遊戲網址。範例在 `tools/trailer_example.json`。
- 收到影片後，先回使用者一段「請 Gemini 做什麼音樂」的 prompt（照職業個性寫，器樂、不要人聲），她做好傳來再換上；等音樂期間可以先用舊歌當暫時配樂剪好。
- 配樂用 Gemini 做的歌的「中段比較豐富的段落」；男版咖啡師配慵懶法式（Rainfall on Saint-Germain），女版配 Bossa Nova（Café Promenade）；勇者配輕快冒險風，從第 42 秒開始。可愛的鏡頭（例如貓咬麵包）放更慢、多停一兩秒。
- 選鏡頭時，人物的頭被畫面切掉的段落不要用（10/28 男版格鬥家開頭沒頭，使用者覺得很怪）。
- 預告剪好、使用者說 OK 之後，一律加進預告片工作檯（它就是影音素材庫，使用者從那裡慢慢上傳）。
- 橫式來源用「置中＋上下模糊背景」，不要裁成直式填滿。請使用者在影片 prompt 最後加「Vertical 9:16 video.」。
- 個性字卡三段：第一句結論（例：你是讓人安心的那種人。）→ 兩三句具體行為 → 身邊的人跟你在一起的感覺。正向。
- 做好的預告放 `promo/<職業>_<m|f>.mp4`（commit 到 site 分支，手機可以從 GitHub Pages 存影片）。同時加進工作檯頁面：先用 Artifact read 讀回原始檔，在 `DONE` 物件加 key 和貼文文字，影片放 artifact 的 `video/<key>.mp4`。

## 小遊戲改版

- 放在 `games/<名字>/`，原本的遊戲 repo 不動。改好先不放進周邊小舖、也不放連結，網址只給使用者測試；頁面加 `<meta name="robots" content="noindex">`。使用者說可以了，才拿掉 noindex、加進周邊小舖。
- 遊戲裡的對話、提示字盡量兩行、置中（10/28 使用者說）。星之泉用 `two()` 在中間附近的標點自動斷行。
- 每個遊戲資料夾放一份 `NOTES.md`：改自哪個 repo、換了什麼、還沒做什麼。

## 6. 備案工具（免費、可公開用為主，還沒用到）

- 動畫影片：Remotion（React 寫影片，個人和 3 人以下公司免費，5.0 版授權會改，用前再查）、Motion Canvas、Blender、three.js、FFmpeg（預告片已經在用）。可以拿漫畫格做成動態漫畫 Reels；注意使用者不喜歡放大推近的鏡頭。
- 免費生圖：Cloudflare Workers AI（目前每天都顯示額度用完，原因待查）、Hugging Face 上的 FLUX.1 schnell（授權要看模型頁）、使用者手動用 Gemini App 畫。
- Vertex AI（2026-10-28 設定好、測試成功，現在是 `tools/gemini_image.py` 的預設）：Google Cloud 試用送的約 NT$9,534 額度（到 2027-01-26）不能付 AI Studio 的 Gemini API，但可以付 Vertex AI（新名 Agent Platform API）。專案「isekai」（ID `gen-lang-client-0406332141`，mocha 帳號），服務帳戶 `isekai-image`（只有 Agent Platform User 角色），API 金鑰 `isekai-vertex` 綁在這個服務帳戶、只開 Agent Platform API，放在 Network secrets（網域 `aiplatform.googleapis.com`，header `x-goog-api-key`，prefix 空白）。模型 `gemini-3.1-flash-image` 跟 AI Studio 同一個。上限：專案有 Spend cap enforcement（Vertex AI，到了會真的暫停；10/28 使用者暫時調成每月 NT$1,000（10/28 晚上 Live cost 已約 NT$271），等 10/29 確認試用額度有照實扣再調回 NT$9,000。上限看的是扣額度前的 Live cost（帳單頁「Budgets & caps」的 Spend amount），接近時先停下來告訴她），工具不限每天張數（2026-10-28 使用者取消，因為 Vertex 有每月金額上限會真的擋；每天畫幾張仍記在 ~/.isekai_image_log.json）。`--loc=us-central1` 也能用（改區域沒解決 429）。`--api=studio` 可改回 AI Studio 預付。iskatie 帳號下另有一個誤建的專案 `wide-bastion-470510-m3`（金鑰、服務帳戶），使用者要自己去刪。待確認：隔天看帳單是不是扣試用額度。
- 省錢生圖：Gemini API 是一張圖算一次錢（1K 約 US$0.067、2K 約 US$0.101），角色小圖可以一次畫一整張 4×4 或 5×5 的角色表再用程式裁切。2026-10-28 實測成功（星之泉 16 個角色一張搞定，使用者覺得很划算）：洋紅色底、每格一個角色，程式去背後縮到約 96px 就是點陣貼紙。做法和原圖在 `isekai-studio` 的 `work/sprites/`。小遊戲、周邊的角色圖以後優先用這招。
- 免費素材：Kenney（CC0）。

## 7. 一定要遵守

- 跟使用者說話一律用繁體中文（10/28 使用者說英文看得懂但比較慢）。簡潔。

- 任何事實、數字、日期、平台規定，先搜尋再說。
- 不貼金鑰。筆名帳號（巴哈、LINE WEBTOON）跟使用者的個人身分分開。筆名＝「貓貓勇者小隊」（2026-10-28 定，Threads、巴哈、LINE WEBTOON 顯示名稱都已改好；巴哈和 LINE WEBTOON 帳號 10/28 建好；LINE WEBTOON 第一話 10/28 已發布，作者資訊網站填測驗首頁；作者主頁 https://www.webtoons.com/p/community/zh-hant/u/catheroparty ；巴哈第一話 10/28 已發）。LINE（10/28 過審上架）：表情貼 https://line.me/S/emoji/?id=6ae16b19a98c12374a15872f 、主題（霧藍）https://store.line.me/themeshop/product/0e7d3345-2a73-4932-b53a-3547ca36f928/zh-Hant ；薄荷、淡紫兩色主題可以接著送審。羊年貼圖／表情貼特輯排在進度表 ny1–ny4（全新圖、勾「使用 AI」、12/14 送審，截止 2027/1/8）。IG：https://www.instagram.com/mochachen12252026/ 。網址、IG、WEBTOON 帳號裡的「mocha chen」是使用者家的貓的名字、不是本名，使用者說沒差，不用再提。文案、簡介裡不寫使用者本名。
- AI 作品要誠實標示（巴哈勾「AI 創作」、LINE WEBTOON 簡介寫「AI 輔助作畫」、不參加禁止 AI 的比賽）。
- 不畫任天堂、薩爾達等現有作品的官方角色。
