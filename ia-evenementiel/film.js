// Le fil — ligne de temps principale : caméra, Léa, l'inconnu, le fil de l'IA, l'arrivée de la couleur, textes, événements sonores
import { clamp, lerp, ss, TAU, rng, n2, hex, mix3, INK, PAPER, rgba, rough, ellipse, spline, resample, arrivalField, compositor, figure, drawPrims, penStroke, drawPen, dab, handwrite, wash, R3 } from './engine.js';
import { buildWorld, W, H, depthS, FIG_H, LEA0, DOOR, P2, P3, TEAL, TEAL_D } from './world.js';
import { walk, stand, mixPose } from './poses.js';
const { V } = R3;

export const BPM = 120, BEAT = .5, BAR = 1.5;
const DUR = 46.5;
await Promise.all([document.fonts.load('80px Caveat'), document.fonts.load('600 80px Caveat'), document.fonts.load('80px "Reenie Beanie"')]);

const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eo = t => 1 - Math.pow(1 - clamp(t), 3), ei = t => Math.pow(clamp(t), 3);
const seg = (t, a, b) => clamp((t - a) / (b - a));
const Sof = y => FIG_H * depthS(y);
const boilOf = t => Math.floor(t * 12);

// ---------------- Personnages ----------------
const LOOK = {
  lea: { skin: hex('#e8c0a0'), top: hex('#d9875f'), bottom: hex('#3b3f4a'), hair: hex('#4a3a30'), hairLong: 1, sleeve: 'long', pants: 1, torso: [.08, .07, .095], shoe: hex('#5a4a40') },
  ken: { skin: hex('#e2b394'), top: hex('#4f5d7a'), bottom: hex('#8a8f9a'), hair: hex('#231c1a'), sleeve: 'long', pants: 1, torso: [.08, .086, .108], shoe: hex('#2f2a28') },
};
const MAN = { x: 4420, y: 2310 };
const LEA_Y = LEA0[1], LS = Sof(LEA_Y), MS = Sof(MAN.y);
const YAW_L = Math.PI / 2 + .35, YAW_M = -Math.PI / 2 - .35;
// poignée de main : la main droite de Léa avance, celle de l'inconnu aussi ; on place Léa pour que les deux mains se rejoignent
const shakeHand = (k, osc) => ({ handR: V(.05, lerp(.36, .58, k) + osc, lerp(.06, .33, k)), elbR: V(1, -.4, -.2) });
const handX = (look, pose, S, yaw) => figure(look, pose, { x: 0, y: 0, S, yaw }, { seed: 1 }).hand.R;
const hL = handX(LOOK.lea, { ...stand({}), ...shakeHand(1, 0) }, LS, YAW_L), hM = handX(LOOK.ken, { ...stand({}), ...shakeHand(1, 0) }, MS, YAW_M);
const LEA_HS = MAN.x + hM[0] - hL[0];
const DOOR_X = 3620;

function lea(t) {
  let x = LEA0[0], yaw = Math.PI, pose;
  const look = .55 * Math.sin(t * 1.3) * (1 - ss(seg(t, 8.6, 9.0)));
  pose = stand({ headYaw: t < 9 ? look : 0, nod: 0 });
  if (t >= 8.9 && t < 12.2) {                          // regarde son badge, le touche
    const k = ss(seg(t, 8.9, 9.3)) * (1 - ss(seg(t, 11.0, 11.5)));
    pose.nod = -.42 * k; pose.headYaw = .1 * k;
    const r = ss(seg(t, 9.0, 9.4)) * (1 - ss(seg(t, 10.6, 11.2)));
    if (r > 0) { pose.handR = V(lerp(.12, .02, r), lerp(.36, .66, r), lerp(.02, .14, r)); pose.elbR = V(1, -.6, .2); }
    pose.headYaw += .35 * ss(seg(t, 11.2, 11.8));        // lève les yeux vers la droite : quelque chose l'appelle
  }
  if (t >= 12.0) yaw = lerp(Math.PI, YAW_L, ss(seg(t, 12.0, 12.5)));
  if (t >= 12.5 && t < 18.5) {                         // marche, un pas par temps
    const u = t - 12.5, k = ss(seg(t, 12.5, 12.8)) * (1 - ss(seg(t, 18.2, 18.5)));
    x = LEA0[0] + (DOOR_X - LEA0[0]) * clamp(u / 6);
    pose = mixPose(stand({}), walk(u * TAU, { headYaw: 0 }), k);
  } else if (t >= 18.5) x = DOOR_X;
  if (t >= 18.5 && t < 22.5) {                         // devant la porte ; puis regarde les trois propositions
    pose = stand({ headYaw: -.25 * ss(seg(t, 18.6, 18.9)) * (1 - ss(seg(t, 19.4, 19.8))) + .15 * ss(seg(t, 20.0, 20.6)), nod: -.12 * ss(seg(t, 18.6, 18.9)) * (1 - ss(seg(t, 19.2, 19.6)) ) });
  }
  if (t >= 22.5 && t < 23.5) {
    const u = seg(t, 22.5, 23.5); x = lerp(DOOR_X, LEA_HS, ss(u));
    pose = mixPose(stand({}), walk((t - 22.5) * TAU), Math.sin(u * Math.PI) ** .5);
  } else if (t >= 23.5) x = LEA_HS;
  if (t >= 23.4) {                                     // tend la main, serre (3 secousses), relâche, puis converse
    const k = ss(seg(t, 23.4, 23.95)) * (1 - ss(seg(t, 25.5, 26.1)));
    const osc = t > 24 && t < 25.4 ? .03 * Math.sin((t - 24) * TAU * 2.2) * (1 - seg(t, 24.8, 25.4)) : 0;
    pose = { ...stand({ headYaw: .1, nod: -.05 }), ...(k > 0 ? shakeHand(k, osc) : {}) };
    if (t > 30.2 && t < 32.5) { const g = Math.sin(seg(t, 30.2, 32.5) * Math.PI); pose.handL = V(-.1, .48 + .06 * g, .1 + .05 * g); pose.elbL = V(-1, -.3, 0); pose.headSide = .06 * g; }
  }
  return { place: { x, y: LEA_Y, S: LS, yaw }, pose };
}
function man(t) {
  let yaw = .3, pose = stand({ headYaw: .2 * Math.sin(t * .9), nod: -.05 });
  const turn = ss(seg(t, 22.3, 23.1));
  yaw = lerp(.3, YAW_M, turn);
  if (turn > 0) pose.headYaw = lerp(pose.headYaw, .05, turn);
  if (t >= 23.4) {
    const k = ss(seg(t, 23.5, 23.95)) * (1 - ss(seg(t, 25.5, 26.1)));
    const osc = t > 24 && t < 25.4 ? .03 * Math.sin((t - 24) * TAU * 2.2) * (1 - seg(t, 24.8, 25.4)) : 0;
    pose = { ...stand({ headYaw: .05 }), ...(k > 0 ? shakeHand(k, osc) : {}) };
    if (t > 27.3 && t < 29.6) { const g = Math.sin(seg(t, 27.3, 29.6) * Math.PI); pose.handL = V(-.16, .55 + .1 * g * Math.sin(t * 7), .18); pose.elbL = V(-1, -.3, 0); }
    if (t > 31.4 && t < 32.6) pose.nod = .1 * Math.sin(seg(t, 31.4, 32.6) * Math.PI * 2);
  }
  return { place: { x: MAN.x, y: MAN.y, S: MS, yaw }, pose };
}

// ---------------- Le fil : un trait de lavis bleu-vert qui part du badge ----------------
const ROUTE = spline([[1330, 2010], [1600, 1950], [1880, 2070], [2180, 1950], [2480, 2060], [2780, 1960], [3080, 2050], [3360, 1975], [3600, 1990]], 10);
const RS = [0]; for (let i = 1; i < ROUTE.length; i++) RS.push(RS[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
const RL = RS[RS.length - 1];
const routeAt = u => { const d = clamp(u) * RL; let i = 1; while (i < RS.length - 1 && RS[i] < d) i++; const k = (d - RS[i - 1]) / (RS[i] - RS[i - 1] || 1); return [lerp(ROUTE[i - 1][0], ROUTE[i][0], k), lerp(ROUTE[i - 1][1], ROUTE[i][1], k)]; };
const routeHead = t => eio(seg(t, 12.1, 15.3));
const THREAD_OUT = t => eio(seg(t, 38.6, 40.2));
// un ruban de lavis le long d'un polyligne, de la fraction a à b
function ribbon(ctx, pts, a, b, o = {}) {
  if (b <= a) return;
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = S[S.length - 1], A = a * L, B = b * L, w = o.w ?? 15, seed = o.seed ?? 1;
  const sub = []; for (let i = 0; i < pts.length; i++) { if (S[i] >= A && S[i] <= B) sub.push(pts[i]); }
  if (sub.length < 2) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let l = 0; l < 3; l++) {
    ctx.strokeStyle = rgba(l === 2 ? TEAL_D : TEAL, (o.a ?? .5) * (l === 2 ? .45 : .42)); ctx.lineWidth = l === 2 ? w * .28 : w * (1 - l * .25);
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); sub.forEach(([x, y], i) => { const jx = (n2(i * .3, l * 7, seed) - .5) * w * .35, jy = (n2(i * .3 + 9, l * 7, seed) - .5) * w * .35; i ? ctx.lineTo(x + jx, y + jy) : ctx.moveTo(x + jx, y + jy); }); ctx.stroke();
  }
  ctx.restore();
}

// ---------------- Monde, arrivée de la couleur ----------------
const world = buildWorld();
const GW = 640, GH = 360, SRC = [];
SRC.push({ x: LEA0[0], y: LEA_Y - 300, t: 9.1, v: 600, R: 330 });                   // le badge s'allume
for (let t = 12.2; t <= 15.3; t += .1) { const p = routeAt(routeHead(t)); SRC.push({ x: p[0], y: p[1] + 120, t: t + .1, v: 700, R: 360, sy: 1.3 }); }
SRC.push({ x: DOOR.x0 + 260, y: 1950, t: 18.75, v: 900, R: 420 });                   // la porte s'ouvre pour elle
SRC.push({ x: P3[0], y: P3[1] - 250, t: 20.6, v: 500, R: 200 }, { x: P2[0], y: P2[1] - 250, t: 20.9, v: 500, R: 200 });
SRC.push({ x: MAN.x, y: MAN.y - 300, t: 21.9, v: 700, R: 380 });
SRC.push({ x: 4240, y: 2040, t: 24.0, v: 1300, R: 760 });                             // poignée de main
SRC.push({ x: 4240, y: 2040, t: 34.6, v: 2300, R: 9000, noise: 1.2 });                // le soir : toute la page
const arr = arrivalField(W, H, GW, GH, SRC, { amp: 170, creep: .03 });
const T = (x, y) => arr[clamp(Math.floor(y / H * GH), 0, GH - 1) * GW + clamp(Math.floor(x / W * GW), 0, GW - 1)];

// ---------------- Caméra ----------------
function keyed(t) {
  const K = [
    [0, [2100, 1500, .55]], [5.6, [1980, 1560, .58]], [6.0, [1980, 1560, .58]], [8.8, [1330, 2040, 1.15]], [11.0, [1320, 2000, 1.6]],
  ];
  if (t <= 6) { const u = eio(seg(t, 0, 5.6)); return K[0][1].map((v, i) => lerp(v, K[1][1][i], u)); }
  if (t <= 8.8) { const u = eio(seg(t, 6.0, 8.8)); return K[2][1].map((v, i) => lerp(v, K[3][1][i], u)); }
  if (t <= 11.2) { const u = eio(seg(t, 8.8, 11.0)); return K[3][1].map((v, i) => lerp(v, K[4][1][i], u)); }
  const u = eio(seg(t, 11.2, 12.4)); return K[4][1].map((v, i) => lerp(v, [1560, 2010, .95][i], u));
}
// suivi latéral sur ressort amorti (le cadreur traîne un peu derrière Léa)
const FOLLOW = (() => { const out = []; let x = 1560, v = 0; const w = 3.2, dt = 1 / 120;
  for (let t = 12.4; t <= 19.3; t += dt) { const tgt = lea(t).place.x + 380; const a = w * w * (tgt - x) - 2 * w * v; v += a * dt; x += v * dt; out.push(x); } return out; })();
const followX = t => FOLLOW[clamp(Math.round((t - 12.4) * 120), 0, FOLLOW.length - 1)];
function camera(t) {
  let c;
  if (t < 12.4) c = keyed(t);
  else if (t < 19.3) c = [followX(t), 2010, .95];
  else if (t < 23.9) { const u = eio(seg(t, 19.3, 20.4)); c = [lerp(followX(19.3), 4235, u), lerp(2010, 2030, u), lerp(.95, 1.0, u)]; }
  else if (t < 27.0) { const u = eo(seg(t, 23.95, 24.13)), d = ss(seg(t, 24.2, 27)); c = [lerp(4235, 4240, u), lerp(2030, 1990, u) - 30 * d, lerp(1.0, 1.26, u) + .04 * d]; }
  else if (t < 34.5) { const u = eio(seg(t, 27.0, 27.9)); c = [lerp(4240, 4235, u), lerp(1960, 1850, u), lerp(1.3, 1.24, u) + .02 * seg(t, 27.9, 34.5)]; }
  else if (t < 40.4) { const u = eio(seg(t, 34.5, 36.5)); c = [lerp(4240, W / 2, u), lerp(1820, H / 2, u), lerp(1.26, 1920 / W, eo(seg(t, 34.5, 36.5)) * .4 + u * .6)]; }
  else { const u = eio(seg(t, 40.4, 41.6)); c = [lerp(W / 2, 1120, u), lerp(H / 2, 2520, u), lerp(1920 / W, .8, u) + .03 * seg(t, 41.6, DUR)]; }
  let shake = [0, 0]; if (t > 24 && t < 24.35) { const k = (1 - seg(t, 24, 24.35)) * 6; shake = [Math.sin(t * 91) * k, Math.cos(t * 77) * k]; }
  return { cx: c[0] + shake[0], cy: c[1] + shake[1], z: c[2], rot: 0 };
}

// ---------------- Image ----------------
const cvs = document.getElementById('c'), ctx = cvs.getContext('2d');
const glc = document.createElement('canvas'); glc.width = 1920; glc.height = 1080;
const comp = compositor(glc, { ...world, arr, gw: GW, gh: GH });
const tooth = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); const im = x.createImageData(512, 512); const R = rng(77);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) { const v = n2(i * .35, j * .35, 3) * .6 + n2(i * .09, j * .09, 5) * .4; const g = 255 - Math.max(0, (v - .55)) * 55 - (R() < .004 ? 25 : 0); const k = (j * 512 + i) * 4; im.data[k] = g; im.data[k + 1] = g * .995; im.data[k + 2] = g * .985; im.data[k + 3] = 255; }
  x.putImageData(im, 0, 0); return c; })();
const toothPat = ctx.createPattern(tooth, 'repeat');
function inkProgress(prims, t, t0, t1) {
  const inks = prims.filter(p => p.k === 'ink'), n = inks.length; const u = clamp((t - t0) / (t1 - t0));
  const map = new Map(); inks.forEach((p, i) => map.set(p, clamp(u * n - i * .75)));
  return p => map.get(p) ?? 1;
}
const bloomClip = (cx, cy, R, seed) => c2 => { c2.beginPath(); const n = 24; for (let i = 0; i <= n; i++) { const a = i / n * TAU, r = R * (.8 + .4 * n2(Math.cos(a) * 2 + seed, Math.sin(a) * 2, seed)); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? c2.lineTo(x, y) : c2.moveTo(x, y); } c2.closePath(); };
function shadow(x, y, S, a) { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = rgba(hex('#5a5f82'), a); ctx.beginPath(); ctx.ellipse(x + S * .06, y + 3, S * .17, S * .03, 0, 0, TAU); ctx.fill(); ctx.restore(); }

// Textes : écrits à la main dans la page ; chaque texte visible est noté pour readcheck (boîte en pixels écran)
let CAM = null, SEEN = [];
const toScreen = (x, y) => [960 + (x - CAM.cx) * CAM.z, 540 + (y - CAM.cy) * CAM.z];
function txt(id, text, x, y, size, p, o = {}) {
  if (p <= 0) return;
  const w = handwrite(ctx, text, x, y, size, p, o);
  const [a, b] = toScreen(x, y - size * .8), [c, d] = toScreen(x + w, y + size * .28);
  SEEN.push({ id, text, x0: a, y0: b, x1: c, y1: d, ...(o.pass ? { pass: true } : {}) });
}

// Badge de Léa (cordon + carte) ; il prend la couleur du fil à 9,05 s
function badge(prims, t, col) {
  const h = prims.head, r = h.r, side = h.fwd[0];
  const bx = h.c[0] + side * r * .55, by = h.c[1] + r * 3.3, bw = r * .62, bh = r * .82;
  const card = [[bx - bw, by - bh], [bx + bw, by - bh], [bx + bw, by + bh], [bx - bw, by + bh]];
  const glow = clamp((t - 9.05) / .35);
  drawPrims(ctx, [{ k: 'knock', poly: card, a: .95 }], {});
  if (glow > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; wash(ctx, card, TEAL, { a: .7 * glow, j: 1.2, layers: 2, edge: .4, seed: 4 }); ctx.restore(); }
  const ink = clamp((t - .6) / .4);
  drawPen(ctx, penStroke([...card, card[0], card[1]], { w: 2, wob: .4, seed: 12, over: 2, smooth: false }), ink);
  drawPen(ctx, penStroke([[h.c[0] - r * .55, h.c[1] + r * 1.1], [bx - bw * .6, by - bh]], { w: 1.4, wob: .4, seed: 13, over: 0 }), ink);
  drawPen(ctx, penStroke([[h.c[0] + r * .55, h.c[1] + r * 1.1], [bx + bw * .6, by - bh]], { w: 1.4, wob: .4, seed: 14, over: 0 }), ink);
  // l'éclosion : un anneau de touches bleu-vert autour du badge
  if (t > 9.0 && t < 10.4) { const a = t - 9.0; ctx.save(); ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 14; i++) { const ang = i / 14 * TAU + .3, rr = r * (1.4 + a * 3.2); dab(ctx, bx + Math.cos(ang) * rr, by + Math.sin(ang) * rr * .9, r * .22 * (1 - a / 1.4), ang, TEAL, .5 * (1 - a / 1.4), i + 7); }
    ctx.restore(); }
  return [bx, by];
}

// Bulle de dialogue : contour à la plume, papier réservé
function bubble(cx0, cy0, w, h, tail, p, seed) {
  if (p <= 0) return;
  const e = rough(ellipse(cx0, cy0, w, h, 32), 4, seed, 10, .02);
  const k = e.reduce((best, q, i) => Math.hypot(q[0] - tail[0], q[1] - tail[1]) < Math.hypot(e[best][0] - tail[0], e[best][1] - tail[1]) ? i : best, 0);
  const poly = [...e.slice(0, k), [tail[0], tail[1]], ...e.slice(k + 1)];
  drawPrims(ctx, [{ k: 'knock', poly, a: .9 * clamp(p * 3) }], {});
  drawPen(ctx, penStroke([...poly, poly[0], poly[1]], { w: 2.6, wob: .9, seed, over: 4, smooth: false }), p);
}
// Gribouillis d'une langue qu'on ne lit pas (boucles abstraites, pas de faux caractères)
function scribble(x0, y0, w, rows, p, from, seed) {
  for (let r = 0; r < rows; r++) {
    const pts = []; const n = 40, R = rng(seed + r);
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push([x0 + u * w * (r === rows - 1 ? .6 : 1), y0 + r * 46 + Math.sin(u * 38 + R() * .5) * 11 + Math.cos(u * 17) * 5]); }
    const st = penStroke(pts, { w: 2.2, wob: .8, seed: seed + r, over: 2 });
    drawPen(ctx, st, clamp(p * rows - r), INK, .85, clamp(from * rows - r));
  }
}

// Sous-titres : une ligne manuscrite écrite dans la marge du bas (bande de papier, jamais une boîte)
const SUBS = [
  [.8, 4.5, 'Neuf heures. 2 000 visiteurs, et Léa ne connaît personne.'],
  [6.3, 9.5, 'Mais son badge sait déjà ce qu’elle vient chercher.'],
  [12.3, 17.7, 'L’IA lui trace un chemin : la bonne conférence, sans file d’attente.'],
  [19.7, 23.3, 'Puis elle lui propose une rencontre. Il parle japonais.'],
  [27.3, 31.8, 'Aucune importance : la traduction suit la conversation, en direct.'],
  [34.9, 38.8, 'Le soir venu, chaque échange l’attend, résumé dans son carnet.'],
  [41.3, 46.5, 'L’IA trace le chemin. Les rencontres, elles, restent humaines.'],
];
window.SUBS = SUBS;
function subtitle(t) {
  for (const [a, b, s] of SUBS.slice(0, 6)) {
    if (t < a || t > b) continue;
    const fade = clamp((b - t) / .25);
    ctx.save(); ctx.font = '600 50px Caveat'; const w = ctx.measureText(s).width; ctx.restore();
    const x = 960 - w / 2, y = 1032;
    const band = rough([[x - 50, y - 50], [x + w + 50, y - 50], [x + w + 50, y + 22], [x - 50, y + 22]], 6, 3, 12, .03);
    ctx.save(); ctx.globalAlpha = fade; drawPrims(ctx, [{ k: 'knock', poly: band, a: .78 }], {});
    handwrite(ctx, s, x, y, 50, eo(seg(t, a, a + .45)), { font: 'Caveat', weight: 600, alpha: .95 });
    ctx.restore();
  }
}

window.DUR = DUR;
window.render = t => {
  const cam = camera(t); CAM = cam; SEEN = [];
  comp(cam, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.drawImage(glc, 0, 0);
  ctx.setTransform(cam.z, 0, 0, cam.z, 960 - cam.z * cam.cx, 540 - cam.z * cam.cy);
  const L = lea(t), M = man(t);
  const lp = figure(LOOK.lea, L.pose, L.place, { seed: 50, boil: boilOf(t) });
  const mp = figure(LOOK.ken, M.pose, M.place, { seed: 70, boil: boilOf(t) });
  // l'inconnu (plus au fond d'un cheveu), puis Léa
  const mCol = clamp((t - 21.95) / .5), mInk = inkProgress(mp, t, 3.2, 3.8);
  shadow(M.place.x, M.place.y, MS, .3 * clamp((t - T(M.place.x, M.place.y - 100)) / .5));
  if (t > 3.2) drawPrims(ctx, mp, { color: mCol, ink: mInk, clip: mCol < 1 ? bloomClip(M.place.x, M.place.y - MS * .5, MS * 1.1 * eo(mCol), 5) : null });
  const lCol = clamp((t - 9.05) / .55);
  shadow(L.place.x, L.place.y, LS, .3 * lCol);
  let B = [0, 0];
  if (t > .15) {
    const hd = lp.head, bx = hd.c[0] + hd.fwd[0] * hd.r * .55, by = hd.c[1] + hd.r * 3.3;
    drawPrims(ctx, lp, { color: lCol, ink: inkProgress(lp, t, .15, 1.0), clip: lCol < 1 ? bloomClip(bx, by, LS * 1.2 * eo(lCol), 3) : null });
    B = badge(lp, t, lCol);
  }
  // le fil : de son badge à la porte de la conférence
  const head = routeHead(t), out = THREAD_OUT(t);
  if (head > 0) {
    const pts = ROUTE.slice(); pts[0] = t < 12.6 ? B : pts[0];
    ribbon(ctx, pts, out, head, { w: 21, seed: 3 });
    if (head < 1) { const p = routeAt(head); ctx.save(); ctx.globalCompositeOperation = 'multiply'; for (let i = 0; i < 4; i++) dab(ctx, p[0] + (n2(t * 9, i) - .5) * 30, p[1] + (n2(i, t * 9) - .5) * 30, 7 + i * 2, t * 4 + i, TEAL, .45, boilOf(t) + i); ctx.restore(); }
  }
  // à la porte : une coche, et l'écriteau
  if (t > 18.75) { const k = eo(seg(t, 18.75, 19.05)); drawPen(ctx, penStroke([[DOOR.dx1 + 40, 1900], [DOOR.dx1 + 62, 1928], [DOOR.dx1 + 110, 1862]], { w: 7, wob: .6, seed: 81, over: 2, smooth: false }), k, TEAL_D, .85 * (1 - THREAD_OUT(t))); }
  txt('door', 'Conférence · 9 h 30', DOOR.x0 + 52, DOOR.top + 112, 66, eo(seg(t, 16.4, 17.1)), { font: 'Caveat', weight: 600 });
  // trois propositions : fils pointillés vers trois personnes ; une seule devient pleine
  if (t > 19.9 && t < 24.8) {
    const tg = [[P3[0], P3[1] - Sof(P3[1]) * .9, 20.4], [P2[0], P2[1] - Sof(P2[1]) * .9, 20.7], [mp.head.c[0], mp.head.c[1] + mp.head.r * 2, 21.0]];
    tg.forEach(([x, y, t0], i) => {
      const curve = spline([B, [lerp(B[0], x, .5), Math.min(B[1], y) - 70 - i * 30], [x, y]], 12);
      const p = eo(seg(t, t0, t0 + .5)), fadeO = i < 2 ? 1 - ss(seg(t, 21.7, 22.4)) : 1 - ss(seg(t, 24.1, 24.8));
      ctx.save(); ctx.globalAlpha = fadeO; ribbon(ctx, curve, 0, p, { w: 9, a: .55, dash: [22, 18], seed: 20 + i });
      if (i === 2) ribbon(ctx, curve, 0, eo(seg(t, 21.55, 21.9)), { w: 18, a: .62, seed: 30 });
      ctx.restore();
    });
  }
  // la conversation traduite
  const mh = mp.head.c, lh = lp.head.c;
  bubble(mh[0] + 175, mh[1] - 255, 300, 110, [mh[0] + 60, mh[1] - 110], eo(seg(t, 27.2, 27.5)) * (1 - seg(t, 46, 47)), 91);
  if (t > 27.3) {
    scribble(mh[0] + 20, mh[1] - 300, 400, 2, eo(seg(t, 27.4, 28.3)), ei(seg(t, 28.45, 28.85)), 95);
    if (t > 28.4) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; wash(ctx, [[mh[0] - 20, mh[1] - 300], [mh[0] - 20 + 480 * eo(seg(t, 28.4, 28.8)), mh[1] - 312], [mh[0] - 20 + 480 * eo(seg(t, 28.4, 28.8)), mh[1] - 238], [mh[0] - 20, mh[1] - 226]], TEAL, { a: .22, j: 4, layers: 2, edge: .2, seed: 97 }); ctx.restore(); }
    txt('fr1', 'Enchanté, Léa !', mh[0] + 20, mh[1] - 240, 72, eo(seg(t, 28.7, 29.5)), { font: 'Caveat', weight: 600 });
    txt('tr', 'traduit en direct', mh[0] + 90, mh[1] - 182, 38, eo(seg(t, 29.2, 29.7)), { font: 'Caveat', alpha: .75 });
  }
  bubble(lh[0] - 250, lh[1] - 250, 330, 95, [lh[0] - 70, lh[1] - 110], eo(seg(t, 30.2, 30.5)), 93);
  txt('fr2', 'Ravie de vous rencontrer !', lh[0] - 540, lh[1] - 232, 58, eo(seg(t, 30.4, 31.3)), { font: 'Caveat', weight: 600 });
  // notes de la page
  txt('note', 'Hall 3 · 9 h 00 · 2 000 visiteurs', 560, 740, 74, eo(seg(t, .45, 1.35)), { font: '"Reenie Beanie"', rot: -.03 });
  txt('soir1', '1 conférence · 0 file d’attente', 2900, 250, 120, eo(seg(t, 36.2, 36.9)), { font: 'Caveat', weight: 600 });
  txt('soir2', '3 contacts · 1 vraie rencontre', 2900, 410, 120, eo(seg(t, 37.0, 37.7)), { font: 'Caveat', weight: 600 });
  txt('fin1', 'L’IA trace le chemin.', 230, 2610, 132, eo(seg(t, 41.3, 42.0)), { font: 'Caveat', weight: 600 });
  txt('fin2', 'Les rencontres restent humaines.', 230, 2770, 132, eo(seg(t, 42.1, 42.9)), { font: 'Caveat', weight: 600 });
  // grain du papier, multiplié sur tout
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = toothPat;
  ctx.setTransform(cam.z * .8, 0, 0, cam.z * .8, 960 - cam.z * cam.cx, 540 - cam.z * cam.cy);
  const iz = 1 / (cam.z * .8); ctx.fillRect((cam.cx - 1300 / cam.z) / .8, (cam.cy - 800 / cam.z) / .8, 2600 * iz, 1600 * iz); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  subtitle(t);
};
window.TEXTS = t => { window.render(t); return SEEN.filter(s => s.x1 > 0 && s.x0 < 1920 && s.y1 > 0 && s.y0 < 1080).map(s => ({ ...s, x0: Math.max(0, s.x0), x1: Math.min(1920, s.x1) })); };

// ---------------- Événements sonores ----------------
const EV = [];
EV.push({ t: .15, type: 'sketchFig', d: .85 }, { t: .45, type: 'write', d: .9 }, { t: 9.0, type: 'badge' }, { t: 9.05, type: 'bloom', v: .8 }, { t: 12.1, type: 'thread', d: 3.2 },
  { t: 16.4, type: 'write', d: .7 }, { t: 18.75, type: 'tick' }, { t: 18.8, type: 'bloom', v: .6 }, { t: 20.4, type: 'propose' }, { t: 20.7, type: 'propose' }, { t: 21.0, type: 'propose' },
  { t: 21.55, type: 'solid' }, { t: 21.95, type: 'bloom', v: .7 }, { t: 22.35, type: 'turn' }, { t: 24.0, type: 'shake' }, { t: 24.02, type: 'bloom', v: 1 },
  { t: 27.4, type: 'scribble', d: .9 }, { t: 28.4, type: 'swipe' }, { t: 28.7, type: 'write', d: .8 }, { t: 29.2, type: 'write', d: .5 }, { t: 30.4, type: 'write', d: .9 },
  { t: 33.0, type: 'silence' }, { t: 34.55, type: 'bloom', v: .45, d: 3.2 }, { t: 36.2, type: 'write', d: .7 }, { t: 37.0, type: 'write', d: .7 }, { t: 38.6, type: 'erase', d: 1.6 },
  { t: 41.3, type: 'write', d: .7 }, { t: 42.1, type: 'write', d: .8 });
for (let k = 0; k < 12; k++) EV.push({ t: 12.5 + k * .5, type: 'step' });
EV.push({ t: 22.5, type: 'step' }, { t: 23.0, type: 'step' });
window.EV = EV;
window.STROKES = world.strokes;
EV.push(...world.strokes.map(s => ({ t: s[0], type: "stroke", d: s[1], L: s[2] })));
window.READY = true;
