// 跑過全部選擇組合，檢查各職業出現比例（DESIGN.md 5.6）
import { computeResult } from '../js/score.js';
import { JOBS } from '../js/data.js';

const count = {};
let total = 0;
const secretsList = process.argv.includes('--secrets') ? [0, 1, 2, 3] : [0];
for (let n = 0; n < 4096; n++) {
  const choices = [0, 1, 2, 3, 4, 5].map(i => (n >> (2 * i)) & 3);
  for (const secrets of secretsList) {
    const r = computeResult({ gender: 'f', choices, order: [0, 1, 2, 3, 4], secrets });
    count[r.main] = (count[r.main] || 0) + 1;
    total++;
  }
}
let ok = true;
for (const [job, c] of Object.entries(count).sort((a, b) => b[1] - a[1])) {
  const pct = c / total * 100;
  const bad = !JOBS[job].hidden && (pct < 6 || pct > 11);
  if (bad) ok = false;
  console.log(`${JOBS[job].name.padEnd(10, '　')} ${pct.toFixed(2).padStart(6)}%${bad ? '  ← 超出 6–11%' : ''}`);
}
console.log(ok ? 'OK' : 'NEEDS TUNING');
process.exit(ok ? 0 : 1);
