// 地圖：圖塊、移動、鏡頭、觸發。畫面上的對話和選單由 main.js 處理。
import { drawPerson, drawCat, drawSlime, drawItem, LOOKS, CATS } from './pixel.js';
import { drawMap, grassPattern } from './tiles.js';

export const TILE = 32;
const W = 11, H = 15;
const SPEED = 5; // 每秒幾格
const VIEW_TILES = 8; // 手機畫面寬度大約看得到幾格

// T 樹  F 森林地  C 魔王城  G 魔王城城門  ~ 河  = 橋  c 營火  w 噴水池  b 樹叢
// S 女神祠堂  U 冒險者公會  H 打烊小店  M 草原  K 王城  f 花
const ROWS = [
  'TTTCCCCCTTT',
  'TT.CCCCC.TT',
  'T..CCGCC..T',
  'f.........f',
  '~~~~~=~~~~~',
  'TFFFF....c.',
  'FFFFF......',
  'TFFFF......',
  'FFFFF..f...',
  '.b...w.....',
  '.SS.....UU.',
  '.SS.....UUH',
  '...MMMMM...',
  'f..MMMMM..f',
  'KKKKKKKKKKK',
];
const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 'T' : ROWS[y][x];
const PATH = new Set();
for (let y = 3; y <= 13; y++) PATH.add(`5,${y}`);
for (let x = 1; x <= 9; x++) PATH.add(`${x},9`);
for (let x = 0; x <= 10; x++) PATH.add(`${x},3`);

export const START = { x: 5, y: 10 };

// 事件地點：triggers = 走到這些格子就觸發；zone = 走進範圍就觸發
export const PLACES = {
  shrine: { triggers: [[2, 9], [3, 10], [3, 11], [1, 12], [2, 12]], marker: [1.5, 9.6], tiles: [[1, 10], [2, 10], [1, 11], [2, 11]] },
  guild: { triggers: [[8, 9], [9, 9], [7, 10], [7, 11], [8, 12], [9, 12]], marker: [8.5, 9.6], tiles: [[8, 10], [9, 10], [8, 11], [9, 11]] },
  meadow: { zone: [3, 12, 7, 13], marker: [5, 11.4] },
  forest: { zone: [0, 5, 4, 8], marker: [2, 5.4] },
  camp: { triggers: [[8, 5], [8, 6], [9, 6], [10, 6]], marker: [9, 4.4], tiles: [[9, 5], [10, 5]] },
  castle: { triggers: [[5, 2]], marker: [5, 1.4], tiles: [[3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [3, 2], [4, 2], [6, 2], [7, 2]] },
};

// 走過去選的物件位置（草原、森林）
export const WALK_ITEMS = {
  meadow: [{ at: [3, 12], kind: 'gloves' }, { at: [4, 13], kind: 'stick' }, { at: [6, 13], kind: 'bottle' }, { at: [5, 12], kind: 'slime' }],
  forest: [{ at: [1, 6], kind: 'sparkle' }, { at: [0, 8], kind: 'eyes' }, { at: [3, 8], kind: 'clearing' }, { at: [4, 5], kind: 'tallTree' }],
};

const NPCS = {
  villager: { at: [6, 8], look: LOOKS.villager, chat: 'villager' },
  sign: { at: [3, 6], sign: true, chat: 'sign' },
  mai: { at: [10, 5], look: LOOKS.mai, event: 'camp' },
};
const SECRET_TILES = { box: [[0, 9]], shop: [[10, 10], [10, 12]] };

const BLOCKING = new Set(['T', 'C', 'G', '~', 'c', 'w', 'b', 'S', 'U', 'H', 'K']);

export function createWorld(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const state = {
    gender: opts.gender,
    player: { x: START.x, y: START.y, px: START.x * TILE, py: START.y * TILE, dir: 'up', frame: 0, moving: false },
    path: [], pending: null,
    done: new Set(), active: null, unlocked: false, cats: 0,
    secrets: new Set(), paused: true,
    history: [], camX: 0, camY: 0, scale: 1, viewW: W * TILE, viewH: H * TILE,
    lastInput: performance.now(), t: 0, darkSince: 0,
    timeOfDay: 0,
  };
  const staticLayer = document.createElement('canvas');
  staticLayer.width = W * TILE; staticLayer.height = H * TILE;
  drawMap(staticLayer.getContext('2d'), ROWS, PATH);
  canvas.parentElement.style.backgroundImage = `url(${grassPattern()})`;

  // ---- 版面 ----
  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    state.scale = box.width / (VIEW_TILES * TILE);
    state.viewW = Math.min(W * TILE, Math.ceil(box.width / state.scale));
    state.viewH = Math.min(H * TILE, Math.floor(box.height / state.scale));
    canvas.width = state.viewW; canvas.height = state.viewH;
    canvas.style.width = `${state.viewW * state.scale}px`;
    canvas.style.height = `${state.viewH * state.scale}px`;
    ctx.imageSmoothingEnabled = false;
    canvas.parentElement.style.backgroundSize = `${TILE * state.scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- 地形 ----
  function isItemTile(x, y) {
    if (!state.active || !WALK_ITEMS[state.active]) return -1;
    return WALK_ITEMS[state.active].findIndex(i => i.at[0] === x && i.at[1] === y);
  }
  function blocked(x, y) {
    const t = tileAt(x, y);
    if (t === 'G') return !state.unlocked;
    if (BLOCKING.has(t)) return true;
    if (Object.values(NPCS).some(n => n && n.at[0] === x && n.at[1] === y)) return true;
    if (x === 5 && y === 12 && !state.done.has('meadow')) {
      return !(state.active === 'meadow'); // 史萊姆本身可以被「選」
    }
    return false;
  }
  function inZone(id, x, y) {
    const z = PLACES[id].zone;
    return x >= z[0] && y >= z[1] && x <= z[2] && y <= z[3];
  }

  // Dijkstra：還沒完成的草原、森林代價比較高，路過時不會不小心踩進去
  function findPath(tx, ty) {
    const sx = state.player.x, sy = state.player.y;
    const key = (x, y) => y * W + x;
    const dist = new Map([[key(sx, sy), 0]]), prev = new Map();
    const queue = [[0, sx, sy]];
    const targetZone = ['meadow', 'forest'].find(z => inZone(z, tx, ty));
    while (queue.length) {
      queue.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = queue.shift();
      if (x === tx && y === ty) break;
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        if (blocked(nx, ny)) continue;
        let cost = 1;
        for (const z of ['meadow', 'forest']) {
          if (!state.done.has(z) && z !== targetZone && inZone(z, nx, ny)) cost += 30;
        }
        const nd = d + cost;
        if (nd < (dist.get(key(nx, ny)) ?? Infinity)) {
          dist.set(key(nx, ny), nd); prev.set(key(nx, ny), key(x, y)); queue.push([nd, nx, ny]);
        }
      }
    }
    if (!dist.has(key(tx, ty))) return null;
    const out = [];
    for (let k = key(tx, ty); k !== key(sx, sy); k = prev.get(k)) out.unshift([k % W, Math.floor(k / W)]);
    return out;
  }

  // 點到一格：決定要走去哪裡、到了要做什麼
  function interactionFor(x, y) {
    for (const [id, n] of Object.entries(NPCS)) {
      if (n && n.at[0] === x && n.at[1] === y) {
        return n.event ? { go: PLACES[n.event].triggers, act: { type: 'event', id: n.event } }
          : { go: around(x, y), act: { type: 'chat', id: n.chat } };
      }
    }
    for (const [id, p] of Object.entries(PLACES)) {
      if (p.tiles && p.tiles.some(t => t[0] === x && t[1] === y)) {
        if (id === 'castle' && !state.unlocked) return { go: [[5, 3]], act: { type: 'locked', id: 'castle' } };
        return { go: p.triggers, act: null };
      }
    }
    if (tileAt(x, y) === 'G') {
      return state.unlocked ? { go: [[5, 2]], act: null } : { go: [[5, 3]], act: { type: 'locked', id: 'castle' } };
    }
    if (tileAt(x, y) === 'K') return { go: [[5, 13]], act: { type: 'locked', id: 'home' } };
    if (tileAt(x, y) === 'H') return { go: SECRET_TILES.shop, act: null };
    if (tileAt(x, y) === 'b') return { go: SECRET_TILES.box, act: null };
    if (x === 5 && y === 12 && !state.done.has('meadow') && state.active !== 'meadow') return { go: around(5, 12), act: null };
    if (blocked(x, y)) return { go: around(x, y), act: null };
    return { go: [[x, y]], act: null };
  }
  function around(x, y) {
    return [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].filter(([a, b]) => !blocked(a, b));
  }

  function walkTo(x, y) {
    const it = interactionFor(x, y);
    let best = null;
    for (const [gx, gy] of it.go) {
      if (gx === state.player.x && gy === state.player.y) { best = []; break; }
      const p = findPath(gx, gy);
      if (p && (!best || p.length < best.length)) best = p;
    }
    if (!best) return;
    state.path = best;
    state.pending = it.act;
    if (!best.length) arrive();
  }

  // ---- 到達一格時檢查觸發 ----
  function arrive() {
    const { x, y } = state.player;
    const emit = a => { state.path = []; opts.onTrigger(a); };
    // 走過去選物件
    const item = isItemTile(x, y);
    if (item >= 0) return emit({ type: 'item', id: state.active, index: item });
    for (const [id, p] of Object.entries(PLACES)) {
      if (state.done.has(id)) continue;
      if (id === 'castle' && !state.unlocked) continue;
      if (p.triggers && p.triggers.some(t => t[0] === x && t[1] === y)) return emit({ type: 'event', id });
      if (p.zone && inZone(id, x, y) && state.active !== id) return emit({ type: 'event', id });
    }
    for (const [id, tiles] of Object.entries(SECRET_TILES)) {
      if (!state.secrets.has(id) && tiles.some(t => t[0] === x && t[1] === y)) return emit({ type: 'secret', id });
    }
    if (!state.path.length && state.pending) {
      const a = state.pending; state.pending = null; opts.onTrigger(a);
    }
  }

  // ---- 輸入 ----
  let down = false, lastTile = null;
  function tileFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / state.scale + state.camX) / TILE);
    const y = Math.floor(((e.clientY - r.top) / state.scale + state.camY) / TILE);
    return [Math.max(0, Math.min(W - 1, x)), Math.max(0, Math.min(H - 1, y))];
  }
  canvas.addEventListener('pointerdown', e => {
    if (state.paused) return;
    down = true; state.lastInput = performance.now();
    const [x, y] = tileFromEvent(e); lastTile = `${x},${y}`;
    walkTo(x, y);
  });
  canvas.addEventListener('pointermove', e => {
    if (!down || state.paused) return;
    const [x, y] = tileFromEvent(e);
    if (`${x},${y}` !== lastTile) { lastTile = `${x},${y}`; state.lastInput = performance.now(); walkTo(x, y); }
  });
  window.addEventListener('pointerup', () => { down = false; });
  window.addEventListener('keydown', e => {
    if (state.paused) return;
    const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }[e.key];
    if (!d || state.path.length) return;
    state.lastInput = performance.now();
    const nx = state.player.x + d[0], ny = state.player.y + d[1];
    if (!blocked(nx, ny)) { state.path = [[nx, ny]]; state.pending = null; }
    else { state.player.dir = dirOf(d[0], d[1]); const it = interactionFor(nx, ny); if (it.act) opts.onTrigger(it.act); }
  });

  function dirOf(dx, dy) {
    return dx > 0 ? 'right' : dx < 0 ? 'left' : dy < 0 ? 'up' : 'down';
  }

  // ---- 更新 ----
  function update(dt) {
    const p = state.player;
    if (!state.paused && state.path.length) {
      const [tx, ty] = state.path[0];
      const gx = tx * TILE, gy = ty * TILE;
      p.dir = dirOf(tx - p.x, ty - p.y);
      const step = SPEED * TILE * dt;
      const dx = gx - p.px, dy = gy - p.py, dist = Math.hypot(dx, dy);
      p.moving = true;
      if (dist <= step) {
        p.px = gx; p.py = gy; p.x = tx; p.y = ty;
        state.path.shift();
        arrive();
      } else {
        p.px += dx / dist * step; p.py += dy / dist * step;
      }
    } else {
      p.moving = false;
    }
    if (p.moving) {
      state.history.unshift([p.px, p.py, p.dir]);
      if (state.history.length > 80) state.history.pop();
    }
    p.frame = Math.floor(state.t / 160);
    const ty = p.py + TILE / 2 - state.viewH / 2, tx = p.px + TILE / 2 - state.viewW / 2;
    state.camY = Math.max(0, Math.min(H * TILE - state.viewH, ty));
    state.camX = Math.max(0, Math.min(W * TILE - state.viewW, tx));
  }

  // ---- 繪圖 ----
  function render() {
    const t = state.t;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-Math.round(state.camX), -Math.round(state.camY));
    ctx.drawImage(staticLayer, 0, 0);
    // 河水閃光
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let x = 0; x < W; x++) {
      if (x === 5) continue;
      const o = (Math.floor(t / 250) + x * 3) % 6;
      ctx.fillRect(x * TILE + 4 + o * 4, 4 * TILE + 10 + (x % 2) * 10, 6, 1);
    }
    // 營火
    const fl = Math.floor(t / 120) % 3;
    ctx.fillStyle = ['#F2C94C', '#F28C3A', '#F25C3A'][fl];
    ctx.fillRect(9 * TILE + 12, 5 * TILE + 10 - fl, 8, 10 + fl);
    ctx.fillStyle = '#FFF2A0';
    ctx.fillRect(9 * TILE + 14, 5 * TILE + 16, 4, 4);
    // 城門
    if (state.unlocked) { ctx.fillStyle = '#1A1424'; ctx.fillRect(5 * TILE + 6, 2 * TILE + 4, 20, 28); }
    // 打烊小店的窗戶燈光
    if (!state.secrets.has('shop')) {
      ctx.fillStyle = `rgba(255,220,120,${0.6 + 0.3 * Math.sin(t / 500)})`;
      ctx.fillRect(10 * TILE + 6, 11 * TILE + 13, 10, 8);
    }

    const sprites = [];
    // NPC
    for (const n of Object.values(NPCS)) {
      if (!n) continue;
      const [x, y] = n.at;
      if (n.look) sprites.push([y, () => drawPerson(ctx, x * TILE, y * TILE, n.look, n === NPCS.mai ? 'left' : 'down', 0, false)]);
      if (n.sign) sprites.push([y, () => { ctx.fillStyle = '#7A4E2E'; ctx.fillRect(x * TILE + 14, y * TILE + 14, 4, 16); ctx.fillStyle = '#C89A5A'; ctx.fillRect(x * TILE + 6, y * TILE + 8, 20, 10); ctx.fillStyle = '#5A8A4A'; ctx.fillRect(x * TILE + 14, y * TILE + 8, 12, 4); }]);
    }
    // 史萊姆
    if (!state.done.has('meadow')) sprites.push([12, () => drawSlime(ctx, 5 * TILE, 12 * TILE, Math.floor(t / 300))]);
    // 紙箱
    if (!state.secrets.has('box')) {
      sprites.push([9, () => { drawItem(ctx, 0, 9 * TILE, 'box'); if (Math.floor(t / 1600) % 3 === 0) { ctx.fillStyle = '#F7B867'; ctx.fillRect(10, 9 * TILE + 14, 4, 4); } }]);
    }
    // 可以選的物件
    if (state.active && WALK_ITEMS[state.active]) {
      WALK_ITEMS[state.active].forEach(it => {
        if (it.kind === 'slime') return;
        sprites.push([it.at[1], () => drawItem(ctx, it.at[0] * TILE, it.at[1] * TILE, it.kind, t)]);
      });
    }
    // 跟在後面的貓
    const followers = [CATS.guide];
    for (let i = 0; i < Math.min(4, state.cats); i++) followers.push([CATS.calico, CATS.black, CATS.orange, CATS.calico][i]);
    followers.forEach((look, i) => {
      const h = state.history[Math.min(state.history.length - 1, (i + 1) * 9)];
      const [fx, fy, fd] = h || [state.player.px, state.player.py + TILE * (i + 1) * 0.4, 'up'];
      if (!h && i > 0) return;
      sprites.push([fy / TILE, () => drawCat(ctx, Math.round(fx), Math.round(fy) + (h ? 0 : 6), look, fd, Math.floor(t / 160), state.player.moving)]);
    });
    // 玩家
    const p = state.player;
    sprites.push([p.py / TILE + 0.01, () => drawPerson(ctx, Math.round(p.px), Math.round(p.py), LOOKS[state.gender], p.dir, p.frame, p.moving)]);
    sprites.sort((a, b) => a[0] - b[0]).forEach(s => s[1]());

    // 驚嘆號
    for (const [id, pl] of Object.entries(PLACES)) {
      if (state.done.has(id) || (id === 'castle' && !state.unlocked)) continue;
      const bounce = Math.round(Math.sin(t / 200) * 2);
      const mx = pl.marker[0] * TILE + 12, my = pl.marker[1] * TILE - 6 + bounce;
      ctx.fillStyle = '#3A2F3A'; ctx.fillRect(mx - 1, my - 1, 10, 16);
      ctx.fillStyle = '#FFE58A'; ctx.fillRect(mx, my, 8, 14);
      ctx.fillStyle = '#3A2F3A'; ctx.fillRect(mx + 3, my + 2, 2, 7); ctx.fillRect(mx + 3, my + 10, 2, 2);
    }

    // 天色
    const tint = ['rgba(0,0,0,0)', 'rgba(255,240,200,.06)', 'rgba(255,190,120,.12)', 'rgba(255,130,90,.18)', 'rgba(90,60,140,.28)', 'rgba(30,30,90,.42)'][state.timeOfDay];
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W * TILE, H * TILE);

    // 迷霧之森的黑暗
    if (!state.done.has('forest') && inZone('forest', p.x, p.y)) {
      if (!state.darkSince) state.darkSince = t;
      const dark = document.createElement('canvas');
      dark.width = W * TILE; dark.height = H * TILE;
      const d = dark.getContext('2d');
      d.fillStyle = 'rgba(8,10,24,.93)'; d.fillRect(0, 0, dark.width, dark.height);
      d.globalCompositeOperation = 'destination-out';
      const g = d.createRadialGradient(p.px + 16, p.py + 16, 10, p.px + 16, p.py + 16, 58);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.fillRect(0, 0, dark.width, dark.height);
      ctx.drawImage(dark, 0, 0);
      // 8 秒後物件自己微微發光
      if (state.active === 'forest' && t - state.darkSince > 8000) {
        const a = 0.35 + 0.25 * Math.sin(t / 300);
        WALK_ITEMS.forest.forEach(it => {
          ctx.fillStyle = `rgba(255,230,140,${a})`;
          ctx.fillRect(it.at[0] * TILE + 8, it.at[1] * TILE + 8, 16, 16);
        });
      }
    } else {
      state.darkSince = 0;
    }
    // 夜晚的星星
    if (state.timeOfDay >= 4) {
      ctx.fillStyle = 'rgba(255,255,220,.8)';
      for (let i = 0; i < 14; i++) {
        if ((Math.floor(t / 400) + i) % 5 === 0) continue;
        ctx.fillRect((i * 73) % (W * TILE), (i * 37) % (3 * TILE), 2, 2);
      }
    }
    // 太久沒動：箭頭指向最近的事件
    if (!state.paused && performance.now() - state.lastInput > 10000) {
      const next = nearestTodo();
      if (next) {
        const [mx, my] = next;
        const bob = Math.round(Math.sin(t / 150) * 3);
        ctx.fillStyle = '#FF6B8A';
        ctx.fillRect(mx * TILE + 13, my * TILE - 26 + bob, 6, 10);
        ctx.fillRect(mx * TILE + 9, my * TILE - 16 + bob, 14, 3);
        ctx.fillRect(mx * TILE + 12, my * TILE - 13 + bob, 8, 3);
      }
    }
  }

  function nearestTodo() {
    const p = state.player;
    let best = null, bd = Infinity;
    for (const [id, pl] of Object.entries(PLACES)) {
      if (state.done.has(id) || (id === 'castle' && !state.unlocked)) continue;
      const d = Math.hypot(pl.marker[0] - p.x, pl.marker[1] - p.y);
      if (d < bd) { bd = d; best = pl.marker; }
    }
    return best;
  }

  let last = performance.now(), raf;
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now; state.t = now;
    update(dt);
    render();
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);

  return {
    state,
    resize,
    walkTo,
    pause(v) { state.paused = v; if (v) state.path = []; else state.lastInput = performance.now(); },
    setActive(id) { state.active = id; },
    complete(id) { state.done.add(id); if (state.active === id) state.active = null; },
    setTimeOfDay(n) { state.timeOfDay = n; },
    unlock() { state.unlocked = true; },
    addSecret(id) { state.secrets.add(id); },
    setCats(n) { state.cats = n; },
    stop() { cancelAnimationFrame(raf); },
  };
}
