// 產生 r/<職業>.html：給 LINE、FB 抓預覽圖用的小頁面，打開後自動轉回遊戲（保留 # 後面的隊伍代碼）
import fs from 'fs';
import { JOBS } from '../js/data.js';

const SITE = 'https://mochachen1225-create.github.io/isekai/';
fs.mkdirSync('r', { recursive: true });
for (const [key, j] of Object.entries(JOBS)) {
  const title = `我轉生成了「${j.name}」｜異世界轉生職業測驗`;
  const desc = `「${j.tagline}」你會轉生成什麼職業？測完就能加入我的隊伍！`;
  fs.writeFileSync(`r/${key}.html`, `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8">
<title>${title}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SITE}assets/illustrations/${key}_f.jpg">
<meta property="og:url" content="${SITE}r/${key}.html">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace('../index.html' + location.hash);</script>
</head><body><a href="../index.html">開始轉生</a></body></html>
`);
}
console.log('done', Object.keys(JOBS).length);
