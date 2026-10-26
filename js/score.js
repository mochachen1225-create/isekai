// 計分與代碼：純函式，不碰畫面。瀏覽器和 node 都能直接 import。
import { DIMS, JOBS, JOB_ORDER, EVENTS, SECRETS, VERSION, TEAM_PREFIX, TEAM_TYPE } from './data.js';
import { THEMES, VOICES, TYPE, GUT, AXES } from './persona.js';

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

export function computeResult(profile) {
  const { dims, ranked } = rankJobs(profile);
  const pct = percentages(ranked);
  const mix = ranked.slice(0, 4).map((r, i) => ({ job: r.job, pct: pct[i] }));
  const hidden = hiddenJob(profile);
  const main = hidden ? hidden.job : ranked[0].job;
  const topDims = [...DIMS].sort((a, b) => dims[b] - dims[a]);
  return {
    profile, dims, mix, main, hidden, topDims,
    journey: journeyLines(profile, ranked, mix, hidden),
    titles: chosenOptions(profile).sort((a, b) => a.pos - b.pos).map(c => c.opt.title),
    description: describe(main, hidden),
    type: personaType(profile, topDims),
    code: rebirthCode(profile),
    analysis: profile.choices.map((c, e) => ({ event: e, theme: THEMES[EVENTS[e].id], ...VOICES[EVENTS[e].id][c] })),
  };
}

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
  return {
    code: letters.join('・'),
    letters: Object.keys(AXES).map((axis, i) => ({ axis, name: AXES[axis].name, letter: letters[i], text: AXES[axis].text[letters[i]] })),
    line: `${AXES.energy.text[en]}；${AXES.info.text[inf]}；${AXES.judge.text[ju]}；${AXES.life.text[li]}。`,
  };
}

function personaType(profile, topDims) {
  const [a, b] = topDims;
  const h = profile.choices.reduce((x, c) => x * 4 + c, 7);
  return {
    name: `${TYPE[a].adj}・${TYPE[b].adj}型`,
    tags: [TYPE[a].tags[h % 3], TYPE[a].tags[(h + 1) % 3], TYPE[b].tags[h % 3]],
    line: `${TYPE[a].core}，${TYPE[b].sub}。`,
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
  lines.push('這些選擇，系統都記住了。');
  return lines;
}

// ---- 代碼：外觀1 + 選擇6 + 順序5 + 祕密1 = 13 碼 ----

export function encodeProfile(p) {
  return p.gender + p.choices.join('') + (p.gut || [0, 0, 0, 0, 0, 0]).join('') + p.order.join('') + p.secrets;
}

export function decodeProfile(code) {
  const m = /^([mf])([0-3]{6})([01]{6})([0-4]{5})([0-3])$/.exec(code || '');
  if (!m) return null;
  const order = m[4].split('').map(Number);
  if (new Set(order).size !== 5) return null;
  return { gender: m[1], choices: m[2].split('').map(Number), gut: m[3].split('').map(Number), order, secrets: Number(m[5]) };
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

// ---- 隊伍 ----

function hashCodes(profiles) {
  let h = 0;
  for (const ch of profiles.map(encodeProfile).join('')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
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
