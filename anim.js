
const W = 128, H = 80;
const C = { W:'#FFFFFF', w:'#DFE1E6', S:'#E9B48A', K:'#050D23', B:'#7A3A0E', G:'#E8A83A', g:'#D98F2B', c:'#FFF1C9', P:'#4F5663',
  R:'#FF5630', Y:'#90E0EF', M:'#3D59F7', L:'#7A71FF', l:'#DBD9FF', O:'#8B909C', N:'#1C2B60', bg:'#22336B', fl:'#16224D', wd:'#A8581A' };
let X;
const r = (x, y, w, h, c) => { X.fillStyle = c; X.fillRect(Math.round(x), Math.round(y), w, h); };
const px = (x, y, c) => r(x, y, 1, 1, c);
function mirror(cx, fn) { X.save(); X.translate(cx * 2, 0); X.scale(-1, 1); fn(); X.restore(); }

const F = { A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110', E:'111100110100111', G:'011100101101011',
  H:'101101111101101', I:'111010010010111', L:'100100100100111', M:'101111111101101', N:'110101101101101', O:'010101101101010',
  P:'110101110100100', Q:'010101101110011', R:'110101110101101', S:'011100010001110', T:'111010010010010', U:'101101101101111',
  V:'101101101101010', X:'101101010101101', '!':'010010010000010', '?':'110001010000010', '0':'111101101101111', '1':'010110010010111',
  '2':'110001010100111', '3':'110001010001110', ' ':'000000000000000' };
function text(s, x, y, c, k = 1) {
  [...s].forEach((ch, i) => { const g = F[ch] || F[' '];
    for (let j = 0; j < 15; j++) if (g[j] === '1') r(x + (i * 4 + j % 3) * k, y + ((j / 3) | 0) * k, k, k, c); });
}
const textW = (s, k = 1) => (s.length * 4 - 1) * k;
function bubble(x, y, s, col) {
  const w = textW(s) + 6;
  r(x + 1, y, w - 2, 9, C.W); r(x, y + 1, w, 7, C.W); r(x + w - 6, y + 9, 3, 1, C.W); r(x + w - 5, y + 10, 2, 1, C.W);
  text(s, x + 3, y + 2, col);
}
function chev(x, y, c) { px(x + 2, y, c); px(x + 1, y + 1, c); px(x, y + 2, c); px(x + 1, y + 3, c); px(x + 2, y + 4, c); }

function room() {
  r(0, 0, W, H, C.bg);
  for (let i = 0; i < 6; i++) px(10 + i * 22, 10 + (i % 2) * 6, '#2E4290');
  r(0, 66, W, 14, C.fl); r(0, 66, W, 1, '#33478F');
}

/* Pessoa virada para a direita. x = canto esquerdo do corpo, y = topo da cabeça. Pés em y+16. */
function person(x, y, o = {}) {
  const sk = o.skin || C.S, sh = o.shirt || C.M, pa = o.pants || C.P, ha = o.hair || C.K, ar = o.arms || 'down';
  const legs = [[1, 5], [0, 6], [2, 4]][o.leg || 0];
  for (const lx of legs) { r(x + lx, y + 13, 2, 3, pa); r(x + lx, y + 16, 2, 1, C.K); }
  r(x, y + 6, 8, 7, sh);
  r(x + 1, y, 6, 6, sk);
  if (!o.hat) { r(x + 1, y, 6, 2, ha); r(x + 1, y + 2, 1, 2, ha); }
  px(x + 5, y + 3, C.K);
  if (o.smile) r(x + 4, y + 5, 2, 1, '#B0563A');
  const down = (ax) => { r(ax, y + 7, 1, 5, sh); px(ax, y + 12, sk); };
  const b = o.bob || 0;
  if (ar === 'down') { down(x - 1); down(x + 8); }
  if (ar === 'hold') { r(x + 8, y + 8, 3, 1, sh); px(x + 11, y + 8, sk); r(x + 8, y + 10, 3, 1, sh); px(x + 11, y + 10, sk); }
  if (ar === 'waiter') { r(x - 1, y - 6, 1, 13, sh); r(x + 8, y + 7 - b, 4, 1, sh); r(x + 12, y + 7 - b, 2, 1, sk); }
  if (ar === 'cheer') { r(x - 1, y + 1, 1, 6, sh); px(x - 1, y, sk); r(x + 8, y + 1, 1, 6, sh); px(x + 8, y, sk); }
  if (ar === 'eat') { down(x - 1); r(x + 8, y + 7, 1, 2, sh); r(x + 7, y + 5, 1, 2, sk); px(x + 7, y + 3, '#C2C5CB'); }
}
function chef(x, y, o = {}) {
  person(x, y, { ...o, shirt: C.W, hat: true });
  r(x + 1, y - 2, 6, 2, C.W); r(x, y - 5, 8, 3, C.W); px(x + 2, y - 4, C.w); px(x + 5, y - 4, C.w);
  r(x + 4, y + 4, 3, 1, '#5A3A22');
  px(x + 3, y + 8, C.w); px(x + 3, y + 10, C.w);
}
/* Bolo de anel: 12 x 7, prato embaixo. */
function cake(x, y, o = {}) {
  const k = o.k || 1, q = (dx, dy, w, h, c) => r(x + dx * k, y + dy * k, w * k, h * k, c);
  const top = o.gold ? C.G : C.B, side = C.g, hole = o.gold ? '#A8650F' : C.G;
  if (o.plate !== false) q(-2, 7, 16, 1, C.W);
  q(2, 0, 8, 1, top); q(0, 1, 12, 2, top); q(5, 1, 2, 1, hole);
  q(0, 3, 12, 3, side); q(1, 6, 10, 1, side);
  if (o.gold) q(1, 2, 10, 1, '#F2C76B');
}
function wheel(x, y, s) { r(x + 1, y, 4, 6, C.K); r(x, y + 1, 6, 4, C.K); r(x + 2, y + 2, 2, 2, C.O); px(s ? x + 1 : x + 4, y + 1, C.O); px(s ? x + 4 : x + 1, y + 4, C.O); }
/* Moto virada para a direita, com piloto e dois bolos na garupa. Ocupa de x-2 a x+31. */
function moto(x, b = 0, s = 0) {
  const g = 66;
  wheel(x + 2, g - 6, s); wheel(x + 25, g - 6, s);
  r(x + 5, g - 10 + b, 21, 4, C.M); r(x + 3, g - 9 + b, 3, 2, C.L); r(x + 3, g - 7 + b, 6, 1, C.O);
  r(x + 10, g - 13 + b, 10, 3, C.K);
  r(x + 26, g - 17 + b, 2, 10, C.O); r(x + 24, g - 18 + b, 5, 1, C.K); r(x + 28, g - 15 + b, 2, 2, '#FFE89A');
  r(x - 1, g - 12 + b, 10, 1, C.O);
  cake(x - 2, g - 20 + b, { plate: false }); cake(x - 1, g - 27 + b, { gold: true, plate: false });
  r(x + 15, g - 15 + b, 8, 3, C.P); r(x + 21, g - 15 + b, 2, 6, C.P); r(x + 21, g - 9 + b, 3, 1, C.K);
  r(x + 13, g - 23 + b, 7, 8, C.L);
  r(x + 14, g - 29 + b, 6, 6, C.S);
  r(x + 13, g - 31 + b, 8, 4, C.R); r(x + 13, g - 27 + b, 2, 3, C.R); r(x + 18, g - 28 + b, 3, 2, C.Y);
  r(x + 19, g - 21 + b, 4, 1, C.L); r(x + 23, g - 20 + b, 2, 1, C.L); px(x + 25, g - 19 + b, C.S);
}

const S = {
  vote(t) {
    const tt = t % 5.5, y = 49; room();
    if (tt < 2) {
      const x = Math.round(130 - 56 * (tt / 2)), lg = 1 + ((tt * 7 | 0) % 2);
      mirror(x + 4, () => { chef(x, y, { leg: lg, arms: 'hold' }); cake(x + 10, y + 1); });
    } else {
      const x = 74, bob = (tt * 4 | 0) % 2;
      mirror(x + 4, () => { chef(x, y, { arms: 'waiter', bob, smile: true }); cake(x - 9, y - 14); });
      if (tt < 2.5 || ((tt * 3) | 0) % 2 === 0) bubble(14, 26, 'VOTE!', C.R);
      for (let i = 0; i < 3; i++) chev(58 - i * 8 - ((tt * 8 | 0) % 4), 54, C.Y);
    }
  },

  urgent(t) {
    const tt = t % 5.5; room();
    const sh = (tt * 12 | 0) % 2, cx = 14 + sh, cy = 14;
    r(cx - 5, cy - 6, 10, 12, C.R); r(cx - 6, cy - 5, 12, 10, C.R); r(cx - 4, cy - 5, 8, 10, C.W); r(cx - 5, cy - 4, 10, 8, C.W);
    r(cx - 6, cy - 8, 3, 2, C.R); r(cx + 3, cy - 8, 3, 2, C.R);
    const d = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][(tt * 10 | 0) % 8];
    for (let k = 1; k <= 3; k++) px(cx + d[0] * k, cy + d[1] * k, C.K);
    px(cx, cy - 1, C.K); px(cx, cy - 2, C.K); px(cx, cy, C.K);
    if (((tt * 3) | 0) % 2 === 0) text('12H!', 26, 11, C.R);
    r(64, 64, 3, 2, C.O); px(65, 63, C.O);
    if (tt < 1.6) {
      const x = Math.round(-12 + 70 * (tt / 1.6)), lg = 1 + ((tt * 10 | 0) % 2), b = (tt * 10 | 0) % 2;
      chef(x, 49 - b, { leg: lg, arms: 'hold' }); cake(x + 10, 50 - b);
      for (let i = 0; i < 3; i++) r(x - 6 - i * 4, 54 + i * 3, 3, 1, '#33478F');
      return;
    }
    const dy = tt < 1.72 ? -7 : tt < 1.84 ? -3 : 0, lx = 62, g = 66 + dy, f = ((tt * 6) | 0) % 2;
    r(lx, g - 6, 5, 2, C.P); r(lx, g - 3, 5, 2, C.P); r(lx - 1, g - 6, 1, 2, C.K); r(lx - 1, g - 3, 1, 2, C.K);
    if (tt > 1.9 && f) { r(lx, g - 8, 5, 2, C.P); }
    r(lx + 5, g - 7, 7, 7, C.W);
    r(lx + 12, g - 6, 6, 6, C.S);
    r(lx + 7, f && tt > 1.9 ? g - 10 : g - 8, 1, 3, C.W);
    if (tt < 1.9) {
      r(lx + 18, g - 6, 2, 6, C.W); r(lx + 20, g - 7, 3, 8, C.W);
      const k = (tt - 1.6) / 0.3;
      cake(Math.round(70 + 4 * k), Math.round(42 + 14 * k - 10 * Math.sin(k * Math.PI)), { plate: false });
    } else {
      r(lx + 24, g - 5, 5, 3, C.W); r(lx + 23, g - 2, 7, 2, C.W);
      r(lx + 10, g - 9, 11, 1, C.W);
      r(lx + 11, g - 8, 9, 6, C.g); r(lx + 11, g - 2, 9, 2, C.B);
      const grow = Math.min(1, (tt - 1.9) / 0.25);
      [[-3, -13], [9, -12], [14, -5], [-5, -3], [4, -15], [17, -10], [-1, -9]].forEach(([ox, oy], i) => {
        r(lx + 15 + ox * grow, g - 4 + oy * grow, 2, 2, i % 2 ? C.c : C.G); });
      if (tt < 3) text('SPLAT!', 80, 38, C.G);
    }
  },

  moto(t, o = {}) {
    r(0, 0, W, H, C.bg);
    const hs = [20, 30, 16, 26, 34, 18, 28, 22, 30, 14];
    for (let i = 0; i < 10; i++) {
      const bx = ((i * 22 - t * 8) % 220 + 220) % 220 - 30, h = hs[i];
      r(bx, 66 - h, 18, h, '#1B2A5E');
      for (let wy = 66 - h + 4; wy < 62; wy += 6) { px(bx + 4, wy, '#3E54A8'); px(bx + 12, wy, (i + wy) % 3 ? '#3E54A8' : C.G); }
    }
    [[10, 0], [26, 70]].forEach(([cy, c0]) => {
      const cx = ((c0 - t * 12) % 170 + 170) % 170 - 24;
      r(cx, cy, 16, 3, C.l); r(cx + 4, cy - 2, 7, 2, C.l);
    });
    r(0, 66, W, 14, C.fl); r(0, 66, W, 1, '#33478F');
    for (let i = 0; i < 10; i++) r(((i * 16 - t * 70) % 160 + 160) % 160 - 16, 73, 8, 1, '#3E54A8');
    const sx = Math.round(150 - ((t % 7) / 7) * 220);
    const day = o.day || 'SEXTA', bw = textW(day) + 6;
    if (sx > -30 && sx < 150) { r(sx, 44, 1, 22, C.O); r(sx - (bw >> 1), 36, bw, 9, C.G); text(day, sx - (bw >> 1) + 3, 38, C.K); }
    for (let k = 0; k < 3; k++) {
      const a = (t * 1.5 + k / 3) % 1;
      if (a < 0.8) r(Math.round(40 - a * 22), Math.round(58 - a * 6), 2, 2, a < 0.4 ? C.O : '#4F5663');
    }
    moto(46, (t * 6 | 0) % 2, (t * 12 | 0) % 2);
  },

  wait(t) {
    const tt = t % 6; room();
    r(6, 28, 18, 38, '#5A3A22'); r(8, 30, 14, 36, '#7A4E2E'); px(19, 48, C.G); r(10, 33, 10, 6, '#5A3A22');
    const arrived = tt > 2.2;
    const ppl = [{ x: 28, skin: '#E9B48A', shirt: C.L }, { x: 40, skin: '#B9784A', shirt: C.R, hair: '#3A2A1A' }, { x: 52, skin: '#7A4A2A', shirt: C.Y }];
    ppl.forEach((p, i) => {
      const b = arrived ? (((tt * 6 + i) | 0) % 2) * 3 : (((tt * 3 + i) | 0) % 2);
      person(p.x, 49 - b, { ...p, arms: arrived ? 'cheer' : 'down', smile: arrived });
    });
    const mx = tt < 2.2 ? Math.round(140 - 56 * (tt / 2.2)) : 84;
    mirror(mx + 15, () => moto(mx, (tt * 6 | 0) % 2 * (arrived ? 0 : 1), arrived ? 0 : (tt * 12 | 0) % 2));
    if (!arrived || ((tt * 3) | 0) % 2 === 0) bubble(24, 20, 'CHEGOU?', C.N);
    if (arrived) for (let i = 0; i < 3; i++) chev(16 - i * 6 - ((tt * 8 | 0) % 3), 8, C.Y);
  },

  party(t) {
    room();
    const eat = (i) => ((((t * 2.5) + i * 0.6) | 0) % 2) ? 'eat' : 'down';
    person(44, 39, { shirt: C.R, arms: eat(1), smile: true });
    mirror(80, () => person(76, 39, { shirt: C.Y, skin: '#7A4A2A', arms: eat(2), smile: true }));
    cake(44, 46);
    const n = Math.min(3, Math.floor((t % 8) / 2)) * 2;
    if (n) { r(56 - n, 47, n, 5, C.bg); r(56 - n, 47, 1, 5, C.c); px(58, 52, C.g); }
    cake(70, 46, { gold: true });
    r(30, 54, 68, 3, C.wd); r(30, 57, 68, 1, C.B); r(34, 58, 2, 8, C.wd); r(92, 58, 2, 8, C.wd);
    person(14, 49, { shirt: C.L, arms: eat(0), smile: true });
    mirror(110, () => chef(106, 49, { arms: eat(3), smile: true }));
    const cols = [C.R, C.Y, C.G, C.L, C.W, C.c];
    for (let i = 0; i < 36; i++) {
      const sp = 10 + (i * 7) % 14, x0 = (i * 37) % 128, y = ((i * 23) % 80 + t * sp) % 84 - 4;
      r(Math.round(x0 + Math.sin(t * 2 + i) * 2), Math.round(y), (i % 3) ? 1 : 2, 1, cols[i % cols.length]);
    }
    text('OBA!', 49, 4 + ((t * 4 | 0) % 2), C.G, 2);
  },

  round(t, o = {}) {
    room();
    const s = (t * 4 | 0) % 2;
    [[20, 28], [104, 22], [28, 50], [98, 46], [44, 26], [86, 30]].forEach(([x, y], i) => {
      if ((s + i) % 2) { px(x, y, C.Y); px(x - 1, y, C.Y); px(x + 1, y, C.Y); px(x, y - 1, C.Y); px(x, y + 1, C.Y); } else px(x, y, C.W);
    });
    r(40, 61, 48, 2, C.wd); r(40, 63, 48, 1, C.B); r(44, 64, 2, 2, C.wd); r(82, 64, 2, 2, C.wd);
    cake(52, 45, { k: 2 });
    r(63, 37, 2, 10, C.l); px(63, 39, C.R); px(64, 41, C.R); px(63, 43, C.R); px(64, 45, C.R);
    const f = (t * 8 | 0) % 3;
    r(63, 33, 2, 4, C.G); px(f === 1 ? 64 : 63, 31 + (f === 2 ? 1 : 0), C.R); px(63 + (f % 2), 32, C.G); px(63, 35, C.W);
    const lbl = 'RODADA ' + (o.round || 3); text(lbl, Math.round((W - textW(lbl, 2)) / 2), 6, C.G, 2);
    const j = (i) => ((((t * 4) + i) | 0) % 2) * 3;
    person(14, 49 - j(0), { shirt: C.L, arms: 'cheer', smile: true });
    mirror(110, () => chef(106, 49 - j(1), { arms: 'cheer', smile: true }));
  }
};


const live = new Set();
let running = false;
const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function paint(it, t) { X = it.ctx; X.clearRect(0, 0, W, H); S[it.name](t, it.opts); }
function loop(now) {
  const t = Math.floor(now / 83) * 0.083;
  for (const it of live) { if (!it.canvas.isConnected) { live.delete(it); continue; } paint(it, t); }
  if (live.size) requestAnimationFrame(loop); else running = false;
}
export function mountScene(canvas, name, opts = {}) {
  if (!canvas || !S[name]) return;
  canvas.width = W; canvas.height = H;
  const it = { canvas, ctx: canvas.getContext('2d'), name, opts };
  if (reduce) { paint(it, 3); return; }
  live.add(it);
  if (!running) { running = true; requestAnimationFrame(loop); }
}
