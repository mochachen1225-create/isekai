這個資料夾是要放到 `main` 分支的檔案（排程只能從 main 跑），不是網站的一部分。
雲端 Claude 合併這個分支進 site 時不要帶這個資料夾；把裡面的檔案照同樣路徑複製到 main。
- `.github/workflows/release.yml`、`rehearse.yml`：10/29 已放到 main。
- `.github/workflows/threads.yml`＋`tools/threads_post.py`：新增每天 23:17 抓 Threads 數字（stats 指令），寫到 main 的 `stats/threads/YYYY-MM-DD.json`。token 要有 threads_manage_insights。
