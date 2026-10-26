// 遊戲流程：開場 → 地圖 → 事件 → 揭曉 → 結果 → 組隊
import { maiText, EVENTS, SECRETS, SPEAKERS, OPENINGS, GUIDE_INTRO, GUIDE_REUNION, CHATTER, JOBS, DIM_INFO, DIMS } from './data.js';
import { VOICES, THEMES, GUT, QUESTIONS } from './persona.js';
import { toned, tipFor } from './tone.js';
import { rulerOf, computeResult, encodeParty, decodeParty, teamInfo } from './score.js';
import { createWorld, WALK_ITEMS } from './world.js';
import { drawPerson, drawCat, drawSlime, LOOKS, CATS, spriteCanvas, faceCanvas } from './pixel.js';

const $ = sel => document.querySelector(sel);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const EVENT_INDEX = Object.fromEntries(EVENTS.map((e, i) => [e.id, i]));

// 對話頭像：有畫好的插畫就用插畫，沒有就用點陣小人
const PORTRAITS = { guide: 'guide', king: 'king', demon: 'demon', mai_m: 'mai_m', mai_f: 'mai_f', xing: 'xing', clerk: 'clerk', goddess: 'goddess', granny: 'granny', cat: 'calico' };
const READY = new Set(['guide', 'calico', 'granny', 'goddess', 'clerk', 'xing', 'mai_m', 'mai_f', 'king', 'demon']); // 已經放進 assets/portraits/ 的頭像
function faceElement(face) {
  if (face === 'mai') face = game.profile && game.profile.gender === 'm' ? 'mai_f' : 'mai_m';
  const fallback = () => faceCanvas(face);
  if (!READY.has(PORTRAITS[face])) return fallback();
  const img = new Image();
  img.src = `assets/portraits/${PORTRAITS[face]}.webp`;
  img.alt = '';
  img.onerror = () => { const c = fallback(); if (c) img.replaceWith(c); };
  return img;
}

const game = {
  party: [],        // 邀請連結裡已經在隊伍中的人
  profile: null,
  world: null,
};

// ---- 畫面切換 ----
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === `screen-${id}`));
}

function waitClick(el) {
  return new Promise(resolve => el.addEventListener('click', resolve, { once: true }));
}

// ---- 對話框 ----
async function say(lines) {
  const box = $('#dialog'), face = $('#dialog-face'), name = $('#dialog-name'), text = $('#dialog-text');
  const tap = $('#tapcatch');
  box.hidden = false;
  tap.hidden = false;
  for (let [who, line] of lines) {
    who = maiText(who, game.profile.gender, game.ruler);
    const sp = SPEAKERS[who] || SPEAKERS.narr;
    face.innerHTML = '';
    if (who === 'me') { const g = game.profile.gender; const img = gSprite(`player_${g}`, () => spriteCanvas(c => drawPerson(c, 0, 0, LOOKS[g]), 3)); img.classList.add('me-face'); face.append(img); }
    else if (who === 'sys') face.textContent = '⚙️';
    else if (who === 'sign') face.textContent = '🪧';
    else if (sp.face) { const el = faceElement(sp.face); if (el) face.append(el); }
    name.textContent = sp.name;
    text.textContent = '';
    line = maiText(toned(line, game.profile.tone), game.profile.gender, game.ruler);
    who = maiText(who, game.profile.gender, game.ruler);
    let skip = false;
    const onTap = () => { skip = true; };
    tap.addEventListener('click', onTap);
    for (const ch of line) {
      if (skip) { text.textContent = line; break; }
      text.textContent += ch;
      await sleep(28);
    }
    tap.removeEventListener('click', onTap);
    await waitClick(tap);
  }
  box.hidden = true;
  tap.hidden = true;
}

function toast(msg) {
  const t = $('#toast');
  t.hidden = true; void t.offsetWidth;
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2300);
}

// ---- 開場 ----
// Gemini 畫的小人；圖片載入失敗就退回程式畫的
function gSprite(name, fallback) {
  const img = new Image();
  img.className = 'gsprite';
  img.alt = '';
  img.src = `assets/sprites/${name}.png`;
  img.onerror = () => img.replaceWith(fallback());
  return img;
}

function initTitle() {
  // 先在背景下載地圖，進入異世界時就不用等太久
  new Image().src = 'assets/map/village.webp';
  const row = $('#title-sprites');
  row.append(gSprite('player_m', () => spriteCanvas(c => drawPerson(c, 0, 0, LOOKS.m), 3)));
  const guide = faceElement('guide');
  guide.className = 'title-guide';
  row.append(guide);
  row.append(gSprite('player_f', () => spriteCanvas(c => drawPerson(c, 0, 0, LOOKS.f), 3)));
  document.querySelectorAll('[data-action="start"]').forEach(b => b.addEventListener('click', chooseTone));
}

// 介紹頁：說明這是什麼遊戲，並選光明版或暗黑版
async function chooseTone() {
  show('intro');
  game.tone = await new Promise(resolve => {
    document.querySelectorAll('.tone-card').forEach(b => { b.onclick = () => resolve(b.dataset.tone); });
  });
  chooseAvatar();
}

async function chooseAvatar() {
  show('avatar');
  document.querySelectorAll('.avatar-sprite').forEach(el => {
    el.innerHTML = '';
    el.append(gSprite(`player_${el.dataset.look}`, () => spriteCanvas(c => drawPerson(c, 0, 0, LOOKS[el.dataset.look]), 4)));
  });
  const gender = await new Promise(resolve => {
    document.querySelectorAll('.avatar-card').forEach(b => { b.onclick = () => resolve(b.dataset.gender); });
  });
  LOOKS.mai = gender === 'm' ? LOOKS.maiF : LOOKS.maiM;
  game.profile = { tone: game.tone || 'l', gender, choices: [-1, -1, -1, -1, -1, -1], gut: [0, 0, 0, 0, 0, 0], order: [], secrets: 0 };
  chooseSituation();
}

async function chooseSituation() {
  show('situation');
  const list = $('#situations');
  list.innerHTML = '';
  const pick = await new Promise(resolve => {
    for (const o of OPENINGS) {
      const b = document.createElement('button');
      b.className = 'situation';
      b.innerHTML = `<span class="ico">${o.icon}</span><span>${o.label}</span>`;
      b.onclick = () => resolve(o);
      list.append(b);
    }
  });
  await playScene(pick);
}

async function sceneStep(text, art, cls = '') {
  const s = $('#screen-scene');
  s.className = `screen on ${cls}`;
  const a = $('#scene-art');
  a.innerHTML = '';
  if (typeof art === 'string') a.textContent = art; else art.forEach(c => a.append(c));
  $('#scene-text').textContent = text;
  await waitClick(s);
}

async function playScene(opening) {
  show('scene');
  const me = spriteCanvas(c => drawPerson(c, 0, 0, LOOKS[game.profile.gender]), 4);
  const s = $('#screen-scene');
  s.className = 'screen on arrive';
  $('#scene-art').innerHTML = '';
  $('#scene-art').append(me);
  $('#scene-text').innerHTML = `<p>${opening.arrive}</p><p class="sys-box">【系統】歡迎來到異世界。<br>新手教學：職業分配　開始。</p>`;
  await waitClick(s);
  startGame();
}

// ---- 地圖 ----
function renderStamps() {
  const box = $('#stamps');
  box.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const ev = EVENTS[game.profile.order[i]];
    const s = document.createElement('span');
    s.className = `stamp${ev ? ' on' : ''}`;
    s.textContent = ev ? ev.icon : '';
    box.append(s);
  }
  const lock = document.createElement('span');
  const open = game.profile.order.length === 5;
  lock.className = `stamp lock${open ? ' open' : ''}`;
  lock.textContent = open ? '🏰' : '🔒';
  box.append(lock);
}

function startGame() {
  show('game');
  renderStamps();
  $('#status-btn').onclick = openStatus;
  game.world = createWorld($('#map'), { gender: game.profile.gender, onTrigger: handleTrigger });
  openEyes().then(() => say(GUIDE_INTRO)).then(() => {
    game.world.pause(false);
    toast('點地面就可以走路');
  });
}

// 進入異世界的過場：眼睛慢慢睜開，畫面從馬賽克變清楚（同時等地圖載入）
async function openEyes() {
  const eyes = $('#eyes');
  eyes.hidden = false;
  eyes.className = 'eyes';
  $('#eyes-text').textContent = '……好刺眼……眼睛有點睜不開……';
  const revealing = game.world.reveal(2200);
  await sleep(900);
  eyes.classList.add('open');
  await revealing;
  await sleep(300);
  eyes.hidden = true;
}

let busy = false;
async function handleTrigger(a) {
  if (busy) return;
  busy = true;
  const w = game.world;
  w.pause(true);
  try {
    if (a.type === 'event') await runEvent(a.id);
    else if (a.type === 'item') await finishEvent(EVENTS[EVENT_INDEX[a.id]], a.index);
    else if (a.type === 'secret') await runSecret(a.id);
    else if (a.type === 'chat') await say(CHATTER[a.id]);
    else if (a.type === 'locked' && a.id === 'castle') {
      await say([['narr', `城門上貼著一張紙：「最終關卡準備中，請先去村子裡逛逛（${game.profile.order.length}/5）」——署名是一個貓掌印。`]]);
    } else if (a.type === 'locked' && a.id === 'home') {
      await say([['narr', '王城的大門緊閉。守衛瞪了你一眼：「國王正在進行召喚儀式，閒雜人等不得進入！」']]);
    }
  } finally {
    busy = false;
    if (!game.finished) w.pause(false);
  }
}

async function runEvent(id) {
  const ev = EVENTS[EVENT_INDEX[id]];
  if (ev.final) { game.ruler = rulerOf(game.profile); await say(GUIDE_REUNION); }
  await say(ev.intro);
  await askGut(ev);
  if (ev.kind === 'panel') {
    const idx = await choosePanel(ev);
    await finishEvent(ev, idx);
  } else {
    game.world.setActive(id);
    showLegend(ev);
  }
}

function optionArt(art) {
  const file = { slime: 'slime', blackcat: 'blackcat' }[art];
  if (file) {
    // 有 Gemini 圖就用圖，載入失敗退回程式畫的
    const img = new Image();
    img.className = 'opt-sprite';
    img.src = `assets/sprites/${file}.png`;
    img.onerror = () => img.replaceWith(file === 'slime' ? spriteCanvas(c => drawSlime(c, 0, 0), 2) : spriteCanvas(c => drawCat(c, 0, 0, CATS.black), 2));
    return img;
  }
  if (art === 'slime') return spriteCanvas(c => drawSlime(c, 0, 0), 2);
  if (art === 'blackcat') return spriteCanvas(c => drawCat(c, 0, 0, CATS.black), 2);
  const s = document.createElement('span');
  s.textContent = art;
  return s;
}

function choosePanel(ev) {
  const panel = $('#panel');
  panel.className = `panel ${ev.id}`;
  panel.hidden = false;
  panel.innerHTML = `<div class="panel-sheet"><div class="panel-cast"></div><div class="panel-head"><div class="place">${ev.icon} ${ev.name}</div>
    <div class="q">${maiText(QUESTIONS[ev.id], game.profile.gender, game.ruler)}</div><div class="play">${ev.id === 'shrine' ? '選一個你最想要的願望，翻開看看是什麼特典' : ev.id === 'guild' ? '撕下一張委託單' : '選一個最像你的'}</div></div>
    <div class="options"></div></div>`;
  const grid = panel.querySelector('.options');
  const cast = panel.querySelector('.panel-cast');
  const cards = {
    shrine: [faceElement('goddess')],
    guild: [faceElement('clerk')],
    camp: [faceElement('mai')],
    castle: [faceElement(game.ruler === 'king' ? 'king' : 'demon'), gSprite('blackcat', () => spriteCanvas(c => drawCat(c, 0, 0, CATS.black), 2))],
  }[ev.id] || [];
  cards.forEach(c => cast.append(c));
  return new Promise(resolve => {
    ev.options.forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'opt';
      if (ev.id === 'shrine') {
        b.innerHTML = `<span class="back"><span class="back-star">✦</span><span class="back-voice">「${VOICES[ev.id][i].voice}」</span></span><span class="face"><span class="art"></span><span class="lbl"></span><span class="voice"></span></span>`;
      } else {
        b.innerHTML = '<span class="art"></span><span class="lbl"></span><span class="voice"></span>';
      }
      b.querySelector('.art').append(optionArt(o.art));
      b.querySelector('.lbl').textContent = maiText(o.label, game.profile.gender, game.ruler);
      b.querySelector('.voice').textContent = `「${maiText(VOICES[ev.id][i].voice, game.profile.gender, game.ruler)}」`;
      b.onclick = async () => {
        grid.querySelectorAll('.opt').forEach(x => { x.onclick = null; });
        if (ev.id === 'shrine') { b.classList.add('flipped'); await sleep(900); }
        else if (ev.id === 'guild') { b.classList.add('torn'); await sleep(550); }
        else { b.classList.add('chosen'); await sleep(450); }
        panel.hidden = true;
        resolve(i);
      };
      grid.append(b);
    });
  });
}

function catsSoFar() {
  const p = game.profile;
  let n = p.choices.filter((c, e) => c >= 0 && EVENTS[e].options[c].flag === 'cat').length;
  if (p.secrets & SECRETS.box.bit) n++;
  return n;
}

// 第一層：直覺反應（二選一）
function askGut(ev) {
  const g = GUT[ev.id];
  if (!g) return Promise.resolve();
  const box = $('#gut');
  box.innerHTML = `<div class="gut-card"><div class="gut-q">${maiText(g.q, game.profile.gender, game.ruler)}</div><div class="gut-opts"></div></div>`;
  const opts = box.querySelector('.gut-opts');
  box.hidden = false;
  return new Promise(resolve => {
    [g.a, g.b].forEach((o, i) => {
      const b = document.createElement('button');
      b.className = 'gut-opt';
      b.textContent = o.label;
      b.onclick = async () => {
        opts.querySelectorAll('button').forEach(x => { x.onclick = null; });
        b.classList.add('chosen');
        game.profile.gut[EVENT_INDEX[ev.id]] = i;
        await sleep(350);
        box.hidden = true;
        await say([['narr', o.react]]);
        resolve();
      };
      opts.append(b);
    });
  });
}

// 走過去選的事件：畫面上方列出四個選項和內心話
function showLegend(ev) {
  const box = $('#legend');
  box.innerHTML = `<div class="legend-q">${maiText(QUESTIONS[ev.id], game.profile.gender, game.ruler)}</div><div class="legend-hint">${ev.kind === 'dark' ? '在黑暗中走走看，或直接點下面的選項' : '點下面的選項，或走到地圖上的東西旁邊'}</div>`;
  ev.options.forEach((o, i) => {
    const row = document.createElement('div');
    row.className = 'legend-row';
    const art = document.createElement('span');
    art.className = 'legend-art';
    art.append(optionArt(o.art));
    row.append(art);
    row.insertAdjacentHTML('beforeend', `<span><b>${o.label}</b><br>「${VOICES[ev.id][i].voice}」</span>`);
    // 直接點這一行也可以：主角會自己走過去
    row.onclick = () => { const [x, y] = WALK_ITEMS[ev.id][i].at; game.world.walkTo(x, y); };
    box.append(row);
  });
  box.hidden = false;
}

async function finishEvent(ev, idx) {
  $('#legend').hidden = true;
  const p = game.profile, e = EVENT_INDEX[ev.id];
  const opt = ev.options[idx];
  p.choices[e] = idx;
  if (!ev.final) p.order.push(e);
  const w = game.world;
  w.complete(ev.id);
  await say([[opt.reactBy || 'me', opt.react]]);
  toast(`獲得稱號「${maiText(opt.title, game.profile.gender, game.ruler)}」`);
  w.setCats(catsSoFar());
  renderStamps();
  w.setTimeOfDay(Math.min(5, p.order.length + (ev.final ? 1 : 0)));
  if (ev.final) {
    if (p.choices[EVENT_INDEX.forest] === 1) await say([['guide', '咦，這不是在森林裡帶路的那隻貓嗎？']]);
    await say(ev.outro);
    game.finished = true;
    await ritual();
    return;
  }
  if (p.order.length === 5) {
    await sleep(600);
    w.unlock();
    renderStamps();
    await say([['narr', '遠方響起了鐘聲。北邊城堡的大門，緩緩打開了。'], ['sys', '【任務更新】前往北邊的城堡大門，和喵導員會合。']]);
  }
}

async function runSecret(id) {
  const s = SECRETS[id];
  await say(s.lines);
  game.profile.secrets |= s.bit;
  game.world.addSecret(id);
  game.world.setCats(catsSoFar());
  toast('發現了祕密地點！');
}

function openStatus() {
  const p = game.profile;
  const modal = $('#status');
  const skill = p.choices[0] >= 0 ? EVENTS[0].options[p.choices[0]].label : '—';
  const quest = p.choices[1] >= 0 ? EVENTS[1].options[p.choices[1]].label : '—';
  const titles = p.order.map(e => EVENTS[e].options[p.choices[e]].title);
  modal.innerHTML = `<div class="status-window"><h3>狀態</h3><dl>
    <dt>名稱</dt><dd>旅人</dd><dt>職業</dt><dd>？？？</dd>
    <dt>技能</dt><dd>${skill}</dd><dt>委託</dt><dd>${quest}</dd>
    <dt>稱號</dt><dd>${titles.length ? titles.join('、') : '—'}</dd></dl></div>`;
  modal.hidden = false;
  modal.onclick = () => { modal.hidden = true; };
}

// ---- 揭曉儀式 ----
async function ritual() {
  const result = computeResult(game.profile);
  show('ritual');
  const screen = $('#screen-ritual');
  let skipped = false;
  screen.onclick = () => { skipped = true; };
  const wait = async ms => { if (!skipped) await sleep(ms); };
  const stamps = $('#ritual-stamps');
  stamps.innerHTML = '';
  const order = [...game.profile.order, 5];
  const spans = order.map(e => { const s = document.createElement('span'); s.textContent = EVENTS[e].icon; stamps.append(s); return s; });
  for (const s of spans) { s.classList.add('lit'); await wait(220); }
  const lines = $('#ritual-lines');
  lines.innerHTML = '';
  const add = (t, cls) => { const p = document.createElement('p'); p.textContent = t; if (cls) p.className = cls; lines.append(p); };
  add('系統正在讀取你的靈魂……'); await wait(700);
  add(DIM_INFO[result.topDims[0]].read); await wait(700);
  add(DIM_INFO[result.topDims[1]].read); await wait(700);
  add('職業：？？？ → 解析中……'); await wait(800);
  if (result.hidden) {
    add('……錯誤。偵測到異常數值。', 'glitch'); await wait(800);
    add('解鎖隱藏職業。'); await wait(700);
  }
  $('#ritual-crystal').classList.add('burst');
  await wait(600);
  $('#ritual-crystal').classList.remove('burst');
  const party = [...game.party, game.profile].slice(-4);
  history.replaceState(null, '', `#${encodeParty(party)}.me`);
  showResult(game.profile, party);
}

// ---- 結果頁 ----
function illustration(job, gender, big = true) {
  const wrap = document.createElement('div');
  const img = new Image();
  img.alt = JOBS[job].name;
  img.src = `assets/illustrations/${job}_${gender}.jpg`;
  img.onerror = () => {
    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.style.background = `linear-gradient(180deg, ${JOBS[job].color}, #2A3050)`;
    ph.append(spriteCanvas(c => drawPerson(c, 0, 0, LOOKS[gender]), big ? 6 : 3));
    if (big) { const t = document.createElement('span'); t.textContent = '插畫繪製中'; ph.append(t); }
    img.replaceWith(ph);
  };
  wrap.append(img);
  return wrap;
}

// 分享連結指向 r/<職業>.html：那一頁有該職業的預覽圖（LINE、FB 會顯示），打開後自動轉回遊戲
function shareLink(party, job) {
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return `${base}${job ? `r/${job}.html` : ''}#${encodeParty(party)}`;
}

async function share(url, text) {
  try {
    if (navigator.share) { await navigator.share({ title: '異世界轉生職業測驗', text, url }); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(url); toast('連結已複製，貼給朋友吧！'); }
  catch { prompt('複製這個連結傳給朋友：', url); }
}

function showResult(profile, party) {
  const r = computeResult(profile);
  const job = JOBS[r.main];
  let gender = profile.gender;
  const el = $('#screen-result');
  el.innerHTML = '';
  el.scrollTop = 0;
  const root = document.createElement('div');
  root.className = 'result';
  const partner = JOBS[job.partner];
  const journeyStamps = [...profile.order, 5].map(e => EVENTS[e].icon).join('<span class="arrow">→</span>');
  root.innerHTML = `
    <p class="epilogue">${maiText('{尾聲}', profile.gender, r.ruler)}</p>
    <p class="eyebrow">新手教學・職業分配完成</p>
    <div class="hero-card"></div>
    <div class="job-title"><div class="name">${job.icon} ${job.name}</div><div class="tag">「${job.tagline}」</div></div>
    <div class="btn-col share-top"><button class="btn primary" data-act="card">📸 分享我的職業卡給朋友</button></div>
    <div class="card type-card"><div class="type-label">你的性格類型</div><div class="type-name">${r.type.name}</div>
      <div class="type-tags">${r.type.tags.map(t => `<span>${t}</span>`).join('')}</div><p>${r.type.line}</p><div class="code"><div class="code-label">你的四種傾向（來自每一題的第一直覺）</div><div class="code-chips">${r.code.letters.map(l => `<span>${l.icon} ${l.word}</span>`).join('')}</div></div></div>
    <div class="card"><h3>職業成分表</h3><div class="mix"></div></div>
    <div class="card"><h3>你的旅程</h3><div class="journey-stamps">${journeyStamps}</div>${r.journey.map(l => `<p>${toned(l, profile.tone)}</p>`).join('')}</div>
    <div class="card"><h3>職業描述</h3><p>${r.description}</p></div>
    <div class="card"><h3>你的個性</h3>${r.analysis.map(a => `<div class="ana"><div class="ana-q">${'①②③④⑤⑥'[a.event]} ${a.theme}</div><div class="ana-a">「${a.voice}」</div><p>${a.short}</p></div>`).join('')}
      <div class="btn-col"><button class="btn small" data-act="full">看完整解析</button></div></div>
    <div class="card"><h3>你在隊伍中的位置｜${job.role}</h3><p>${job.roleText}</p></div>
    <div class="card"><h3>最佳拍檔</h3><div class="partner"><span class="ico">${partner.icon}</span><p><b>${partner.name}</b><br>${job.partnerText}</p></div></div>
    <div class="card"><h3>${profile.tone === 'd' ? '毒舌小提醒' : '旅途小提醒'}</h3><p>${tipFor(r.main, job.tip, profile.tone)}</p></div>
    <div class="card"><h3>這趟旅程獲得的稱號</h3><div class="titles">${r.titles.map(t => `<span>${t}</span>`).join('')}</div></div>
    <div class="card party"></div>
    <div class="btn-col"><button class="btn small" data-act="again">再轉生一次</button></div>
    <p class="disclaimer">本測驗純屬娛樂，不代表任何心理評估。<br>不收集任何個人資料，結果只存在網址裡。<br><span class="server">Server Earth-2026，轉生完成。</span></p>`;
  el.append(root);

  const card = root.querySelector('.hero-card');
  const drawArt = () => {
    card.innerHTML = '';
    card.append(illustration(r.main, gender));
    if (r.hidden) { const b = document.createElement('span'); b.className = 'hidden-badge'; b.textContent = '隱藏職業'; card.append(b); }
    const t = document.createElement('button');
    t.className = 'gender-toggle';
    t.textContent = gender === 'm' ? '看女生版' : '看男生版';
    t.onclick = () => { gender = gender === 'm' ? 'f' : 'm'; drawArt(); };
    card.append(t);
  };
  drawArt();

  const mix = root.querySelector('.mix');
  r.mix.forEach(m => {
    const row = document.createElement('div');
    row.className = 'mix-row';
    row.innerHTML = `<span>${JOBS[m.job].icon} ${JOBS[m.job].name}</span><span class="mix-bar"><i style="background:${JOBS[m.job].color}"></i></span><b>${m.pct}%</b>`;
    mix.append(row);
    requestAnimationFrame(() => requestAnimationFrame(() => { row.querySelector('i').style.width = `${m.pct}%`; }));
  });
  if (job.special) { const s = document.createElement('div'); s.className = 'mix-special'; s.textContent = job.special; mix.append(s); }

  // 組隊
  const partyBox = root.querySelector('.party');
  const left = 4 - party.length;
  partyBox.innerHTML = `<h3>${left ? `隊伍（${party.length}/4）` : '隊伍成軍！'}</h3>
    <div class="party-list">${party.map((p, i) => {
      const pr = computeResult(p);
      return `<span class="party-chip${i === party.length - 1 ? ' me' : ''}">${JOBS[pr.main].icon} ${i === party.length - 1 ? '你' : `旅人 ${i + 1}`}・${JOBS[pr.main].name}</span>`;
    }).join('')}</div>
    <p>${left ? `你的好朋友，跟你是<b>互相搭配</b>的屬性，還是<b>一模一樣</b>呢？把連結傳給朋友，測完就會加入你的隊伍。湊滿四人，隊名和你們的隊伍屬性就會揭曉！（還差 ${left} 位）` : '四個人到齊了，來看看你們的隊名吧！'}</p>
    <div class="btn-col">${left ? '<button class="btn primary" data-act="invite">邀請夥伴組隊</button>' : '<button class="btn primary" data-act="team">揭曉我們的隊伍</button>'}</div>`;
  root.querySelector('[data-act="invite"]')?.addEventListener('click', () =>
    share(shareLink(party, r.main), `我轉生成了「${job.name}」！那你呢？四個人就可以組隊！（${party.length}/4）`));
  root.querySelector('[data-act="full"]').addEventListener('click', () => showAnalysis(r));
  root.querySelector('[data-act="card"]').addEventListener('click', () => shareCard(r, gender, party));
  root.querySelector('[data-act="team"]')?.addEventListener('click', () => showTeam(party, true));
  root.querySelector('[data-act="again"]').addEventListener('click', () => {
    const others = party.slice(0, -1);
    location.hash = others.length ? encodeParty(others) : '';
    location.reload();
  });
  show('result');
}

// ---- 隊伍頁 ----
function radarSvg(avg) {
  const cx = 120, cy = 112, R = 80;
  const pt = (i, v) => {
    const a = -Math.PI / 2 + i * Math.PI / 3;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  };
  const ring = v => DIMS.map((d, i) => pt(i, v).join(',')).join(' ');
  const peak = Math.max(...DIMS.map(d => avg[d]), 0.1);
  const shape = DIMS.map((d, i) => pt(i, Math.max(0.08, avg[d] / peak)).join(',')).join(' ');
  const labels = DIMS.map((d, i) => {
    const [x, y] = pt(i, 1.2);
    return `<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="12" fill="#5A6878">${DIM_INFO[d].icon}${DIM_INFO[d].name}</text>`;
  }).join('');
  return `<svg class="radar" viewBox="0 0 240 224" role="img" aria-label="隊伍面向圖">
    ${[0.33, 0.66, 1].map(v => `<polygon points="${ring(v)}" fill="none" stroke="#D8E4EE"/>`).join('')}
    <polygon points="${shape}" fill="rgba(126,200,242,.45)" stroke="#3A6EA5" stroke-width="2"/>${labels}</svg>`;
}

// 職業卡：把插畫、職業、性格類型畫成一張圖，分享到 LINE、IG
function loadImage(src) {
  return new Promise(resolve => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; });
}

async function makeCard(r, gender) {
  const job = JOBS[r.main];
  const W = 1080, H = 1720;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  await document.fonts.ready;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#FFF8EC'); bg.addColorStop(1, '#E6F2FF');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const img = await loadImage(`assets/illustrations/${r.main}_${gender}.jpg`);
  const ix = 90, iy = 80, iw = 900, ih = 1120;
  g.save();
  g.beginPath(); g.roundRect(ix, iy, iw, ih, 40); g.clip();
  if (img) {
    const scale = iw / img.width;
    g.drawImage(img, 0, 0, img.width, ih / scale, ix, iy, iw, ih);
  } else {
    g.fillStyle = job.color; g.fillRect(ix, iy, iw, ih);
  }
  g.restore();
  const font = s => `${s}px Huninn, "PingFang TC", "Noto Sans TC", sans-serif`;
  g.textAlign = 'center';
  g.fillStyle = '#8A7A6A'; g.font = font(36);
  g.fillText('我轉生成了', W / 2, 1290);
  g.fillStyle = '#2A4D7A'; g.font = `900 ${font(92)}`;
  g.fillText(`${job.icon} ${job.name}`, W / 2, 1400);
  g.fillStyle = '#6A5A4A'; g.font = font(40);
  g.fillText(`「${job.tagline}」`, W / 2, 1470);
  g.fillStyle = '#A0604A'; g.font = `700 ${font(44)}`;
  g.fillText(`${r.type.name}　${r.type.tags.slice(0, 2).join(' ')}`, W / 2, 1550);
  g.fillStyle = '#8A9AAA'; g.font = font(34);
  g.fillText('異世界轉生職業測驗　你會轉生成什麼？', W / 2, 1660);
  return new Promise(resolve => c.toBlob(resolve, 'image/png'));
}

async function shareCard(r, gender, party) {
  toast('職業卡製作中……');
  const blob = await makeCard(r, gender);
  const file = new File([blob], `isekai-${r.main}.png`, { type: 'image/png' });
  const url = shareLink(party, r.main);
  const text = `我轉生成了「${JOBS[r.main].name}」！那你呢？四個人就可以組隊！（${party.length}/4）`;
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text}\n${url}` });
      return;
    }
  } catch (e) { if (e.name === 'AbortError') return; }
  // 不能直接分享圖片的瀏覽器：把圖片打開，讓玩家長按儲存
  const href = URL.createObjectURL(blob);
  const modal = $('#status');
  modal.innerHTML = `<div class="card-preview"><img src="${href}" alt="職業卡"><p>長按圖片就可以儲存或分享</p></div>`;
  modal.hidden = false;
  modal.onclick = () => { modal.hidden = true; };
}

// 完整解析頁
function showAnalysis(r) {
  const el = $('#screen-analysis');
  el.innerHTML = '';
  el.scrollTop = 0;
  const root = document.createElement('div');
  root.className = 'result';
  root.innerHTML = `
    <p class="eyebrow">完整解析</p>
    <div class="card type-card"><div class="type-label">你的性格類型</div><div class="type-name">${r.type.name}</div>
      <div class="type-tags">${r.type.tags.map(t => `<span>${t}</span>`).join('')}</div><p>${r.type.line}</p><div class="code"><div class="code-label">你的四種傾向（來自每一題的第一直覺）</div><div class="code-chips">${r.code.letters.map(l => `<span>${l.icon} ${l.word}</span>`).join('')}</div></div></div>
    <div class="card"><h3>你的四種傾向</h3>${r.code.letters.map(l => `<div class="ana"><div class="ana-q">${l.icon} ${l.name}</div><div class="ana-a">${l.word}</div><p>${l.text}。</p></div>`).join('')}</div>
    <div class="card"><h3>你的六個面向</h3>${radarSvg(r.dims)}</div>
    ${r.analysis.map(a => `<div class="card"><h3>${'①②③④⑤⑥'[a.event]} ${a.theme}</h3><div class="ana-a">你選了「${a.voice}」</div><p>${a.long}</p></div>`).join('')}
    <div class="btn-col"><button class="btn primary" data-act="back">回到我的結果</button></div>
    <p class="disclaimer">本測驗純屬娛樂，不代表任何心理評估。</p>`;
  el.append(root);
  root.querySelector('[data-act="back"]').onclick = () => show('result');
  show('analysis');
}

function showTeam(party, fromResult) {
  const t = teamInfo(party);
  const el = $('#screen-team');
  el.innerHTML = '';
  el.scrollTop = 0;
  const root = document.createElement('div');
  root.className = 'result';
  root.innerHTML = `
    <p class="eyebrow">隊伍成軍</p>
    <div class="team-name">${t.name}</div>
    <div class="team-grid"></div>
    <div class="card"><h3>隊伍面向</h3>${radarSvg(t.avg)}</div>
    <div class="card"><h3>你們最強的時候</h3><p>${DIM_INFO[t.top].strong}</p></div>
    <div class="card"><h3>這支隊伍的小提醒</h3><p>${DIM_INFO[t.low].tip}</p></div>
    <div class="btn-col">
      <button class="btn primary" data-act="share">分享我們的隊伍</button>
      ${fromResult ? '<button class="btn small" data-act="back">回到我的結果</button>' : ''}
      <button class="btn small" data-act="new">我也要轉生，組一支新隊伍</button>
    </div>
    <p class="disclaimer">本測驗純屬娛樂，不代表任何心理評估。<br><span class="server">Server Earth-2026，轉生完成。</span></p>`;
  el.append(root);
  const grid = root.querySelector('.team-grid');
  t.results.forEach((r, i) => {
    const m = document.createElement('div');
    m.className = 'member';
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    thumb.append(illustration(r.main, r.profile.gender, false));
    m.append(thumb);
    m.insertAdjacentHTML('beforeend', `<div class="who">旅人 ${i + 1}</div><div class="jn">${JOBS[r.main].icon} ${JOBS[r.main].name}</div><div class="rl">${JOBS[r.main].role}</div>`);
    grid.append(m);
  });
  root.querySelector('[data-act="share"]').onclick = () => share(shareLink(party), `我們的隊伍是「${t.name}」！你也來轉生看看吧`);
  root.querySelector('[data-act="back"]')?.addEventListener('click', () => show('result'));
  root.querySelector('[data-act="new"]').onclick = () => { location.hash = ''; location.reload(); };
  show('team');
}

// ---- 進入點 ----
function boot() {
  initTitle();
  const hash = location.hash;
  const party = decodeParty(hash);
  const isMe = hash.endsWith('.me');
  if (party.length && isMe) {
    game.profile = party[party.length - 1];
    showResult(game.profile, party);
  } else if (party.length === 4) {
    showTeam(party, false);
  } else if (party.length) {
    game.party = party;
    const names = party.map(p => JOBS[computeResult(p).main].name);
    $('#invite-title').textContent = `${party.length} 位旅人邀請你加入隊伍（${party.length}/4）`;
    const row = $('#invite-members');
    row.className = 'party-list';
    row.style.justifyContent = 'center';
    row.innerHTML = names.map((n, i) => `<span class="party-chip">${JOBS[computeResult(party[i]).main].icon} ${n}</span>`).join('');
    show('invite');
  } else {
    show('title');
  }
}

window.__game = game; // 方便除錯
boot();
