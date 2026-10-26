// 地圖的靜態圖塊：草地、小路、河、樹、建築。全部用矩形一格一格畫出來。

export const TILE = 32;

const C = {
  grass: '#6ACB4E', grassL: '#8EDC5C', grassD: '#4FAF3E', grassDD: '#3E9A36', grassHi: '#B4EC7A',
  forest: '#3F8F4C', forestL: '#52A85C', forestD: '#2F7440', forestDD: '#25603A',
  path: '#EBCB92', pathL: '#F6E2B6', pathD: '#D3AC6E', pathEdge: '#B98C54',
  water: '#4FC0F0', waterL: '#8EE0FF', waterD: '#2F9AD8', foam: '#E8FAFF', bank: '#9A6A3A', bankD: '#6E4A2A',
  leaf: '#45A048', leafL: '#6CC456', leafHi: '#A2E36E', leafD: '#2E7A3A', leafLine: '#1E4A2A',
  trunk: '#8A5A34', trunkD: '#5E3C22',
  line: '#3A2A3A',
};

function rnd(x, y, i) {
  let h = (x * 374761393 + y * 668265263 + i * 2147483647) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function drawMap(c, ROWS, PATH) {
  const W = ROWS[0].length, H = ROWS.length;
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? '?' : ROWS[y][x];
  const isPath = (x, y) => PATH.has(`${x},${y}`);
  // 用一列一列的矩形畫圓
  const disc = (cx, cy, r, col) => {
    for (let dy = -r; dy <= r; dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
      R(cx - w, cy + dy, w * 2 + 1, 1, col);
    }
  };

  // ---- 地面 ----
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = ROWS[y][x], X = x * TILE, Y = y * TILE;
      const forest = t === 'F' || (t === 'T' && x <= 4 && y >= 5 && y <= 8);
      if (forest) groundForest(X, Y, x, y);
      else groundGrass(X, Y, x, y, t === 'M');
      if (isPath(x, y)) groundPath(X, Y, x, y);
    }
  }
  function groundGrass(X, Y, x, y, meadow) {
    R(X, Y, TILE, TILE, meadow ? '#7CD65A' : C.grass);
    // 細微的明暗格紋
    for (let i = 0; i < 10; i++) {
      const r = rnd(x, y, i);
      R(X + (r % 30), Y + ((r >> 6) % 30), 2, 2, r % 3 ? C.grassL : C.grassD);
    }
    // 草叢
    const tufts = meadow ? 7 : 3;
    for (let i = 0; i < tufts; i++) {
      const r = rnd(x, y, i + 20);
      const tx = X + 2 + (r % 26), ty = Y + 4 + ((r >> 5) % 22);
      const h = meadow ? 4 + (r >> 10) % 5 : 3;
      R(tx, ty, 1, h, C.grassDD); R(tx + 2, ty + 1, 1, h - 1, C.grassDD); R(tx + 1, ty - 1, 1, h + 1, C.grassD);
      R(tx + 1, ty - 1, 1, 1, C.grassHi);
    }
    if (!meadow && rnd(x, y, 99) % 7 === 0) flower(X + 6 + rnd(x, y, 98) % 18, Y + 6 + rnd(x, y, 97) % 18, rnd(x, y, 96) % 2 ? '#FFFFFF' : '#FFB3C7');
  }
  function groundForest(X, Y, x, y) {
    R(X, Y, TILE, TILE, C.forest);
    for (let i = 0; i < 12; i++) {
      const r = rnd(x, y, i);
      R(X + (r % 30), Y + ((r >> 6) % 30), 2, 2, r % 3 ? C.forestL : C.forestD);
    }
    for (let i = 0; i < 3; i++) {
      const r = rnd(x, y, i + 40);
      const tx = X + 2 + (r % 26), ty = Y + 4 + ((r >> 5) % 22);
      R(tx, ty, 1, 4, C.forestDD); R(tx + 2, ty + 1, 1, 3, C.forestDD); R(tx + 1, ty - 1, 1, 5, C.forestL);
    }
    if (rnd(x, y, 77) % 5 === 0) { // 小香菇
      const mx = X + 8 + rnd(x, y, 76) % 14, my = Y + 10 + rnd(x, y, 75) % 12;
      R(mx, my + 3, 2, 3, '#F2E8D8'); R(mx - 2, my, 6, 3, '#E0483E'); R(mx - 1, my + 1, 1, 1, '#FFFFFF');
    }
  }
  function flower(fx, fy, col) {
    R(fx, fy - 1, 1, 1, col); R(fx - 1, fy, 3, 1, col); R(fx, fy + 1, 1, 1, col); R(fx, fy, 1, 1, '#FFD84A');
  }
  function groundPath(X, Y, x, y) {
    R(X, Y, TILE, TILE, C.path);
    for (let i = 0; i < 8; i++) {
      const r = rnd(x, y, i + 60);
      R(X + (r % 29), Y + ((r >> 6) % 29), 3, 2, r % 2 ? C.pathL : C.pathD);
    }
    const r = rnd(x, y, 70);
    R(X + 6 + r % 18, Y + 8 + (r >> 8) % 16, 3, 2, C.pathEdge); // 小石子
    // 邊緣：旁邊不是小路就畫一條深色邊和草
    const edge = (nx, ny) => !isPath(nx, ny) && at(nx, ny) !== '=' && at(nx, ny) !== '~';
    if (edge(x, y - 1)) { R(X, Y, TILE, 2, C.pathEdge); for (let i = 0; i < 8; i++) R(X + i * 4 + (y % 2), Y + 2, 2, 2, C.grassD); }
    if (edge(x, y + 1)) { R(X, Y + 30, TILE, 2, C.pathEdge); for (let i = 0; i < 8; i++) R(X + i * 4 + 1, Y + 28, 2, 2, C.pathD); }
    if (edge(x - 1, y)) { R(X, Y, 2, TILE, C.pathEdge); for (let i = 0; i < 8; i++) R(X + 2, Y + i * 4, 2, 2, C.grassD); }
    if (edge(x + 1, y)) { R(X + 30, Y, 2, TILE, C.pathEdge); for (let i = 0; i < 8; i++) R(X + 28, Y + i * 4 + 2, 2, 2, C.grassD); }
  }

  // ---- 河與橋 ----
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const t = ROWS[y][x];
      if (t !== '~' && t !== '=') continue;
      const X = x * TILE, Y = y * TILE;
      R(X, Y, TILE, TILE, C.water);
      R(X, Y + 8, TILE, 10, C.waterL);
      R(X, Y + 22, TILE, 10, C.waterD);
      // 上下岸邊
      if (at(x, y - 1) !== '~' && at(x, y - 1) !== '=') { R(X, Y, TILE, 5, C.bank); R(X, Y + 5, TILE, 2, C.bankD); R(X, Y + 7, TILE, 2, C.foam); }
      if (at(x, y + 1) !== '~' && at(x, y + 1) !== '=') { R(X, Y + 26, TILE, 2, C.foam); R(X, Y + 28, TILE, 4, C.bank); }
      if (t === '=') {
        R(X + 3, Y - 4, 26, 40, '#5E3C22');
        for (let i = 0; i < 9; i++) { R(X + 4, Y - 3 + i * 4, 24, 3, i % 2 ? '#C08A52' : '#B07A44'); }
        R(X + 1, Y - 6, 4, 42, '#7A4E2E'); R(X + 27, Y - 6, 4, 42, '#7A4E2E');
        R(X + 1, Y - 8, 4, 4, '#9A6A3A'); R(X + 27, Y - 8, 4, 4, '#9A6A3A');
      }
    }
  }

  // ---- 物件（由上往下畫，前面的會蓋住後面的） ----
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = ROWS[y][x], X = x * TILE, Y = y * TILE;
      if (t === 'T') tree(X + 16, Y + 14, x, y);
      if (t === 'f') { flower(X + 8, Y + 10, '#FFB3C7'); flower(X + 20, Y + 18, '#FFE58A'); flower(X + 13, Y + 24, '#FFFFFF'); flower(X + 24, Y + 8, '#C9B8FF'); }
      if (t === 'b') bush(X, Y);
      if (t === 'w') fountain(X, Y);
      if (t === 'c') campfire(X, Y);
    }
  }
  function tree(cx, cy, x, y) {
    R(cx - 10, cy + 14, 20, 3, 'rgba(20,40,20,.25)');
    R(cx - 3, cy + 6, 7, 11, C.trunkD); R(cx - 2, cy + 6, 4, 10, C.trunk);
    disc(cx - 5, cy, 9, C.leafLine); disc(cx + 5, cy, 9, C.leafLine); disc(cx, cy - 6, 9, C.leafLine);
    disc(cx - 5, cy, 8, C.leafD); disc(cx + 5, cy, 8, C.leafD); disc(cx, cy - 6, 8, C.leaf);
    disc(cx - 5, cy - 1, 6, C.leaf); disc(cx + 4, cy - 1, 6, C.leaf);
    disc(cx - 3, cy - 8, 4, C.leafL); disc(cx - 7, cy - 2, 3, C.leafL);
    R(cx - 5, cy - 10, 3, 2, C.leafHi); R(cx - 9, cy - 3, 2, 2, C.leafHi);
    if (rnd(x, y, 5) % 4 === 0) { R(cx + 4, cy - 4, 2, 2, '#E0483E'); R(cx - 2, cy + 2, 2, 2, '#E0483E'); }
  }
  function bush(X, Y) {
    R(X + 2, Y + 26, 28, 4, 'rgba(20,40,20,.25)');
    disc(X + 10, Y + 18, 9, C.leafLine); disc(X + 22, Y + 18, 9, C.leafLine);
    disc(X + 10, Y + 18, 8, C.leafD); disc(X + 22, Y + 18, 8, C.leaf);
    disc(X + 12, Y + 14, 4, C.leafL);
    R(X + 8, Y + 20, 2, 2, '#B04AC8'); R(X + 20, Y + 16, 2, 2, '#B04AC8'); R(X + 24, Y + 22, 2, 2, '#B04AC8');
  }
  function fountain(X, Y) {
    R(X + 1, Y + 10, 30, 20, C.line);
    R(X + 2, Y + 11, 28, 18, '#C8CED8'); R(X + 2, Y + 24, 28, 5, '#9AA2B2');
    R(X + 5, Y + 13, 22, 10, '#6FD0F5'); R(X + 6, Y + 14, 8, 2, '#C8F4FF');
    R(X + 13, Y + 2, 6, 14, C.line); R(X + 14, Y + 3, 4, 12, '#D8DEE8');
    R(X + 12, Y + 1, 8, 3, '#8EE0FF');
  }
  function campfire(X, Y) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; R(X + 14 + Math.round(Math.cos(a) * 10), Y + 22 + Math.round(Math.sin(a) * 5), 4, 3, i % 2 ? '#9AA2B2' : '#7A8292'); }
    R(X + 7, Y + 21, 18, 3, '#7A4E2E'); R(X + 11, Y + 18, 10, 3, '#5E3C22');
  }

  // ---- 建築 ----
  demonCastle(3 * TILE, 0);
  royalWall(0, 14 * TILE, W * TILE);
  shrine(1 * TILE, 10 * TILE);
  guild(8 * TILE, 10 * TILE);
  shop(10 * TILE, 11 * TILE);

  function demonCastle(X, Y) {
    const stone = '#5A4880', stoneL = '#6E5A98', stoneD = '#3E3060';
    R(X + 8, Y + 14, 144, 82, C.line);
    R(X + 9, Y + 15, 142, 80, stone);
    for (let r = 0; r < 10; r++) for (let i = 0; i < 9; i++) R(X + 9 + i * 16 + (r % 2) * 8, Y + 16 + r * 8, 14, 1, stoneD);
    for (let i = 0; i < 9; i++) R(X + 12 + i * 16, Y + 8, 10, 8, stone);
    // 塔
    for (const tx of [X, X + 128]) {
      R(tx - 1, Y + 17, 34, 79, C.line); R(tx, Y + 18, 32, 77, stoneL); R(tx + 24, Y + 18, 8, 77, stone);
      for (let i = 0; i < 5; i++) { R(tx + 2 - 1, Y + 34 - 1 - i, 30, 1, C.line); }
      R(tx + 2, Y + 4, 28, 14, '#8A2A5A'); R(tx + 6, Y - 2, 20, 8, '#8A2A5A'); R(tx + 12, Y - 6, 8, 6, '#8A2A5A');
      R(tx + 4, Y + 6, 6, 10, '#B04A7A');
      R(tx + 12, Y + 40, 8, 12, C.line); R(tx + 13, Y + 41, 6, 10, '#FFD86A'); R(tx + 13, Y + 41, 3, 4, '#FFF2B0');
      R(tx + 12, Y + 66, 8, 12, C.line); R(tx + 13, Y + 67, 6, 10, '#FFD86A');
    }
    // 中央主樓
    R(X + 50, Y - 2, 60, 30, C.line); R(X + 51, Y - 1, 58, 28, stoneL);
    R(X + 62, Y + 4, 36, 16, C.line); R(X + 64, Y + 6, 32, 12, '#C8333F'); R(X + 79, Y + 6, 2, 12, '#7A1A2A');
    R(X + 66, Y + 8, 6, 4, '#FF8A9A');
    // 旗子
    for (const fx of [X + 46, X + 112]) { R(fx, Y - 4, 2, 22, '#2A2038'); R(fx + 2, Y - 4, 10, 7, '#B0233A'); R(fx + 2, Y + 3, 6, 2, '#B0233A'); }
    // 城門
    R(X + 63, Y + 54, 34, 42, C.line);
    R(X + 64, Y + 58, 32, 38, '#6B4A3A'); R(X + 68, Y + 55, 24, 4, '#6B4A3A');
    R(X + 79, Y + 58, 2, 38, '#3E2A22');
    for (let i = 0; i < 4; i++) { R(X + 70, Y + 64 + i * 8, 2, 2, '#C8C8D8'); R(X + 88, Y + 64 + i * 8, 2, 2, '#C8C8D8'); }
  }
  function royalWall(X, Y, w) {
    R(X, Y, w, TILE, C.line);
    R(X, Y + 6, w, 26, '#F4F0E8');
    for (let r = 0; r < 3; r++) for (let i = 0; i < 24; i++) R(X + i * 16 + (r % 2) * 8, Y + 12 + r * 7, 14, 1, '#D8D0C0');
    for (let i = 0; i < w / 16; i++) if (i % 2 === 0) { R(X + i * 16, Y, 12, 7, '#F4F0E8'); R(X + i * 16, Y, 12, 1, C.line); }
    R(X, Y + 6, w, 2, '#E8C060');
    for (const bx of [48, 112, 224, 288]) { R(X + bx, Y + 9, 10, 16, '#3A6EA5'); R(X + bx + 3, Y + 12, 4, 4, '#F2C94C'); }
    R(X + 5 * TILE + 3, Y + 6, 26, 26, C.line); R(X + 5 * TILE + 4, Y + 8, 24, 24, '#8A5A3A');
    R(X + 5 * TILE + 15, Y + 8, 2, 24, '#5E3C22'); R(X + 5 * TILE + 4, Y + 8, 24, 2, '#E8C060');
  }
  function shrine(X, Y) {
    R(X + 2, Y + 58, 60, 6, 'rgba(20,40,20,.25)');
    R(X + 4, Y + 44, 56, 16, '#C8CED8'); R(X + 4, Y + 56, 56, 4, '#9AA2B2');
    R(X + 8, Y + 18, 48, 28, '#FFF6E9');
    R(X + 10, Y + 18, 6, 36, '#D8483E'); R(X + 48, Y + 18, 6, 36, '#D8483E'); R(X + 12, Y + 18, 2, 36, '#F07060');
    // 屋頂
    R(X - 1, Y + 9, 66, 11, C.line); R(X, Y + 10, 64, 9, '#C83A30'); R(X, Y + 10, 64, 2, '#E85A4A');
    R(X + 5, Y + 2, 54, 9, C.line); R(X + 6, Y + 3, 52, 7, '#C83A30');
    R(X - 2, Y + 8, 6, 4, '#C83A30'); R(X + 60, Y + 8, 6, 4, '#C83A30');
    R(X + 28, Y, 8, 4, '#F2C94C');
    // 女神像的光
    R(X + 24, Y + 24, 16, 22, '#FFE8A0'); R(X + 28, Y + 26, 8, 8, '#FFFFFF'); R(X + 26, Y + 34, 12, 12, '#F2E8C8');
    R(X + 22, Y + 22, 20, 2, '#F2C94C');
    // 燈籠
    for (const lx of [X + 2, X + 56]) { R(lx, Y + 38, 6, 8, C.line); R(lx + 1, Y + 39, 4, 6, '#FFD86A'); }
  }
  function guild(X, Y) {
    R(X + 2, Y + 60, 62, 4, 'rgba(20,40,20,.25)');
    R(X + 3, Y + 21, 58, 41, C.line);
    R(X + 4, Y + 22, 56, 40, '#F4E8CC');
    for (const bx of [4, 30, 56]) R(X + bx, Y + 22, 4, 40, '#8A5A34');
    R(X + 4, Y + 40, 56, 3, '#8A5A34');
    // 屋頂
    R(X - 3, Y + 3, 70, 20, C.line);
    for (let r = 0; r < 4; r++) R(X - 2 + r, Y + 4 + r * 5, 68 - r * 2, 5, r % 2 ? '#B04A3A' : '#C85A44');
    R(X + 44, Y - 4, 8, 10, C.line); R(X + 45, Y - 3, 6, 8, '#9A6A5A');
    // 窗戶
    for (const wx of [X + 10, X + 42]) { R(wx - 1, Y + 26, 14, 12, C.line); R(wx, Y + 27, 12, 10, '#BFE6FF'); R(wx + 5, Y + 27, 2, 10, '#8A5A34'); R(wx + 1, Y + 28, 3, 3, '#FFFFFF'); }
    // 門
    R(X + 23, Y + 43, 18, 19, C.line); R(X + 24, Y + 44, 16, 18, '#7A4E2E'); R(X + 31, Y + 44, 2, 18, '#5E3C22'); R(X + 36, Y + 52, 2, 2, '#F2C94C');
    // 招牌（劍與盾）
    R(X + 22, Y + 11, 20, 12, C.line); R(X + 23, Y + 12, 18, 10, '#F2C94C');
    R(X + 27, Y + 14, 2, 7, '#5A6A8A'); R(X + 25, Y + 18, 6, 1, '#5A6A8A'); R(X + 32, Y + 14, 6, 6, '#C8333F');
    // 木桶
    R(X + 48, Y + 50, 10, 12, C.line); R(X + 49, Y + 51, 8, 10, '#B07A44'); R(X + 49, Y + 54, 8, 1, '#5E3C22'); R(X + 49, Y + 58, 8, 1, '#5E3C22');
  }
  function shop(X, Y) {
    R(X + 2, Y + 6, 28, 26, C.line); R(X + 3, Y + 7, 26, 25, '#C89A6A');
    for (let i = 0; i < 7; i++) R(X + 1 + i * 4, Y + 2, 4, 7, i % 2 ? '#FFFFFF' : '#F08AAE');
    R(X, Y + 8, 32, 2, C.line);
    R(X + 5, Y + 12, 12, 10, C.line); R(X + 18, Y + 14, 9, 18, C.line);
    R(X + 19, Y + 15, 7, 17, '#6B4A3A');
    R(X + 6, Y + 13, 10, 8, '#FFE8B0');
  }
}

// 地圖下方的空白處用的草地圖案
export function grassPattern() {
  const c = document.createElement('canvas');
  c.width = TILE; c.height = TILE;
  drawMap(c.getContext('2d'), ['.'], new Set());
  return c.toDataURL();
}
