// La page statique : un hall de salon dessiné sur le vif (5120×2880 = la page entière au recul final)
// Quatre calques comme le moteur le prévoit : color (lavis), inkA/timeA (croquis d'ouverture, dans l'ordre des traits), inkB/timeB (vide)
import { rng, fbm, n2, hex, mix3, lerp, clamp, ellipse, spline, penStroke, rasterPen, wash, reserve, dab, TAU } from './engine.js';

export const W = 5120, H = 2880;
export const WIN_A = [0.3, 4.6], WIN_B = [0, 1];
export const HORIZ = 1580;                                        // pied du mur du fond
export const depthS = Y => clamp(.32 + (Y - HORIZ) / 760 * .62, .25, 1.2);
export const FIG_H = 600;                                          // hauteur d'une personne à depthS = 1
export const ORIGIN = [1300, 2150];                                // le croquis pousse depuis Léa
export const LEA0 = [1300, 2300];
export const DOOR = { x0: 3430, x1: 3960, base: 2240, top: 1640, dx0: 3560, dx1: 3740, dtop: 1830 };
export const CAFE = { x0: 4120, x1: 4760, base: 2080, top: 1740 };
export const P2 = [4800, 2190], P3 = [4020, 2140];                 // les deux autres rencontres proposées
export const TEAL = hex('#4fa3a5'), TEAL_D = hex('#2f7f86');

const C = {
  glass: hex('#bcd0dc'), dusk: hex('#e9b98a'), duskR: hex('#d99a8a'), duskV: hex('#a9a3c4'), steel: hex('#8b93a6'),
  wall: hex('#d8c6a0'), wallD: hex('#c7b396'), wood: hex('#c8a86b'), panel: hex('#e2d6bf'), carpet: hex('#c98f7a'),
  floor: hex('#d8ccb1'), floorD: hex('#b8a98c'), shadow: hex('#5a5f82'),
  fab: [hex('#b8483e'), hex('#7fa6b8'), hex('#cfaa72'), hex('#8fb3a0'), hex('#b58fb0'), hex('#e2b04a'), hex('#7187a6'), hex('#c9796a')],
  skin: [hex('#eec3a4'), hex('#d9a383'), hex('#b07a5c'), hex('#9c6a50'), hex('#f0cdb0'), hex('#c48a6a')],
  hair: [hex('#2f2622'), hex('#4a3a30'), hex('#8a5a3c'), hex('#c49a5c'), hex('#231c1a'), hex('#9a9086')],
};
const shade = c => mix3(c, C.shadow, .45);

function cv(w, h, fill) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, w, h); } return [c, x]; }
function pathPoly(ctx, poly) { ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]); ctx.closePath(); }
export function inPoly(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }

// Bord de page : le haut garde une marge pour les notes, le coin bas-gauche reste blanc pour la conclusion
export function pageMask(x, y) {
  const n = (fbm(x * .004, y * .004, 5, 3) - .5) * 160 + (n2(x * .03, y * .03, 8) - .5) * 40;
  const dl = x - 90 + n, db = H - 80 - y + n, dr = W - 70 - x + n, dt = y - 470 + n * .6;
  const cx = (x - 700) / 1600, cy = (y - 2900) / 500, corner = (Math.sqrt(cx * cx + cy * cy) - 1) * 320 + n;
  return Math.min(dl, db, dr, dt, corner);
}
export const inPage = (x, y, m = 0) => pageMask(x, y) > m;

export function buildWorld() {
  const [colorC, cx] = cv(W, H, '#fff');
  const [inkAC, ia] = cv(W, H), [timeAC, ta] = cv(W, H, '#fff'), [inkBC, ib] = cv(W, H), [timeBC, tb] = cv(W, H, '#fff');
  ta.globalCompositeOperation = 'darken'; tb.globalCompositeOperation = 'darken';
  const R = rng(9090);
  const strokes = [];
  const lw = Y => 1.3 + 2.0 * clamp(depthS(Y), 0, 1.1);
  // un trait du croquis d'ouverture : plus il est loin de Léa, plus il arrive tard
  const pen = (pts, o = {}, t0) => {
    const st = penStroke(pts, o); if (st.P.length < 2) return st;
    const m = st.P[st.P.length >> 1], d = Math.hypot(m[0] - ORIGIN[0], (m[1] - ORIGIN[1]) * 1.25);
    const t = t0 ?? clamp(.95 + d / 1350 + R() * .12, .9, 4.35), du = clamp(st.L / 2600, .04, .3);
    rasterPen(ia, ta, st, t, du, WIN_A); strokes.push([+t.toFixed(3), +du.toFixed(3), Math.round(st.L), 0]); return st;
  };
  // efface l'encre déjà posée sous une forme plus proche (l'encre statique ne peut pas être masquée après coup)
  const occlude = poly => { ia.save(); ia.globalCompositeOperation = 'destination-out'; ia.fillStyle = '#000'; pathPoly(ia, poly); ia.fill(); ia.restore(); };
  const W_ = (poly, col, o = {}) => wash(cx, poly, col, { a: .5, j: 7, layers: 3, edge: .32, seed: (R() * 1e5) | 0, ...o });
  const box = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

  // ============ Verrière : grandes fermes en arc, vitrages ============
  const VP = [2560, 1180];
  const archPts = (k, n = 26) => {          // ferme k (0 = la plus proche), points de la naissance gauche à droite
    const f = k * .16, L = [lerp(140, VP[0], f), lerp(1560, VP[1], f)], Rr = [lerp(4980, VP[0], f), lerp(1560, VP[1], f)], top = lerp(560, VP[1] - 260, f);
    return [...Array(n + 1)].map((_, i) => { const u = i / n, a = Math.PI * u; return [lerp(L[0], Rr[0], u), lerp(L[1], top, Math.sin(a)) + (L[1] - top) * 0 ]; }).map(([x, y], i) => [x, y - (i === 0 || i === n ? 0 : 0)]);
  };
  const arches = [0, 1, 2, 3, 4].map(k => archPts(k));
  // ciel derrière les vitres : crépuscule (il n'arrivera qu'au soir)
  for (let i = 0; i < 46; i++) {
    const x = 500 + R() * 4100, y = 560 + R() * 700; if (!inPage(x, y, 120)) continue;
    const k = y < 800 ? C.duskV : y < 1000 ? C.duskR : C.dusk;
    W_(ellipse(x, y, 260 + R() * 360, 90 + R() * 120, 22), k, { a: .1 + R() * .1, j: 40, layers: 2, edge: .04, freq: .006 });
  }
  // vitrages entre la première et la dernière ferme
  for (let k = 0; k < 4; k++) for (let i = 2; i < 25; i += 2) {
    const a = arches[k], b = arches[k + 1]; const q = [a[i], a[i + 2], b[i + 2], b[i]];
    W_(q, C.glass, { a: .16 + R() * .12, j: 5, layers: 2, edge: .1 });
  }
  for (let k = 0; k < 5; k++) {
    const a = arches[k], w = lw(1580 + (4 - k) * 140) * (k === 0 ? 1.3 : 1);
    pen(a, { w, wob: 1.2, over: 6, seed: 100 + k, gap: .5 });
    if (k < 2) pen(a.map(([x, y]) => [x, y + 26 - k * 8]), { w: w * .6, wob: 1, over: 5, seed: 110 + k, gap: .6 });
    // montants verticaux sous la ferme la plus proche, et croisillons
    for (let i = 3; i < 24; i += 3) if (k < 4) pen([a[i], arches[k + 1][i]], { w: w * .55, wob: .8, over: 3, seed: 130 + k * 30 + i, smooth: false });
  }
  for (let i = 1; i < 26; i += 2) pen([arches[0][i], arches[4][i]], { w: 1.4, wob: .9, over: 4, seed: 300 + i, gap: .5 });
  // ombre bleutée sous la verrière (portée sur le haut du mur)
  W_([[300, 1260], [4820, 1260], [4800, 1360], [320, 1360]], C.steel, { a: .12, j: 30, edge: 0, freq: .006 });

  // ============ Mur du fond ============
  W_([[160, 1330], [4960, 1330], [4960, HORIZ], [160, HORIZ]], C.wall, { a: .28, j: 16, freq: .01 });
  pen([[160, HORIZ], [1400, HORIZ + 4], [2700, HORIZ - 2], [4960, HORIZ + 3]], { w: 1.6, wob: 1.2, over: 6, seed: 401, gap: .7 });
  pen([[160, 1330], [2560, 1326], [4960, 1332]], { w: 1.3, wob: 1, over: 6, seed: 402, gap: .8 });
  // bannières suspendues aux fermes
  for (let i = 0; i < 7; i++) {
    const x = 520 + i * 640 + R() * 80, y0 = 760 + Math.abs(i - 3) * 90, h = 260 + R() * 80, w = 70 + R() * 30;
    const poly = [[x, y0], [x + w, y0], [x + w, y0 + h], [x + w / 2, y0 + h - 30], [x, y0 + h]];
    W_(poly, C.fab[i % C.fab.length], { a: .5, j: 3 });
    pen([...poly, poly[0]], { w: 1.4, wob: .6, over: 3, seed: 420 + i, smooth: false });
    pen([[x + w / 2, y0], [x + w / 2, y0 - 120]], { w: .9, wob: .4, over: 0, seed: 440 + i });
  }

  // ============ Stands du fond ============
  const stand = (x0, w, base, h, col, seed, front = false) => {
    const y0 = base - h, s = depthS(base);
    const back = box(x0, y0, x0 + w, base), head = box(x0 - 6, y0 - 60 * s, x0 + w + 6, y0), counter = box(x0 + w * .15, base - h * .38, x0 + w * .85, base);
    if (front) { occlude(head.concat()); occlude(back); }
    W_(back, C.panel, { a: .35, j: 5 });
    W_(head, col, { a: .62, j: 4 });
    W_(counter, C.wood, { a: .55, j: 4, dx: 3, dy: 2 });
    W_([[x0 + w * .85, base - h * .38], [x0 + w * .9, base - h * .34], [x0 + w * .9, base], [x0 + w * .85, base]], shade(C.wood), { a: .4, j: 2 });
    const L = lw(base);
    pen([[x0, base], [x0, y0], [x0 + w, y0], [x0 + w, base]], { w: L, wob: 1, over: 5, seed, gap: .5, smooth: false });
    pen([[x0 - 6, y0], [x0 - 6, y0 - 60 * s], [x0 + w + 6, y0 - 60 * s], [x0 + w + 6, y0]], { w: L, wob: .8, over: 4, seed: seed + 1, smooth: false });
    pen([[x0 + w * .15, base], [x0 + w * .15, base - h * .38], [x0 + w * .85, base - h * .38], [x0 + w * .85, base]], { w: L * .9, wob: .8, over: 4, seed: seed + 2, smooth: false, gap: .4 });
    // enseigne : quelques gribouillis illisibles, comme dans un vrai croquis
    for (let k = 0; k < 3; k++) { const yy = y0 - 30 * s, xx = x0 + w * (.18 + k * .24); pen([...Array(7)].map((_, i) => [xx + i * w * .025, yy + Math.sin(i * 1.7 + seed) * 7 * s]), { w: L * .55, wob: .6, over: 0, seed: seed + 10 + k }); }
    // écran sur le panneau
    const sc = box(x0 + w * .3, y0 + h * .16, x0 + w * .7, y0 + h * .44);
    W_(sc, hex('#7892ad'), { a: .35, j: 2 });
    pen([...sc, sc[0]], { w: L * .7, wob: .6, over: 2, seed: seed + 20, smooth: false });
  };
  const backCols = [C.fab[1], C.fab[0], C.fab[3], C.fab[5], C.fab[6], C.fab[2], C.fab[4], C.fab[7]];
  for (let i = 0, x = 230; x < 4800; i++) { const w = 380 + R() * 160; stand(x, w, HORIZ, 210 + R() * 60, backCols[i % 8], 500 + i * 31); x += w + 60 + R() * 70; }

  // ============ Sol : allée en moquette, joints en perspective ============
  const carpet = [[1900, HORIZ], [3220, HORIZ], [4300, H], [800, H]];
  W_([[160, HORIZ], [4960, HORIZ], [4960, H - 60], [160, H - 60]], C.floor, { a: .2, j: 20, edge: 0, freq: .008 });
  W_(carpet, C.carpet, { a: .22, j: 12, edge: .15, freq: .01 });
  for (let i = 0; i < 9; i++) { const u = i / 8, x = lerp(160, 4960, u); pen([[lerp(x, 2560, .82), HORIZ + 30], [lerp(x, 2560, -.25), H - 40]], { w: 1.1, wob: .9, over: 2, seed: 700 + i, gap: .9, alpha: .55 }); }
  for (const y of [1700, 1880, 2160, 2560]) pen([[200, y], [4900, y + 6]], { w: .9, wob: 1, over: 2, seed: 760 + y, gap: .95, alpha: .4 });

  // ============ Îlots intermédiaires ============
  stand(380, 520, 1930, 330, C.fab[2], 900, true);
  stand(2330, 470, 1860, 300, C.fab[6], 930, true);

  // ============ Foule : gens « carottes » (une tache de lavis, deux jambes, une tête) ============
  const people = [];
  const person = (x, y, seed, o = {}) => {
    const r = rng(seed), h = FIG_H * depthS(y) * (.88 + r() * .2), w = h * (.2 + r() * .06);
    const col = o.col ?? C.fab[(r() * C.fab.length) | 0], skin = C.skin[(r() * C.skin.length) | 0], hair = C.hair[(r() * C.hair.length) | 0];
    const lean = (r() - .5) * .06 * h, top = y - h * .86;
    const body = spline([[x - w * .45, y - h * .4], [x - w * .55 + lean * .3, y - h * .62], [x - w * .42 + lean, top + h * .03], [x + lean, top - h * .01], [x + w * .42 + lean, top + h * .03], [x + w * .55 + lean * .3, y - h * .62], [x + w * .45, y - h * .4]], 4, true);
    const head = ellipse(x + lean * 1.1, top - h * .07, h * .062, h * .07, 14);
    occlude(body); occlude(head); occlude([[x - w * .3, y - h * .42], [x + w * .3, y - h * .42], [x + w * .3, y + 4], [x - w * .3, y + 4]]);
    reserve(cx, body, .95, 0); reserve(cx, head, .95, 0);
    W_(body, col, { a: .58, j: 2.5, dx: 2, dy: 1 });
    W_(body.filter(([px]) => px > x + lean * .5), shade(col), { a: .25, j: 2 });
    W_(head, skin, { a: .45, j: 1.5 }); W_(head.slice(5, 14).concat([[x + lean, top - h * .05]]), hair, { a: .7, j: 1.5 });
    W_(ellipse(x + h * .06, y + 3, h * .17, h * .025, 14), C.shadow, { a: .16, j: 2, edge: 0 });
    const L = lw(y) * .9;
    pen(body.slice(0, Math.ceil(body.length * .55)), { w: L, wob: .7, over: 3, seed: seed + 1, smooth: false });
    pen(body.slice(Math.floor(body.length * .5)), { w: L, wob: .7, over: 3, seed: seed + 2, smooth: false, gap: .4 });
    pen(head.concat([head[0]]).slice(2), { w: L * .85, wob: .4, over: 2, seed: seed + 3, smooth: false });
    const lg = (r() - .5) * .08 * h;
    pen([[x - w * .18, y - h * .4], [x - w * .2 - lg, y]], { w: L, wob: .5, over: 2, seed: seed + 4, smooth: false });
    pen([[x + w * .16, y - h * .4], [x + w * .2 + lg, y]], { w: L, wob: .5, over: 2, seed: seed + 5, smooth: false });
    people.push({ x, y, h });
  };
  // positions : plusieurs rangs en profondeur, du fond vers l'avant (l'avant recouvre le fond)
  const spots = [];
  const ok = (x, y) => {
    if (!inPage(x, y, 90)) return false;
    if (x > DOOR.x0 - 60 && x < DOOR.x1 + 60 && y > DOOR.top && y < DOOR.base + 20) return false;
    if (x > CAFE.x0 - 40 && x < CAFE.x1 + 40 && y > CAFE.top && y < CAFE.base + 30) return false;
    if (y > 2200 && x > 900 && x < 4700) return false;                       // couloir de Léa : personne devant elle
    if (y > 1940 && x > 950 && x < 1700) return false;                        // un peu d'air autour de Léa au départ
    if (y > 1930 && x > 3960 && x < 4720) return false;                       // l'espace de la rencontre
    if (Math.hypot(x - P2[0], y - P2[1]) < 170 || Math.hypot(x - P3[0], y - P3[1]) < 170) return false;
    for (const s of spots) if (Math.abs(s[0] - x) < 62 * depthS(y) * 1.5 && Math.abs(s[1] - y) < 45) return false;
    return true;
  };
  // des petits groupes plutôt qu'une grille : 1 à 4 personnes autour de chaque point
  for (let g = 0; g < 400 && spots.length < 105; g++) {
    const gy = HORIZ + 40 + Math.pow(R(), 1.3) * 1000, gx = 180 + R() * 4760, n = 1 + ((R() * 4) | 0), s = depthS(gy);
    for (let k = 0; k < n; k++) { const x = gx + (R() - .5) * 260 * s, y = gy + (R() - .5) * 70; if (ok(x, y)) spots.push([x, y]); }
  }
  spots.push(P2, P3);
  // salle de conférence (cloison) et comptoir café : dessinés à leur profondeur, entre les rangs
  const items = spots.map((p, i) => ({ y: p[1], f: () => person(p[0], p[1], 2000 + i * 13, p === P2 ? { col: C.fab[3] } : p === P3 ? { col: C.fab[5] } : {}) }));
  items.push({ y: DOOR.base, f: () => {
    const { x0, x1, base, top, dx0, dx1, dtop } = DOOR;
    const wall = [[x0, top], [x1, top], [x1, base], [x0, base]];
    occlude(wall); reserve(cx, wall, .95, 0);
    W_([[x0, top], [x1, top], [x1, base], [dx1, base], [dx1, dtop], [dx0, dtop], [dx0, base], [x0, base]], C.panel, { a: .5, j: 4 });
    W_([[x1 - 40, top], [x1, top], [x1, base], [x1 - 40, base]], shade(C.panel), { a: .35, j: 2 });
    W_([[dx0, dtop], [dx1, dtop], [dx1, base], [dx0, base]], hex('#6b6f8a'), { a: .5, j: 3 });
    W_([[x0 + 40, top + 30], [x1 - 60, top + 30], [x1 - 60, top + 140], [x0 + 40, top + 140]], C.fab[1], { a: .45, j: 3 });
    const L = lw(base);
    pen([[x0, base], [x0, top], [x1, top], [x1, base]], { w: L, wob: 1, over: 6, seed: 1201, smooth: false, gap: .4 });
    pen([[dx0, base], [dx0, dtop], [dx1, dtop], [dx1, base]], { w: L, wob: 1, over: 5, seed: 1202, smooth: false });
    pen([[x0 + 40, top + 30], [x1 - 60, top + 30], [x1 - 60, top + 140], [x0 + 40, top + 140], [x0 + 40, top + 30]], { w: L * .8, wob: .8, over: 3, seed: 1203, smooth: false });
  } });
  items.push({ y: CAFE.base, f: () => {
    const { x0, x1, base, top } = CAFE;
    const bar = [[x0, base - 220], [x1, base - 220], [x1, base], [x0, base]], sign = [[x0 + 80, top], [x1 - 80, top], [x1 - 80, top + 90], [x0 + 80, top + 90]];
    occlude(bar); occlude(sign); reserve(cx, bar, .95, 0);
    W_(bar, C.wood, { a: .55, j: 4, dx: 3 }); W_(sign, C.fab[0], { a: .5, j: 3 });
    W_([[x0, base - 220], [x1, base - 220], [x1, base - 190], [x0, base - 190]], shade(C.wood), { a: .4, j: 2 });
    const L = lw(base);
    pen([[x0, base], [x0, base - 220], [x1, base - 220], [x1, base]], { w: L, wob: 1, over: 5, seed: 1301, smooth: false });
    pen([...sign, sign[0]], { w: L * .8, wob: .8, over: 3, seed: 1302, smooth: false });
    pen([[(x0 + x1) / 2, top], [(x0 + x1) / 2, top - 160]], { w: .9, wob: .4, over: 0, seed: 1303 });
    for (let k = 0; k < 4; k++) { const cxp = x0 + 120 + k * 140; pen(ellipse(cxp, base - 236, 22, 8, 10).concat([[cxp + 22, base - 236]]), { w: L * .6, wob: .3, over: 0, seed: 1310 + k, smooth: false }); pen([[cxp - 20, base - 236], [cxp - 16, base - 270], [cxp + 16, base - 270], [cxp + 20, base - 236]], { w: L * .6, wob: .3, over: 0, seed: 1320 + k, smooth: false }); }
  } });
  items.sort((a, b) => a.y - b.y).forEach(it => it.f());

  // ============ Bord de page : la peinture s'effiloche en touches ============
  { const [mc, mx] = cv(W, H);
    mx.fillStyle = '#fff';
    for (let y = 0; y < H; y += 4) for (let x = 0; x < W; x += 4) if (pageMask(x, y) < 0) mx.fillRect(x, y, 4, 4);
    const Rm = rng(31);
    for (let i = 0; i < 36000; i++) { const x = Rm() * W, y = Rm() * H, m = pageMask(x, y); if (m > 0 && m < 70 && Rm() < (1 - m / 70) * .45) dab(mx, x, y, 3 + Rm() * 7, Rm() * TAU, [255, 255, 255], .95, i); }
    cx.globalCompositeOperation = 'source-over'; cx.drawImage(mc, 0, 0);
    for (const c of [ia, ib]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.drawImage(mc, 0, 0); c.restore(); }
    cx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 9000; i++) { const x = Rm() * W, y = Rm() * H, m = pageMask(x, y); if (m < 0 && m > -70 && Rm() < (1 + m / 70) * .6) { const k = Rm(); dab(cx, x, y, 5 + Rm() * 11, Rm() * TAU, k < .4 ? C.wall : k < .7 ? C.glass : C.carpet, .25 + Rm() * .3, 40000 + i); } }
    cx.globalCompositeOperation = 'source-over';
  }

  // ============ Empaquetage pour le compositeur GL ============
  const pack = (r, g) => { const out = new Uint8Array(W * H * 4); const A = r.getImageData(0, 0, W, H).data, B = g.getImageData(0, 0, W, H).data; for (let i = 0, n = W * H; i < n; i++) { out[i * 4] = A[i * 4 + 3]; out[i * 4 + 1] = B[i * 4 + 3]; out[i * 4 + 3] = 255; } return out; };
  const packT = (r, g) => { const out = new Uint8Array(W * H * 4); const A = r.getImageData(0, 0, W, H).data, B = g.getImageData(0, 0, W, H).data; for (let i = 0, n = W * H; i < n; i++) { out[i * 4] = A[i * 4]; out[i * 4 + 1] = B[i * 4]; out[i * 4 + 3] = 255; } return out; };
  return { W, H, color: colorC, ink: pack(ia, ib), time: packT(ta, tb), winA: WIN_A, winB: WIN_B, strokes, people };
}
