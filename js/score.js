// 計分與代碼：純函式，不碰畫面。瀏覽器和 node 都能直接 import。
import { DIMS, DIM_INFO, JOBS, JOB_ORDER, EVENTS, SECRETS, VERSION, TEAM_PREFIX, TEAM_TYPE, maiText } from './data.js';
import { THEMES, VOICES, TYPE, GUT, AXES, WORDS, AXIS_ICON } from './persona.js';
import { DARK_VOICES, DARK_TYPE, DARK_AXES } from './tone.js';

const SIG_BONUS = 3;
const FLOOR_RATIO = 0.8;

// 平衡用的微調：用 tools/tune.mjs 跑全部組合算出來，讓每個職業成為第一名的比例接近
export const JOB_BIAS = {
  hero: -0.27, fighter: 1.05, knight: 2.43, barrier: 2.06, cleric: -2.76, cook: -1.44,
  bard: 0.23, fireworks: -1.19, alchemist: 0.19, astrologer: 0.31, explorer: 0.56, tamer: -1.18,
};

// 每個面向理論上的最高分（每個事件取該面向最大的正分加總）
const DIM_MAX = Object.fromEntries(DIMS.map(d => [d,
  EVENTS.reduce((sum, ev) => sum + Math.max(0, ...ev.options.map(o => o.d[d] || 0)), 0)]));

// 事件實際發生的先後：前 5 個照走訪順序，魔王城永遠最後
function playPosition(profile, eventIndex) {
  return eventIndex === 5 ? 5 : profile.order.indexOf(eventIndex);
}

export function chosenOptions(profile) {
  return profile.choices.map((c, e) => ({ event: e, opt: EVENTS[e].options[c], pos: playPosition(profile, e) }));
}

export function dimScores(choices) {
  const raw = Object.fromEntries(DIMS.map(d => [d, 0]));
  choices.forEach((c, e) => {
    for (const [d, v] of Object.entries(EVENTS[e].options[c].d)) raw[d] += v;
  });
  return Object.fromEntries(DIMS.map(d => [d, Math.max(0, raw[d]) / DIM_MAX[d] * 10]));
}

function jobScore(job, dims, sigCount) {
  const j = JOBS[job];
  return 2 * dims[j.primary] + dims[j.secondary] + SIG_BONUS * sigCount + (JOB_BIAS[job] || 0);
}

export function rankJobs(profile) {
  const dims = dimScores(profile.choices);
  const chosen = chosenOptions(profile);
  const ranked = JOB_ORDER.map((job, idx) => {
    const sigs = chosen.filter(c => c.opt.job === job);
    return {
      job, idx, sigs,
      score: jobScore(job, dims, sigs.length),
      lastSig: sigs.length ? Math.max(...sigs.map(s => s.pos)) : -1,
    };
  });
  ranked.sort((a, b) => b.score - a.score || b.lastSig - a.lastSig || a.idx - b.idx);
  return { dims, ranked };
}

// 取前 4 名換算成總和 100 的整數百分比（最大餘數法）
function percentages(ranked) {
  const floor = ranked[4].score * FLOOR_RATIO;
  const vals = ranked.slice(0, 4).map(r => Math.max(1, r.score - floor));
  const total = vals.reduce((a, b) => a + b, 0);
  const exact = vals.map(v => v / total * 100);
  const pct = exact.map(Math.floor);
  let left = 100 - pct.reduce((a, b) => a + b, 0);
  exact.map((v, i) => [v - pct[i], i]).sort((a, b) => b[0] - a[0])
    .slice(0, left).forEach(([, i]) => pct[i]++);
  return pct;
}

function flagItems(profile, flag) {
  const items = chosenOptions(profile)
    .filter(c => c.opt.flag === flag)
    .map(c => ({ pos: c.pos, text: c.opt.flagText, memory: c.opt.memory }));
  for (const s of Object.values(SECRETS)) {
    if (s.flag === flag && (profile.secrets & s.bit)) items.push({ pos: 4.5, text: s.flagText, memory: s.memory });
  }
  return items.sort((a, b) => a.pos - b.pos);
}

export function hiddenJob(profile) {
  const cafe = flagItems(profile, 'cafe');
  const cat = flagItems(profile, 'cat');
  if (cafe.length >= 3) return { job: 'cafe', items: cafe, withCats: cat.length >= 3 };
  if (cat.length >= 3) return { job: 'cathero', items: cat };
  return null;
}

export function catCount(profile) {
  return flagItems(profile, 'cat').length;
}

// 城堡裡等的是誰：只用城堡之前的選擇決定，所以遊戲中和結果頁一定一樣
export function rulerOf(profile) {
  const n = profile.choices.slice(0, 5).reduce((a, c) => a + c, 0) + (profile.gut || []).slice(0, 5).reduce((a, c) => a + c, 0);
  return n % 2 ? 'king' : 'demon';
}

export function computeResult(profile) {
  const { dims, ranked } = rankJobs(profile);
  const pct = percentages(ranked);
  const mix = ranked.slice(0, 4).map((r, i) => ({ job: r.job, pct: pct[i] }));
  const hidden = hiddenJob(profile);
  const main = hidden ? hidden.job : ranked[0].job;
  const topDims = [...DIMS].sort((a, b) => dims[b] - dims[a]);
  return {
    profile, dims, mix, main, hidden, topDims,
    ruler: rulerOf(profile),
    journey: journeyLines(profile, ranked, mix, hidden).map(l => maiText(l, profile.gender, rulerOf(profile))),
    titles: chosenOptions(profile).sort((a, b) => a.pos - b.pos).map(c => maiText(c.opt.title, profile.gender, rulerOf(profile))),
    description: maiText(describe(main, hidden), profile.gender, rulerOf(profile)),
    type: personaType(profile, topDims),
    code: rebirthCode(profile),
    analysis: profile.choices.map((c, e) => { const v = { ...VOICES[EVENTS[e].id][c], ...(dark(profile) ? DARK_VOICES[EVENTS[e].id][c] : {}) }; const t = x => maiText(x, profile.gender, rulerOf(profile)); return { event: e, theme: THEMES[EVENTS[e].id], voice: t(v.voice), short: t(v.short), long: t(v.long) }; }),
  };
}

const dark = profile => profile.tone === 'd';

// 性格類型名稱：最高兩個面向＋三個標籤
// 轉生代碼：每個直覺反應投票給一個字，同票時以比較晚回答的那一題為準
function rebirthCode(profile) {
  const gut = profile.gut || [];
  const votes = {};
  EVENTS.forEach((ev, e) => {
    const g = GUT[ev.id];
    if (!g || gut[e] == null) return;
    const letter = (gut[e] ? g.b : g.a).letter;
    const pos = e === 5 ? 5 : profile.order.indexOf(e);
    (votes[g.axis] ||= []).push({ letter, pos });
  });
  const letters = Object.entries(AXES).map(([axis, a]) => {
    const v = votes[axis] || [];
    const count = l => v.filter(x => x.letter === l).length;
    const [x, y] = a.pair;
    if (count(x) !== count(y)) return count(x) > count(y) ? x : y;
    return v.length ? v.sort((p, q) => q.pos - p.pos)[0].letter : x;
  });
  const [en, inf, ju, li] = letters;
  const axisText = (axis, l) => (dark(profile) && DARK_AXES[l]) || AXES[axis].text[l];
  return {
    code: letters.map(l => WORDS[l]).join('・'),
    letters: Object.keys(AXES).map((axis, i) => ({ axis, icon: AXIS_ICON[axis], name: AXES[axis].name, letter: letters[i], word: WORDS[letters[i]], text: axisText(axis, letters[i]) })),
    line: `${axisText('energy', en)}；${axisText('info', inf)}；${axisText('judge', ju)}；${axisText('life', li)}。`,
  };
}

function personaType(profile, topDims) {
  const [a, b] = topDims;
  const h = profile.choices.reduce((x, c) => x * 4 + c, 7);
  const T = dark(profile) ? DARK_TYPE : TYPE;
  return {
    name: `${TYPE[a].adj}・${TYPE[b].adj}型`,
    tags: [TYPE[a].tags[h % 3], TYPE[a].tags[(h + 1) % 3], TYPE[b].tags[h % 3]],
    line: `${T[a].core}，${T[b].sub}。`,
  };
}

function describe(main, hidden) {
  const j = JOBS[main];
  if (!hidden) return j.desc;
  let text = j.descTemplate.replace('{items}', hidden.items.map(i => i.text).join(hidden.job === 'cafe' ? '、' : '，'));
  if (hidden.withCats) text += '（你的咖啡館裡，好像住了很多貓。）';
  return text;
}

function journeyLines(profile, ranked, mix, hidden) {
  const chosen = chosenOptions(profile).sort((a, b) => b.pos - a.pos); // 越晚越前面
  const first = EVENTS[profile.order[0]].name;
  let pick;
  if (hidden) {
    pick = [...hidden.items].reverse()[0].memory;
  } else {
    const main = ranked[0].job;
    const sig = chosen.find(c => c.opt.job === main);
    const alt = chosen.find(c => (c.opt.d[JOBS[main].primary] || 0) >= 2);
    pick = (sig || alt || chosen[0]).opt.memory;
  }
  const lines = [`你一醒來，第一個走向的是${first}。${pick}。`];
  const second = hidden ? mix[0] : mix[1];
  const sig2 = chosen.find(c => c.opt.job === second.job && c.opt.memory !== pick);
  const name2 = JOBS[second.job].name;
  lines.push(sig2
    ? `不過，${sig2.opt.memory}——你的靈魂裡，還住著一點${name2}（${second.pct}%）。`
    : `你的靈魂裡，還藏著 ${second.pct}% 的${name2}。`);
  lines.push('這些選擇，異世界的神明都看在眼裡喔。');
  return lines;
}

// ---- 代碼：外觀1 + 選擇6 + 順序5 + 祕密1 = 13 碼 ----

export function encodeProfile(p) {
  return p.gender + p.choices.join('') + (p.gut || [0, 0, 0, 0, 0, 0]).join('') + p.order.join('') + p.secrets + (p.tone === 'd' ? 'd' : '');
}

export function decodeProfile(code) {
  const m = /^([mf])([0-3]{6})([01]{6})([0-4]{5})([0-3])(d?)$/.exec(code || '');
  if (!m) return null;
  const order = m[4].split('').map(Number);
  if (new Set(order).size !== 5) return null;
  return { gender: m[1], choices: m[2].split('').map(Number), gut: m[3].split('').map(Number), order, secrets: Number(m[5]), tone: m[6] || 'l' };
}

export function encodeParty(profiles) {
  return [VERSION, ...profiles.map(encodeProfile)].join('.');
}

export function decodeParty(hash) {
  const parts = (hash || '').replace(/^#/, '').replace(/\.me$/, '').split('.');
  if (parts[0] !== VERSION) return [];
  const profiles = parts.slice(1, 5).map(decodeProfile);
  return profiles.every(Boolean) ? profiles : [];
}

// ---- 六碼轉生代碼：一個人的全部答案塞進 30 bits，方便用嘴巴報給朋友 ----
// 沒有 0/O、1/I，避免看錯
const CODE_ABC = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const FACT = [24, 6, 2, 1, 1];

function permIndex(order) {
  const rest = [0, 1, 2, 3, 4];
  return order.reduce((acc, v, i) => { const k = rest.indexOf(v); rest.splice(k, 1); return acc + k * FACT[i]; }, 0);
}
function permFromIndex(n) {
  const rest = [0, 1, 2, 3, 4];
  return FACT.map(f => { const k = Math.floor(n / f); n %= f; return rest.splice(k, 1)[0]; });
}
const parity = n => { let p = 0; while (n) { p ^= n & 1; n >>>= 1; } return p; };

export function toShortCode(p) {
  let n = p.gender === 'm' ? 1 : 0;
  n = n * 2 + (p.tone === 'd' ? 1 : 0);
  for (const c of p.choices) n = n * 4 + c;
  for (const g of p.gut || [0, 0, 0, 0, 0, 0]) n = n * 2 + g;
  n = n * 128 + permIndex(p.order);
  n = n * 4 + p.secrets;
  n = n * 2 + parity(n);
  let out = '';
  for (let i = 0; i < 6; i++) { out = CODE_ABC[n % 32] + out; n = Math.floor(n / 32); }
  return out;
}

export function fromShortCode(str) {
  const s = String(str || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/I/g, '1');
  if (s.length !== 6) return null;
  let n = 0;
  for (const ch of s) { const v = CODE_ABC.indexOf(ch); if (v < 0) return null; n = n * 32 + v; }
  if (parity(Math.floor(n / 2)) !== n % 2) return null;
  n = Math.floor(n / 2);
  const secrets = n % 4; n = Math.floor(n / 4);
  const pi = n % 128; n = Math.floor(n / 128);
  if (pi > 119) return null;
  const gut = []; for (let i = 0; i < 6; i++) { gut.unshift(n % 2); n = Math.floor(n / 2); }
  const choices = []; for (let i = 0; i < 6; i++) { choices.unshift(n % 4); n = Math.floor(n / 4); }
  const tone = n % 2 ? 'd' : 'l'; n = Math.floor(n / 2);
  return { gender: n % 2 ? 'm' : 'f', choices, gut, order: permFromIndex(pi), secrets, tone };
}

// ---- 隊伍 ----

function hashCodes(profiles) {
  let h = 0;
  for (const ch of profiles.map(encodeProfile).join('')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

// 兩個人合不合：同職業、天生搭檔、同屬性，或互補
export function pairMatch(me, other) {
  const dot = DIMS.reduce((a, d) => a + me.dims[d] * other.dims[d], 0);
  const len = r => Math.sqrt(DIMS.reduce((a, d) => a + r.dims[d] ** 2, 0)) || 1;
  const similar = Math.round(100 * dot / (len(me) * len(other)));
  const a = JOBS[me.main], b = JOBS[other.main];
  const [ma, mb] = [DIM_INFO[me.topDims[0]], DIM_INFO[other.topDims[0]]];
  if (me.main === other.main)
    return { icon: '👯', label: '一模一樣', similar, text: `你們轉生成了同一個職業！很多事不用說出口，對方就懂了。` };
  if (a.partner === other.main)
    return { icon: '💞', label: '天生搭檔', similar, text: a.partnerText };
  if (b.partner === me.main)
    return { icon: '💞', label: '天生搭檔', similar, text: `在${b.name}眼裡，${a.name}是最可靠的夥伴；你們一起出發，什麼都不怕。` };
  if (me.topDims[0] === other.topDims[0])
    return { icon: '🤝', label: '同屬性', similar, text: `你們都是「${ma.name}」系的人。${ma.strong}` };
  return { icon: '🧩', label: '互補型', similar, text: `你帶來「${ma.name}」，對方帶來「${mb.name}」，剛好補上彼此缺的那一塊。` };
}

export function teamInfo(profiles) {
  const results = profiles.map(computeResult);
  const sum = Object.fromEntries(DIMS.map(d => [d, results.reduce((a, r) => a + r.dims[d], 0)]));
  const avg = Object.fromEntries(DIMS.map(d => [d, sum[d] / results.length]));
  const order = [...DIMS].sort((a, b) => sum[b] - sum[a]);
  const top = order[0], second = order[1], low = order[order.length - 1];
  const h = hashCodes(profiles);
  const mains = results.map(r => r.main);

  let prefix = TEAM_PREFIX[top][h % 2];
  const coreJob = JOB_ORDER.map(job => ({ job, s: 2 * avg[JOBS[job].primary] + avg[JOBS[job].secondary] }))
    .sort((a, b) => b.s - a.s)[0].job;
  let noun = JOBS[coreJob].noun;
  let type = TEAM_TYPE[second];

  let name;
  if (results.length === 4 && new Set(mains).size === 1) {
    name = `${JOBS[mains[0]].noun}四重奏`;
  } else {
    if (mains.includes('cathero')) { noun = '肉球'; type = '喵喵團'; }
    if (mains.includes('cafe')) type = '咖啡館';
    if (mains.filter(m => m === 'cook').length >= 2) prefix = '先吃飽再說的';
    if (results.length === 4 && new Set(profiles.map(p => p.order[0])).size === 1) prefix = '心有靈犀的';
    if (results.length === 4 && new Set(mains).size === 4 && DIMS.every(d => avg[d] >= 5)) noun = '彩虹';
    name = prefix + noun + type;
  }
  return { results, avg, top, low, name };
}
