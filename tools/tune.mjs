// 反覆調整 JOB_BIAS，讓 12 個一般職業成為第一名的比例接近平均。結果貼回 js/score.js。
import { computeResult, JOB_BIAS } from '../js/score.js';
import { JOB_ORDER } from '../js/data.js';

const profiles = [];
for (let n = 0; n < 4096; n++) {
  profiles.push({ gender: 'f', choices: [0, 1, 2, 3, 4, 5].map(i => (n >> (2 * i)) & 3), order: [0, 1, 2, 3, 4], secrets: 0 });
}
JOB_ORDER.forEach(j => { JOB_BIAS[j] = 0; });
let shares;
for (let it = 0; it < 200; it++) {
  const count = Object.fromEntries(JOB_ORDER.map(j => [j, 0]));
  let normal = 0;
  for (const p of profiles) {
    const r = computeResult(p);
    if (!r.hidden) { count[r.main]++; normal++; }
  }
  shares = Object.fromEntries(JOB_ORDER.map(j => [j, count[j] / normal]));
  const target = 1 / 12;
  const worst = Math.max(...JOB_ORDER.map(j => Math.abs(shares[j] - target)));
  if (worst < 0.004) break;
  for (const j of JOB_ORDER) JOB_BIAS[j] -= (shares[j] - target) * 8;
}
console.log(JSON.stringify(Object.fromEntries(JOB_ORDER.map(j => [j, Math.round(JOB_BIAS[j] * 100) / 100]))));
console.log(JOB_ORDER.map(j => `${j} ${(shares[j] * 100).toFixed(1)}%`).join('  '));
