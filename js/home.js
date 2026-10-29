// 首頁的「最新一話」和世界地圖：讀 data/home.json（每週三上線時由 tools/make_home_data.py 產生），填進有標記的元素。
// 標記方式（版面可以隨便改，只要留著這些屬性）：
//   data-home="latest.title"       文字換成 home.json 裡那個欄位
//   data-home-href="latest.novel"  連結換成那個欄位（欄位是空的就把元素藏起來）
//   data-home-src="latest.thumb"   圖片換成那個欄位（欄位是空的就把元素藏起來）
//   data-home-ready                載入成功才顯示（先在 HTML 寫 hidden）
//   data-country="國家 id"          已到達的國家加 class="reached"，目前所在的國家再加 class="current"
//   data-links                      裡面換成 data/links.json 的平台連結（「在哪裡看得到我們」）
//   data-links="en"                 只列 lang 有 "en" 的（英日文首頁用）；不寫就列 lang 有 "zh" 或沒寫 lang 的
// 讀不到 json 時什麼都不改，頁面上原本寫的靜態連結（例如連載目錄、平台清單）照常能用。
const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

async function fill() {
  let data;
  try {
    const res = await fetch('data/home.json', { cache: 'no-cache' });
    if (!res.ok) return;
    data = await res.json();
  } catch { return; }

  document.querySelectorAll('[data-home]').forEach(el => {
    const v = get(data, el.dataset.home);
    if (v != null) el.textContent = v;
  });
  for (const [sel, key, prop] of [['[data-home-href]', 'homeHref', 'href'], ['[data-home-src]', 'homeSrc', 'src']]) {
    document.querySelectorAll(sel).forEach(el => {
      const v = get(data, el.dataset[key]);
      if (v) el[prop] = v; else el.hidden = true;
    });
  }
  const reached = new Set(data.reached || []);
  document.querySelectorAll('[data-country]').forEach(el => {
    el.classList.toggle('reached', reached.has(el.dataset.country));
    el.classList.toggle('current', el.dataset.country === data.current);
  });
  document.querySelectorAll('[data-home-ready]').forEach(el => { el.hidden = false; });
}

// 平台連結：data/links.json 由雲端 Claude 維護（手寫的內容，不是上線時產生的）。
// 有網址的做成連結，沒有網址的（即將推出、還沒給網址）做成不能點的標籤。
async function fillLinks() {
  const boxes = document.querySelectorAll('[data-links]');
  if (!boxes.length) return;
  let links;
  try {
    const res = await fetch('data/links.json', { cache: 'no-cache' });
    if (!res.ok) return;
    links = (await res.json()).links || [];
  } catch { return; }
  boxes.forEach(box => {
    const lang = box.dataset.links || 'zh';
    const items = links.filter(l => (l.lang || ['zh']).includes(lang)).map(l => {
      const safe = /^(https:\/\/|[a-z0-9_-]+\/)/i.test(l.url || '');   // 只收 https 和站內相對路徑
      const el = document.createElement(safe ? 'a' : 'span');
      if (safe) el.href = l.url;
      el.textContent = l.name;
      if (l.note) {
        const s = document.createElement('small');
        s.textContent = l.note;
        el.append(s);
      }
      return el;
    });
    if (items.length) box.replaceChildren(...items);
  });
}

fill();
fillLinks();
