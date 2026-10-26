// 地圖：背景是一張畫好的村莊圖，上面疊一層看不見的格子來決定哪裡能走、哪裡會觸發事件。
// 畫面上的對話和選單由 main.js 處理。
import { drawPerson, drawCat, drawSlime, drawItem, LOOKS, CATS } from './pixel.js';

export const TILE = 32;
const SPEED = 5;       // 每秒幾格
const VIEW_TILES = 8;  // 手機畫面寬度大約看得到幾格

// 地圖圖片 assets/map/village.webp 切成 15×20 格
// .  可以走   #  擋住   F 森林（走進去會變暗）  M 草原
// G  魔王城城門（解鎖前擋住）  c 營火  w 噴水池  S 女神祠堂  U 冒險者公會  H 打烊小店  K 王城城牆
const ROWS = [
  '###############',
  '###############',
  '###############',
  '#######GG######',
  '...............',
  '...............',
  '#######.#######',
  'FFFFFF.......##',
  'FFFFFF.....c.##',
  'FFFF.........##',
  'FFF....w..UU.##',
  '#.SS......UUU##',
  '##SS#....UUUU##',
  '##SS#....UUUUHH',
  '##SS#....UUUUHH',
  '##..#..#.......',
  '#...#.MM#MMM.##',
  '##....MMMMMM.##',
  'KKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKK',
];
const W = ROWS[0].length, H = ROWS.length;
const tileAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '#' : ROWS[y][x];

export const START = { x: 7, y: 11 };

// 事件地點：triggers = 走到這些格子就觸發；zone = 走進範圍就觸發；marker = 驚嘆號的位置
export const PLACES = {
  shrine: { triggers: [[2, 15], [3, 15]], marker: [2.5, 10.6], tag: 'S' },
  guild: { triggers: [[10, 15], [11, 15], [12, 15]], marker: [10.6, 9.5], tag: 'U' },
  meadow: { zone: 'M', marker: [8, 16.3] },
  forest: { zone: 'F', marker: [2.2, 7.2] },
  camp: { triggers: [[10, 7], [10, 8], [10, 9], [11, 7], [11, 9], [12, 9]], marker: [11, 7.2], tag: 'c' },
  castle: { triggers: [[7, 3], [8, 3]], marker: [7.5, 2.4], tag: 'G' },
};

// 走過去選的物件位置（草原、森林）
export const WALK_ITEMS = {
  meadow: [{ at: [6, 17], kind: 'gloves' }, { at: [7, 16], kind: 'stick' }, { at: [10, 16], kind: 'bottle' }, { at: [8, 17], kind: 'slime' }],
  forest: [{ at: [1, 7], kind: 'sparkle' }, { at: [0, 10], kind: 'eyes' }, { at: [3, 9], kind: 'clearing' }, { at: [5, 7], kind: 'tallTree' }],
};

const NPCS = {
  villager: { at: [9, 9], look: LOOKS.villager, chat: 'villager' },
  sign: { at: [4, 9], chat: 'sign' },
  mai: { at: [12, 8], look: LOOKS.mai, event: 'camp', dir: 'left' },
};
const SECRET_TILES = { box: [[12, 16]], shop: [[13, 15], [14, 15]] };
const BLOCKING = new Set(['#', 'G', 'c', 'w', 'S', 'U', 'H', 'K']);

export function createWorld(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const state = {
    gender: opts.gender,
    player: { x: START.x, y: START.y, px: START.x * TILE, py: START.y * TILE, dir: 'up', frame: 0, moving: false },
    path: [], pending: null,
    done: new Set(), active: null, unlocked: false, cats: 0,
    secrets: new Set(), paused: true,
    history: [], camX: 0, camY: 0, scale: 1, dpr: 1, viewW: W * TILE, viewH: H * TILE,
    lastInput: performance.now(), t: 0, darkSince: 0,
    timeOfDay: 0,
  };
  const bg = new Image();
  bg.src = 'assets/map/village.webp';
  const dark = document.createElement('canvas');
  dark.width = W * TILE; dark.height = H * TILE;

  // ---- 版面 ----
  function resize() {
    const box = canvas.parentElement.getBoundingClientRect();
    state.scale = box.width / (VIEW_TILES * TILE);
    state.dpr = Math.min(3, window.devicePixelRatio || 1);
    state.viewW = Math.min(W * TILE, box.width / state.scale);
    state.viewH = Math.min(H * TILE, box.height / state.scale);
    canvas.width = Math.round(state.viewW * state.scale * state.dpr);
    canvas.height = Math.round(state.viewH * state.scale * state.dpr);
    canvas.style.width = `${state.viewW * state.scale}px`;
    canvas.style.height = `${state.viewH * state.scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- 地形 ----
  const inZone = (id, x, y) => PLACES[id].zone && tileAt(x, y) === PLACES[id].zone;
  function isItemTile(x, y) {
    if (!state.active || !WALK_ITEMS[state.active]) return -1;
    return WALK_ITEMS[state.active].findIndex(i => i.at[0] === x && i.at[1] === y);
  }
  const slimeAt = WALK_ITEMS.meadow[3].at;
  function blocked(x, y) {
    const t = tileAt(x, y);
    if (t === 'G') return !state.unlocked;
    if (BLOCKING.has(t)) return true;
    if (Object.values(NPCS).some(n => n.at[0] === x && n.at[1] === y)) return true;
    if (x === slimeAt[0] && y === slimeAt[1] && !state.done.has('meadow')) return state.active !== 'meadow';
    return false;
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
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || blocked(nx, ny)) continue;
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

  function around(x, y) {
    return [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].filter(([a, b]) => !blocked(a, b));
  }

  // 點到一格：決定要走去哪裡、到了要做什麼
  function interactionFor(x, y) {
    for (const n of Object.values(NPCS)) {
      if (n.at[0] === x && n.at[1] === y) {
        return n.event ? { go: PLACES[n.event].triggers, act: { type: 'event', id: n.event } }
          : { go: around(x, y), act: { type: 'chat', id: n.chat } };
      }
    }
    const t = tileAt(x, y);
    for (const [id, p] of Object.entries(PLACES)) {
      if (p.tag !== t) continue;
      if (id === 'castle' && !state.unlocked) return { go: [[7, 4], [8, 4]], act: { type: 'locked', id: 'castle' } };
      return { go: p.triggers, act: null };
    }
    if (t === 'K') return { go: [[x, 17], [7, 15]], act: { type: 'locked', id: 'home' } };
    if (t === 'H') return { go: SECRET_TILES.shop, act: null };
    if (t === 'w') return { go: around(x, y), act: { type: 'chat', id: 'fountain' } }; // 隱藏的小互動：沒有箭頭
    if (y <= 2 && x >= 4 && x <= 10) return state.unlocked ? { go: PLACES.castle.triggers, act: null } : { go: [[7, 4], [8, 4]], act: { type: 'locked', id: 'castle' } };
    if (blocked(x, y)) return { go: around(x, y), act: null };
    return { go: [[x, y]], act: null };
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

  // ---- 點陣角色：先畫成 32×32 小圖再放大，邊緣才會銳利 ----
  const spriteCache = new Map();
  function sprite(key, draw) {
    let c = spriteCache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      draw(c.getContext('2d'));
      spriteCache.set(key, c);
    }
    return c;
  }
  function person(look, name, x, y, dir, frame, moving) {
    const f = moving ? frame % 2 : 0;
    ctx.drawImage(sprite(`p|${name}|${dir}|${f}|${moving}`, c => drawPerson(c, 0, 0, look, dir, f, moving)), Math.round(x), Math.round(y));
  }
  function cat(look, name, x, y, dir, frame, moving) {
    const f = moving ? frame % 2 : 0;
    ctx.drawImage(sprite(`c|${name}|${dir}|${f}|${moving}`, c => drawCat(c, 0, 0, look, dir, f, moving)), Math.round(x), Math.round(y));
  }

  // ---- 繪圖 ----
  function render() {
    const t = state.t, p = state.player;
    const k = state.scale * state.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#4FAF3E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(k, 0, 0, k, -state.camX * k, -state.camY * k);
    if (bg.complete && bg.naturalWidth) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bg, 0, 0, W * TILE, H * TILE);
    }
    ctx.imageSmoothingEnabled = false;

    // 打開的城門
    if (state.unlocked) {
      ctx.fillStyle = '#140E1E';
      ctx.fillRect(6.78 * TILE, 2.62 * TILE, 1.46 * TILE, 1.08 * TILE);
      ctx.fillRect(6.95 * TILE, 2.5 * TILE, 1.12 * TILE, 0.2 * TILE);
    }
    // 打烊小店的燈光（祕密地點的提示）
    if (!state.secrets.has('shop')) {
      ctx.fillStyle = `rgba(255,220,120,${0.25 + 0.2 * Math.sin(t / 500)})`;
      ctx.fillRect(13 * TILE + 4, 13 * TILE + 26, 2 * TILE - 8, 14);
    }

    const sprites = [];
    for (const [name, n] of Object.entries(NPCS)) {
      if (!n.look) continue;
      const [x, y] = n.at;
      sprites.push([y, () => person(n.look, name, x * TILE, y * TILE, n.dir || 'down', 0, false)]);
    }
    if (!state.done.has('meadow')) {
      const f = Math.floor(t / 300) % 2;
      sprites.push([slimeAt[1], () => ctx.drawImage(sprite(`slime|${f}`, c => drawSlime(c, 0, 0, f)), slimeAt[0] * TILE, slimeAt[1] * TILE)]);
    }
    if (!state.secrets.has('box')) {
      const [bx, by] = SECRET_TILES.box[0];
      sprites.push([by, () => {
        ctx.drawImage(sprite('box', c => drawItem(c, 0, 0, 'box')), bx * TILE, by * TILE);
        if (Math.floor(t / 1600) % 3 === 0) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(bx * TILE + 12, by * TILE + 14, 4, 4); }
      }]);
    }
    if (state.active && WALK_ITEMS[state.active]) {
      WALK_ITEMS[state.active].forEach(it => {
        if (it.kind === 'slime') return;
        sprites.push([it.at[1], () => drawItem(ctx, it.at[0] * TILE, it.at[1] * TILE, it.kind, t)]);
      });
    }
    const followers = [[CATS.guide, 'guide']];
    const extra = [[CATS.calico, 'calico'], [CATS.black, 'black'], [CATS.orange, 'orange'], [CATS.calico, 'calico']];
    for (let i = 0; i < Math.min(4, state.cats); i++) followers.push(extra[i]);
    followers.forEach(([look, name], i) => {
      const h = state.history[Math.min(state.history.length - 1, (i + 1) * 9)];
      if (!h && i > 0) return;
      const [fx, fy, fd] = h || [p.px + 18, p.py + 6, 'left'];
      sprites.push([fy / TILE, () => cat(look, name, fx, fy, fd, p.frame, p.moving)]);
    });
    sprites.push([p.py / TILE + 0.01, () => person(LOOKS[state.gender], state.gender, p.px, p.py, p.dir, p.frame, p.moving)]);
    sprites.sort((a, b) => a[0] - b[0]).forEach(s => s[1]());

    // 事件地點上方的箭頭（往下指）
    const arrow = (cx, top, col) => {
      ctx.fillStyle = '#3A2F3A';
      ctx.fillRect(cx - 4, top - 1, 8, 9); ctx.fillRect(cx - 9, top + 7, 18, 3); ctx.fillRect(cx - 7, top + 10, 14, 2);
      ctx.fillRect(cx - 5, top + 12, 10, 2); ctx.fillRect(cx - 3, top + 14, 6, 2); ctx.fillRect(cx - 1, top + 16, 2, 2);
      ctx.fillStyle = col;
      ctx.fillRect(cx - 3, top, 6, 8); ctx.fillRect(cx - 8, top + 8, 16, 2); ctx.fillRect(cx - 6, top + 10, 12, 2);
      ctx.fillRect(cx - 4, top + 12, 8, 2); ctx.fillRect(cx - 2, top + 14, 4, 2);
    };
    const bounce = Math.round(Math.sin(t / 200) * 3);
    for (const [id, pl] of Object.entries(PLACES)) {
      if (state.done.has(id) || (id === 'castle' && !state.unlocked) || id === state.active) continue;
      arrow(pl.marker[0] * TILE + 16, pl.marker[1] * TILE - 8 + bounce, '#FFE58A');
    }
    // 正在進行的「走過去選」事件：每個可以選的東西上方都有一個粉紅色箭頭，下面有一圈光
    if (state.active && WALK_ITEMS[state.active] && !(state.active === 'forest' && inZone('forest', p.x, p.y) && t - state.darkSince < 8000)) {
      WALK_ITEMS[state.active].forEach((it, i) => {
        const [ix, iy] = it.at;
        ctx.fillStyle = `rgba(255,240,170,${0.35 + 0.2 * Math.sin(t / 250 + i)})`;
        ctx.fillRect(ix * TILE + 2, iy * TILE + 24, TILE - 4, 6);
        arrow(ix * TILE + 16, iy * TILE - 16 + Math.round(Math.sin(t / 200 + i) * 3), '#FF8AA8');
      });
    }

    // 天色
    const tint = ['rgba(0,0,0,0)', 'rgba(255,240,200,.06)', 'rgba(255,190,120,.12)', 'rgba(255,130,90,.18)', 'rgba(90,60,140,.28)', 'rgba(30,30,90,.42)'][state.timeOfDay];
    ctx.fillStyle = tint; ctx.fillRect(0, 0, W * TILE, H * TILE);
    if (state.timeOfDay >= 4) {
      ctx.fillStyle = 'rgba(255,255,220,.8)';
      for (let i = 0; i < 18; i++) {
        if ((Math.floor(t / 400) + i) % 5 === 0) continue;
        ctx.fillRect((i * 73) % (W * TILE), (i * 37) % (3 * TILE), 2, 2);
      }
    }

    // 迷霧之森的黑暗：只剩主角身邊一圈光
    if (!state.done.has('forest') && inZone('forest', p.x, p.y)) {
      if (!state.darkSince) state.darkSince = t;
      const d = dark.getContext('2d');
      d.globalCompositeOperation = 'source-over';
      d.clearRect(0, 0, dark.width, dark.height);
      d.fillStyle = 'rgba(8,10,24,.93)'; d.fillRect(0, 0, dark.width, dark.height);
      d.globalCompositeOperation = 'destination-out';
      const g = d.createRadialGradient(p.px + 16, p.py + 16, 10, p.px + 16, p.py + 16, 58);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.fillRect(0, 0, dark.width, dark.height);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(dark, 0, 0);
      ctx.imageSmoothingEnabled = false;
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
