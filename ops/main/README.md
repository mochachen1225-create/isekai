這個資料夾是要放到 `main` 分支的檔案（排程只能從 main 跑），不是網站的一部分。
雲端 Claude 合併這個分支進 site 時不要帶這個資料夾；把裡面的 `.github/workflows/` 複製到 main。
- `release.yml`：改成用 site 的 `tools/release_merge.sh` 和 `tools/after_merge.sh`（site 還沒有這兩支時照舊）。
- `rehearse.yml`：新的，每天預演。
