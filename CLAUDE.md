# 給 Claude 的工作規則

## 職業插畫（Gemini 生圖）

- 美術規範和每個職業的角色設定都在 `DESIGN.md` 第 12 章。畫新圖前先讀。
- **呼叫圖片 API 前一定要先確認**：先輸出英文 Prompt 和構圖構想（中文說明）給使用者看，等使用者回覆「生成」才可以呼叫 API。使用者沒說「生成」，就只討論、不呼叫。
- 每次呼叫前說清楚這次會產生幾張圖。一次最多 3 張；不要自動重試、不要寫會自己一直重跑的迴圈。呼叫失敗就停下來，回報錯誤。
- 產生的圖先整理成比較圖給使用者挑，選定後才縮成 900 寬、放進 `assets/illustrations/`。
- 同一張圖修改太多次會被舊構圖綁住。改不動時，換成用定稿參考圖重新生成。
- 光影改不出來時，可以用程式在光源方向疊暖色（見 `DESIGN.md` 守護騎士的紀錄）。

## 目前進度（換新 session 時從這裡接）

- 新畫風已完成：咖啡館店長、勇者、熱血格鬥家、守護騎士（男女版共 8 張）。下一個是結界師，設定在 `DESIGN.md` 第 12 章的表格。
- 正在試用 Cloudflare Workers AI 的免費 FLUX.2 畫圖：`tools/cf_image.py`（一次只呼叫一次、不重試）。API Token 放在環境的 Network secrets（代理自動加到 `api.cloudflare.com` 的請求，Claude 看不到）；帳號 ID 放在環境變數 `CLOUDFLARE_ACCOUNT_ID`。
- 試畫時用已定稿的圖當參考圖（例如 `assets/illustrations/knight_m.jpg`），再跟 Gemini 畫的 8 張比較畫風是否一致；不夠一致就改用 Gemini API。
- 這個網站在 `site` 分支，push 後 GitHub Pages 自動更新。
