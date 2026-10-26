// 點陣圖：所有角色都在 32×32 的格子裡用矩形畫出來，放大後就是點陣風。

const OUTLINE = '#3a2f3a';

// 收集一個角色的所有色塊，先畫外框再畫填色，外框就不會蓋到別的部位。
// round = 圓角（四個角各少一格），看起來比較圓潤
function painter(ctx, ox, oy, flip) {
  const parts = [];
  const add = (x, y, w, h, col, outline = true, round = false) => parts.push({ x, y, w, h, col, outline, round });
  add.draw = () => {
    const put = (x, y, w, h, col) => {
      if (w <= 0 || h <= 0) return;
      const rx = flip ? 32 - x - w : x;
      ctx.fillStyle = col;
      ctx.fillRect(ox + rx, oy + y, w, h);
    };
    for (const p of parts) {
      if (!p.outline) continue;
      if (p.round) { put(p.x, p.y - 1, p.w, p.h + 2, OUTLINE); put(p.x - 1, p.y, p.w + 2, p.h, OUTLINE); }
      else put(p.x - 1, p.y - 1, p.w + 2, p.h + 2, OUTLINE);
    }
    for (const p of parts) {
      if (p.round) { put(p.x + 1, p.y, p.w - 2, p.h, p.col); put(p.x, p.y + 1, p.w, p.h - 2, p.col); }
      else put(p.x, p.y, p.w, p.h, p.col);
    }
  };
  return add;
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('')}`;
}

function shadow(ctx, ox, oy, w = 14) {
  ctx.fillStyle = 'rgba(30,20,40,.22)';
  ctx.fillRect(ox + 16 - w / 2 + 1, oy + 28, w - 2, 1);
  ctx.fillRect(ox + 16 - w / 2, oy + 29, w, 2);
  ctx.fillRect(ox + 16 - w / 2 + 1, oy + 31, w - 2, 1);
}

export const LOOKS = {
  m: { skin: '#FFE0C8', hair: '#A8744A', hairStyle: 'short', top: '#4A86C8', top2: '#FFFFFF', accent: '#F2A33A', legs: '#3B3550', boots: '#6B4A3A', ribbon: '#4A86C8' },
  f: { skin: '#FFE0C8', hair: '#A8744A', hairStyle: 'long', top: '#4A86C8', top2: '#FFFFFF', accent: '#F2A33A', legs: '#3B3550', boots: '#6B4A3A', ribbon: '#4A86C8' },
  king: { skin: '#FFD9B8', hair: '#E8E0D0', hairStyle: 'short', top: '#C8333F', top2: '#F2C94C', accent: '#FFFFFF', legs: '#C8333F', boots: '#6B4A3A', hat: 'crown', beard: true },
  clerk: { skin: '#FFE0C8', hair: '#5A3A2A', hairStyle: 'long', top: '#2F5D8A', top2: '#FFFFFF', accent: '#FFFFFF', legs: '#2F5D8A', boots: '#3B3550' },
  xing: { skin: '#FFE0C8', hair: '#7A5CC9', hairStyle: 'long', top: '#5A4A9E', top2: '#C9B8FF', accent: '#F2C94C', legs: '#3B3550', boots: '#3B3550', hat: 'witch' },
  mai: { skin: '#F2C8A0', hair: '#C84A2A', hairStyle: 'short', top: '#8A8F9A', top2: '#C8CDD8', accent: '#C84A2A', legs: '#4A4050', boots: '#5A3A2A' },
  villager: { skin: '#FFE0C8', hair: '#6B4A3A', hairStyle: 'short', top: '#7FB069', top2: '#E8D8B0', accent: '#E8D8B0', legs: '#6B5A4A', boots: '#5A3A2A' },
  granny: { skin: '#FFE0C8', hair: '#E0E0E8', hairStyle: 'bun', top: '#A0704A', top2: '#FFF6E9', accent: '#FFF6E9', legs: '#A0704A', boots: '#5A3A2A' },
  demon: { skin: '#F0D8E0', hair: '#1E1A28', hairStyle: 'long', top: '#1E1A28', top2: '#B0233A', accent: '#F2C94C', legs: '#1E1A28', boots: '#1E1A28', hat: 'horns', cape: '#B0233A' },
};

// dir: down / up / left / right；frame: 走路動畫的第幾格；moving: 是否在走
export function drawPerson(ctx, ox, oy, look, dir = 'down', frame = 0, moving = false) {
  const flip = dir === 'right';
  const side = dir === 'left' || dir === 'right';
  const P = painter(ctx, ox, oy, flip);
  const step = moving ? frame % 2 : -1;
  const bob = moving && frame % 2 ? 1 : 0;
  const y = v => v + bob;
  const hairL = shade(look.hair, 0.3), hairD = shade(look.hair, -0.25);
  const topD = shade(look.top, -0.2), skinD = shade(look.skin, -0.12);
  const eye = look.eye || '#5A3A7A';
  shadow(ctx, ox, oy);

  if (look.cape) P(7, y(17), 18, 11, look.cape, true, true);
  // 腳
  const lx = side ? [13, 17] : [12, 17];
  P(lx[0], 25, 3, step === 0 ? 3 : 4, look.legs);
  P(lx[1], 25, 3, step === 1 ? 3 : 4, look.legs);
  P(lx[0], step === 0 ? 27 : 28, 3, 1, look.boots, false);
  P(lx[1], step === 1 ? 27 : 28, 3, 1, look.boots, false);
  // 身體
  if (side) {
    P(12, y(18), 8, 7, look.top, true, true);
    P(17, y(19), 3, 5, topD, false);
    P(12, y(22), 8, 1, look.boots, false);
    P(14, y(19), 3, 5, look.top2, true, true);
    P(15, y(23), 2, 1, look.skin, false);
  } else {
    P(10, y(18), 12, 7, look.top, true, true);
    P(14, y(19), 4, 6, look.top2, false);
    P(19, y(19), 2, 5, topD, false);
    P(10, y(22), 12, 1, look.boots, false);
    P(15, y(22), 2, 1, '#F2C94C', false);
    P(8, y(19), 2, 4, look.top);
    P(22, y(19), 2, 4, look.top);
    P(8, y(23), 2, 1, look.skin);
    P(22, y(23), 2, 1, look.skin);
  }
  P(side ? 12 : 10, y(18), side ? 8 : 12, 2, look.accent, false);

  // 頭
  const long = look.hairStyle === 'long';
  if (dir === 'up') {
    if (long) P(8, y(8), 16, 13, look.hair, true, true);
    P(8, y(3), 16, 15, look.hair, true, true);
    P(10, y(4), 5, 2, hairL, false);
    P(9, y(14), 14, 2, hairD, false);
    if (look.hairStyle === 'bun') P(13, y(0), 6, 4, look.hair, true, true);
  } else if (side) {
    if (long) P(15, y(8), 9, 13, look.hair, true, true);
    P(9, y(5), 14, 13, look.skin, true, true);
    P(9, y(3), 15, 6, look.hair, true, true);
    P(15, y(4), 9, 12, look.hair, true, true);
    P(9, y(8), 3, 2, look.hair, false);
    P(11, y(4), 6, 1, hairL, false);
    P(16, y(14), 7, 2, hairD, false);
    if (look.hairStyle === 'bun') P(19, y(0), 5, 4, look.hair, true, true);
    P(10, y(11), 2, 4, '#2A2333', false);
    P(10, y(13), 2, 2, eye, false);
    P(10, y(11), 1, 1, '#FFFFFF', false);
    P(11, y(16), 2, 1, '#F7A1B5', false);
  } else {
    if (long) { P(6, y(8), 4, 14, look.hair, true, true); P(22, y(8), 4, 14, look.hair, true, true); P(6, y(18), 4, 3, hairD, false); P(22, y(18), 4, 3, hairD, false); }
    P(8, y(5), 16, 13, look.skin, true, true);
    P(8, y(16), 16, 1, skinD, false);
    P(8, y(3), 16, 6, look.hair, true, true);
    P(7, y(6), 3, 8, look.hair, false);
    P(22, y(6), 3, 8, look.hair, false);
    P(10, y(9), 3, 2, look.hair, false);
    P(14, y(9), 4, 1, look.hair, false);
    P(19, y(9), 3, 2, look.hair, false);
    P(11, y(4), 6, 1, hairL, false);
    P(19, y(5), 2, 1, hairL, false);
    if (look.hairStyle === 'bun') P(13, y(0), 6, 4, look.hair, true, true);
    // 眼睛：上面深色、下面有顏色、左上角有亮點
    for (const ex of [11, 18]) {
      P(ex, y(11), 3, 4, '#2A2333', false);
      P(ex, y(13), 3, 2, eye, false);
      P(ex, y(11), 1, 1, '#FFFFFF', false);
      P(ex + 2, y(14), 1, 1, shade(eye, 0.45), false);
    }
    P(9, y(15), 2, 1, '#F7A1B5', false);
    P(21, y(15), 2, 1, '#F7A1B5', false);
    P(15, y(15), 2, 1, '#C8555A', false);
    if (look.beard) P(12, y(15), 8, 3, look.hair, true, true);
    if (look.ribbon && long) { P(21, y(3), 4, 3, look.ribbon); P(22, y(4), 2, 1, shade(look.ribbon, 0.4), false); }
  }
  // 帽子
  if (look.hat === 'crown') {
    P(10, y(1), 12, 3, '#F2C94C');
    P(10, y(-1), 2, 2, '#F2C94C', false); P(15, y(-1), 2, 2, '#F2C94C', false); P(20, y(-1), 2, 2, '#F2C94C', false);
    P(15, y(2), 2, 1, '#C8333F', false);
  } else if (look.hat === 'horns') {
    P(7, y(0), 3, 5, '#3A3040'); P(22, y(0), 3, 5, '#3A3040');
  } else if (look.hat === 'witch') {
    P(6, y(4), 20, 2, '#3B2E6E', true, true);
    P(10, y(0), 12, 4, '#3B2E6E');
    P(14, y(-3), 5, 3, '#3B2E6E');
    P(10, y(3), 12, 1, '#F2C94C', false);
  }
  P.draw();
}

export const CATS = {
  guide: { body: '#F4A64A', stripe: '#D97B26', belly: '#FFFFFF', eye: '#2A2333', chubby: true, cap: true },
  black: { body: '#2E2A3A', stripe: '#2E2A3A', belly: '#2E2A3A', eye: '#F2E05A', chubby: false },
  calico: { body: '#FFFFFF', stripe: '#F4A64A', belly: '#FFFFFF', eye: '#2A2333', chubby: false, patch: '#3A3040' },
  orange: { body: '#F7B867', stripe: '#E08A3A', belly: '#FFFFFF', eye: '#2A2333', chubby: false },
};

export function drawCat(ctx, ox, oy, look, dir = 'down', frame = 0, moving = false) {
  const flip = dir === 'right';
  const P = painter(ctx, ox, oy, flip);
  const bob = moving && frame % 2 ? 1 : 0;
  const y = v => v + bob;
  const w = look.chubby ? 2 : 0;
  shadow(ctx, ox, oy, look.chubby ? 16 : 12);
  P(22 + w, y(18), 2, 7, look.body);
  P(23 + w, y(16), 2, 3, look.stripe);
  P(10 - w, y(19), 13 + 2 * w, 9, look.body, true, true);
  P(13, y(21), 6, 6, look.belly, false);
  if (look.patch) { P(10, y(20), 4, 3, look.patch, false); P(18, y(23), 4, 3, look.stripe, false); }
  P(11 - w, y(27), 3, 1, look.belly, false);
  P(18 + w, y(27), 3, 1, look.belly, false);
  // 頭
  P(9, y(9), 14, 11, look.body, true, true);
  P(9, y(7), 4, 3, look.body);
  P(19, y(7), 4, 3, look.body);
  P(10, y(8), 2, 1, '#F7A1B5', false);
  P(20, y(8), 2, 1, '#F7A1B5', false);
  if (dir !== 'up') {
    P(13, y(10), 1, 2, look.stripe, false); P(16, y(10), 1, 3, look.stripe, false); P(19, y(10), 1, 2, look.stripe, false);
    if (look.patch) P(9, y(9), 5, 4, look.patch, false);
    const side = dir === 'left' || dir === 'right';
    if (side) {
      P(11, y(13), 2, 2, look.eye, false);
    } else {
      P(12, y(13), 2, 2, look.eye, false);
      P(18, y(13), 2, 2, look.eye, false);
    }
    P(15, y(15), 2, 1, '#F07A8A', false);
    P(13, y(16), 6, 2, look.belly, false);
  }
  if (look.cap) {
    P(9, y(6), 14, 2, '#3A6EA5');
    P(12, y(4), 8, 2, '#3A6EA5');
    P(15, y(5), 2, 1, '#F2C94C', false);
  }
  P.draw();
}

export function drawSlime(ctx, ox, oy, frame = 0) {
  const sq = frame % 2;
  const P = painter(ctx, ox, oy, false);
  shadow(ctx, ox, oy, 18);
  const top = 13 + sq;
  P(8, top + 4, 16, 13 - sq, '#7FD3F7', true, true);
  P(10, top + 1, 12, 4, '#7FD3F7', true, true);
  P(13, top - 1, 6, 2, '#7FD3F7', true, true);
  P(8, top + 13 - sq, 16, 3, '#4FAFE0', false);
  P(10, top + 3, 3, 3, '#FFFFFF', false);
  P(14, top + 1, 2, 1, '#FFFFFF', false);
  P(12, top + 7, 2, 3, '#1F4A6A', false);
  P(18, top + 7, 2, 3, '#1F4A6A', false);
  P(12, top + 7, 1, 1, '#FFFFFF', false);
  P(18, top + 7, 1, 1, '#FFFFFF', false);
  P(10, top + 10, 2, 1, '#FFA8C0', false);
  P(20, top + 10, 2, 1, '#FFA8C0', false);
  P(15, top + 10, 2, 1, '#1F4A6A', false);
  P.draw();
}

// 地圖上可以走過去選的小物件
export function drawItem(ctx, ox, oy, kind, t = 0) {
  const P = painter(ctx, ox, oy, false);
  const glow = 0.5 + 0.5 * Math.sin(t / 300);
  switch (kind) {
    case 'gloves':
      P(9, 18, 6, 6, '#C8402A'); P(17, 18, 6, 6, '#C8402A');
      P(9, 23, 6, 3, '#F2E8D8', false); P(17, 23, 6, 3, '#F2E8D8', false);
      break;
    case 'stick':
      P(8, 22, 16, 2, '#8A5A3A'); P(19, 19, 2, 3, '#8A5A3A'); P(20, 18, 3, 2, '#7FB069', false);
      break;
    case 'bottle':
      P(13, 14, 6, 3, '#C8E8F0'); P(11, 17, 10, 10, '#C8E8F0'); P(12, 12, 8, 2, '#8A5A3A');
      P(13, 20, 3, 5, '#FFFFFF', false);
      break;
    case 'sparkle':
      ctx.fillStyle = `rgba(255,240,150,${0.5 + glow * 0.5})`;
      ctx.fillRect(ox + 15, oy + 8, 2, 12); ctx.fillRect(ox + 10, oy + 13, 12, 2);
      ctx.fillRect(ox + 14, oy + 12, 4, 4);
      return;
    case 'eyes':
      ctx.fillStyle = `rgba(242,224,90,${0.6 + glow * 0.4})`;
      ctx.fillRect(ox + 11, oy + 16, 3, 2); ctx.fillRect(ox + 18, oy + 16, 3, 2);
      return;
    case 'clearing':
      P(6, 24, 20, 4, '#B8D89A'); P(12, 16, 8, 8, '#E8D8B0'); P(14, 14, 4, 2, '#E8D8B0');
      P(15, 18, 2, 6, '#8A5A3A', false);
      break;
    case 'tallTree':
      P(13, 20, 6, 10, '#7A4E2E');
      P(7, 2, 18, 20, '#2F6B3A');
      P(10, 0, 12, 4, '#3F8A4A');
      P(11, 6, 3, 3, '#4FA05A', false);
      break;
    case 'box':
      P(8, 18, 16, 10, '#C89A5A'); P(8, 18, 16, 2, '#A87A3A', false);
      break;
  }
  P.draw();
}

// 把一個角色畫成一張小圖（對話框頭像、選外觀用）
export function spriteCanvas(drawFn, scale = 4) {
  const c = document.createElement('canvas');
  c.width = 32 * scale; c.height = 32 * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  drawFn(ctx);
  return c;
}

export function faceCanvas(face, scale = 3) {
  const fn = {
    guide: c => drawCat(c, 0, 0, CATS.guide),
    king: c => drawPerson(c, 0, 2, LOOKS.king),
    clerk: c => drawPerson(c, 0, 0, LOOKS.clerk),
    xing: c => drawPerson(c, 0, 3, LOOKS.xing),
    mai: c => drawPerson(c, 0, 0, LOOKS.mai),
    demon: c => drawPerson(c, 0, 1, LOOKS.demon),
    granny: c => drawPerson(c, 0, 1, LOOKS.granny),
    villager: c => drawPerson(c, 0, 0, LOOKS.villager),
    cat: c => drawCat(c, 0, 0, CATS.calico),
    goddess: c => drawPerson(c, 0, 0, { ...LOOKS.clerk, hair: '#F2E8C8', top: '#FFFFFF', top2: '#F2C94C', accent: '#F2C94C', legs: '#FFFFFF' }),
  }[face];
  return fn ? spriteCanvas(fn, scale) : null;
}
