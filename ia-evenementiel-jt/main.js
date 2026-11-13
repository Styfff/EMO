// EXPO INFO · « L'IA s'installe » — bulletin de 45 s, style Broadcast News Package (Lemo-Opuscar)
// Canvas 2D, render(t) déterministe. Grille 120 BPM, temps 0 = 1,5 s. Pas de sous-titres incrustés : .srt séparé. Faits : FACTS.md.
const W = 1920, H = 1080, DUR = 45.0;
const cv = document.getElementById('out'); const ctx = cv.getContext('2d');
const PHOTO = new URLSearchParams(location.search).get('nophoto') ? null : 'assets/plate_hall.jpg';

const C = {
  ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55',
  lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064',
  paper: '#F4F1E8', olive: '#6E5A1E', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D',
};
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, b6i: s => `italic 600 ${s}px Barlow`, mono: s => `500 ${s}px Plex` };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const IM = {};
function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; }); }

// —— Textes (registre pour readcheck) ——
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id && ctx.globalAlpha > .02) { const pass = id[0] === '~'; const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/(\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    TX.push({ id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y), ...(pass ? { pass: true } : {}) }); }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
function photo(img, fx, fy, s) {
  s = Math.max(s, W / img.width, H / img.height);
  let ox = W / 2 - fx * s, oy = H / 2 - fy * s;
  ox = Math.min(0, Math.max(W - img.width * s, ox)); oy = Math.min(0, Math.max(H - img.height * s, oy));
  ctx.drawImage(img, ox, oy, img.width * s, img.height * s);
}
function vignette(a = .5) { const g = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); g.addColorStop(0, 'rgba(8,9,11,0)'); g.addColorStop(1, `rgba(8,9,11,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
const GR = [];
function makeGrain() { for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (hash(i * .37 + k * 9.1) + hash(i * .11 + k) - 1) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); GR.push(c); } }
function grain(t, a = .07) { const f = Math.floor(t * 24), c = GR[f % GR.length]; ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a;
  const ox = -Math.floor(hash(f) * 256), oy = -Math.floor(hash(f + 7) * 256); for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(c, x, y); ctx.restore(); }

// —— Plaque de la chaîne : parallélogramme citron, barres encre et or, « EXPO » ——
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD);
  ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  ctx.font = F.b8(h * .8); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let x = -w * .27;
  ['E', 'X', 'P', 'O'].forEach((L, i) => { const d = clamp(drop * 4 - i); const yy = h * .29 + (1 - eo(d)) * -h * 1.1;
    ctx.save(); ctx.globalAlpha = ctx.globalAlpha * clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore(); x += ctx.measureText(L).width - h * .01; });
  if (glint >= 0 && glint <= 1) { const gx2 = lerp(-w, w, glint); const gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2); }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center', id = null) {
  const parts = [['EXPO ', C.white], ['INFO', C.lemon]], ls = size * .14;
  const tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; const x0 = cx;
  for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
  if (id) TX.push({ id, text: 'EXPO INFO', x0, y0: y - size, x1: cx, y1: y + 8 });
}

// ============ Habillage ============
const STRAP = { out: 36.0, items: [
  { a: 6.0, tab: 'MARCHÉ', l1: '87 % des entreprises de salons utilisent l’IA', l2: 'BAROMÈTRE MONDIAL UFI · ENQUÊTE DE DÉCEMBRE 2025' },
  { a: 17.0, tab: 'ORGANISATEURS', l1: 'Les organisateurs de salons en tête', l2: '23 % AUX STADES LES PLUS AVANCÉS · UFI, DÉC. 2025' },
  { a: 25.0, tab: 'CONGRÈS', l1: '91 % des organisateurs de réunions s’en servent', l2: 'ENQUÊTE PCMA · PUBLIÉE LE 18 MARS 2025' }] };
function strap(t) {
  if (t < STRAP.items[0].a || t >= STRAP.out) return;
  let S = STRAP.items[0]; for (const it of STRAP.items) if (t >= it.a) S = it;
  const x0 = 96, ty = 856, by = 904, bh = 104, bw = 1250;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 120, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 120, 6); text('EXPO', x0 + bw + 60, by + 68, F.b8(40), C.lemon, 'center', 1);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  text(S.l1, x0 + 44, by + 58, F.b8(52), C.ink, 'left', .5, 'strap'); text(S.l2, x0 + 46, by + 92, F.b6(26), C.olive, 'left', 1.5, 'strap2');
  ctx.restore();
  const tabW = 40 + tw(S.tab, F.b8(32), 2.5);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, tabW, by - ty); text(S.tab, x0 + 20, ty + 38, F.b8(32), C.ink, 'left', 2.5, 'tab');
  ctx.restore();
}
const TAGS = [[6.0, 12.5, 'ILLUSTRATION', 'photo d’un salon, sans lien direct']];
function cornerTag(t) {
  if (!PHOTO) return;
  const A = TAGS.find(r => t >= r[0] && t < r[1]); if (!A) return;
  const x = 96, y = 56, h = 64, w = 400;
  ctx.fillStyle = 'rgba(18,20,23,.82)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[2], x + 26, y + 28, F.mono(18), C.gold, 'left', 2, 'tag'); text(A[3], x + 26, y + 54, F.b6(22), C.white, 'left', .5, 'tag2');
}
function bug(t) { if (t < 1.45 || t > 39.75) return; ctx.globalAlpha = .95; plate(1739, 86, .327, -1, 1); text('INFO', 1650, 96, F.b8(26), C.white, 'right', 3); ctx.globalAlpha = 1; }
const SOURCES = [[6.0, 25.0, 'SOURCE : UFI · BAROMÈTRE N° 36'], [25.0, 36.0, 'SOURCE : PCMA · 18 MARS 2025']];
function credit(t) { const R = SOURCES.find(r => t >= r[0] && t < r[1]); if (!R) return; ctx.save(); ctx.globalAlpha = .75; text(R[2], 1836, 960, F.mono(14), C.paper, 'right', .5); ctx.restore(); }

// ============ Plans ============
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(1300, 380, 60, 1300, 380, 1100); rg.addColorStop(0, 'rgba(242,207,29,.16)'); rg.addColorStop(1, 'rgba(242,207,29,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) { const x = ((i * 380 + t * (30 + i * 6)) % 2600) - 400, w = 40 + hash(i) * 120; ctx.fillStyle = `rgba(242,207,29,${.025 + hash(i + 9) * .035})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 500, H); ctx.lineTo(x - 500, H); ctx.fill(); }
  ctx.fillStyle = 'rgba(244,241,232,.05)'; for (let x = 40 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
function shotSting(t) {
  studioBg(t);
  [[.04, .3, 22, -60], [.1, .36, 8, 40]].forEach(([a, b, h, dy]) => { const k = seg(t, a, b); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.translate(960, 470 + dy); ctx.rotate(-.14); const x = lerp(-1900, 1900, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 700, -h / 2, 1400, h); ctx.restore(); });
}
function stingLogo(t) {
  if (t > 1.5) return;
  const k = seg(t, .16, .42), fly = eio(seg(t, 1.12, 1.45));
  const shake = t > .42 && t < .7 ? Math.sin(t * 90) * 14 * (1 - seg(t, .42, .7)) : 0;
  const cx = lerp(960, 1739, fly) + shake, cy = lerp(450, 86, fly), s = lerp(back(k, 2.2), .327, fly);
  if (k > 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - eo(k)) * -.12 * (1 - fly)); ctx.translate(-cx, -cy); plate(cx, cy, s, seg(t, .85, 1.12) || -1, seg(t, .3, .7)); ctx.restore(); }
  const r = seg(t, .42, .8); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(960, 450, 300 + r * 700, 120 + r * 300, 0, 0, Math.PI * 2); ctx.stroke(); }
  const wa = seg(t, .5, .8), wo = 1 - seg(t, 1.05, 1.18);
  if (wa > 0 && wo > 0) { ctx.save(); ctx.globalAlpha = wo; ctx.beginPath(); ctx.rect(960 - 520 * eo(wa), 560, 1040 * eo(wa), 160); ctx.clip();
    wordmark(960, 640, 70, 'center'); text('L’ESSENTIEL · 13 NOVEMBRE 2026', 960, 690, F.mono(22), C.gold, 'center', 3); ctx.restore(); }
}

// Sommaire (le même objet ouvre et ferme le bulletin)
const ROWS = [['01', '87 % des entreprises de salons utilisent l’IA', 'UFI · DÉC. 2025'], ['02', 'Les organisateurs de salons en tête', 'UFI · DÉC. 2025'], ['03', 'Congrès : l’usage avant la stratégie', 'PCMA · MARS 2025']];
const DYR = 110;
function rundown(t, close) {
  studioBg(t);
  ctx.save(); ctx.translate(0, DYR);
  const A0 = close ? 0 : 1.6, m = (a, b) => close ? 1 : eo(seg(t, a, b));
  const x = 120, ta = m(A0, A0 + .25);
  const tabTxt = close ? 'RÉCAPITULATIF' : 'AU SOMMAIRE', tabW = 40 + tw(tabTxt, F.b8(32), 2.5);
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 170, tabW * ta, 50); if (ta > .9) text(tabTxt, x + 20, 208, F.b8(32), C.ink, 'left', 2.5, 'rtab');
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 800, h + 24); ctx.clip(); ctx.translate(0, (1 - k) * (h + 24)); fn(); ctx.restore(); };
  r(390, 170, m(2.0, 2.3), () => text('13', x - 6, 390, F.b8(180), C.white, 'left', 2, 'rdate'));
  r(480, 90, m(2.2, 2.5), () => text('NOV. 2026', x, 480, F.b8(84), C.lemon, 'left', 4, 'rmon'));
  ctx.globalAlpha = m(2.5, 2.8); text('TROIS ENQUÊTES · 3 SUJETS', x, 532, F.mono(22), C.gold, 'left', 3, 'rwk'); ctx.globalAlpha = 1;
  r(626, 64, m(2.6, 2.9), () => text('L’IA dans l’événementiel', x, 626, F.b8(62), C.white, 'left', 1, 'rtt'));
  const X0 = 800, RW = 1024, RH = 120;
  ROWS.forEach(([n, l, d], i) => {
    const a = close ? 0 : 3.0 + i * .5, y = 160 + i * 150;
    const k = close ? 1 : seg(t, a, a + .3); if (k <= 0) return;
    const sy = close ? 1 : back(k, 2.0);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, Math.max(.02, sy)); ctx.translate(0, -y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X0 + 10, y + 10, RW, RH);
    ctx.fillStyle = C.ink2; ctx.fillRect(X0, y, RW, RH); ctx.fillStyle = C.lemon; ctx.fillRect(X0, y, 140, RH);
    text(n, X0 + 70, y + 90, F.b8(84), C.ink, 'center');
    text(l, X0 + 176, y + 62, F.b8(44), C.white, 'left', .5, close ? null : '~row' + i);   // aperçu : revient dans le bandeau et le récapitulatif
    text(d, X0 + 178, y + 98, F.mono(18), C.gold, 'left', 2);
    const sw = close ? 0 : seg(t, a + .05, a + .45);
    if (sw > 0 && sw < 1) { const gx = X0 + 140 + (RW - 140) * eio(sw); const g = ctx.createLinearGradient(gx - 160, 0, gx, 0); g.addColorStop(0, 'rgba(242,207,29,0)'); g.addColorStop(1, 'rgba(242,207,29,.28)'); ctx.fillStyle = g; ctx.fillRect(Math.max(X0 + 140, gx - 160), y, Math.min(160, gx - X0 - 140), RH); }
    if (close) { const ck = seg(t, 1.0 + i * .5, 1.0 + i * .5 + .22);
      if (ck > 0) { const s = back(ck, 2.6), cx = X0 + RW - 64, cy = y + 44; ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
        ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 11); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore(); } }
    ctx.restore();
  });
  if (!close) { const hl = seg(t, 5.0, 5.25); if (hl > 0) { ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.globalAlpha = .6 + .4 * Math.cos((t - 5.0) * Math.PI * 4); ctx.strokeRect(X0 - 4, 156, RW * eo(hl) + 8, RH + 8); ctx.globalAlpha = 1; } }
  ctx.restore();
}

// Tableau à volets (ancien et nouveau chiffre sur le même tableau)
function flipTile(x, y, w, h, from, to, t0, t, font, col) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  const half = (s, top, sc = 1) => { ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip();
    ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2)); ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h);
    text(s, x + w / 2, y + h * .76, font, col, 'center'); ctx.restore(); };
  if (p >= 1) { half(to, true); half(to, false); } else if (p <= 0) { half(from, true); half(from, false); }
  else { half(to, true); half(from, false); if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
}
function stamp(t, t0, x, y, l1, rot = -.1) {
  const sk = seg(t, t0, t0 + .16); if (sk <= 0) return;
  const w = tw(l1, F.b8(56), 4) + 80, s = 1 + .9 * (1 - eo(sk));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  ctx.fillStyle = 'rgba(18,20,23,.94)'; ctx.fillRect(-w / 2, -54, w, 108);
  ctx.strokeStyle = C.lemon; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 10, -44, w - 20, 88); ctx.lineWidth = 1.5; ctx.strokeRect(-w / 2 + 18, -36, w - 36, 72);
  text(l1, 0, 20, F.b8(56), C.lemon, 'center', 4, 'stamp'); ctx.restore();
  const rr = seg(t, t0 + .05, t0 + .5); if (rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, w / 2 + rr * 160, 70 + rr * 60, rot, 0, Math.PI * 2); ctx.stroke(); }
}
function eyebrow(t, t0, s, x = 150, y = 214) { ctx.globalAlpha = eo(seg(t, t0, t0 + .2)); text(s, x, y, F.mono(24), C.gold, 'left', 4, 'eb' + t0); ctx.globalAlpha = 1; }
function pushUp(t, t0, s, x, y, font, col, id, clipH = 200, align = 'left') { const k = eo(seg(t, t0, t0 + .3)); if (k <= 0) return;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - clipH + 20, W, clipH); ctx.clip(); text(s, x, y + (1 - k) * clipH, font, col, align, 1, id); ctx.restore(); }

// ① MARCHÉ — A : photo + tableau à volets 83 % → 87 %
function shot1A(t) {
  if (IM.hall) { ctx.save(); ctx.filter = 'blur(9px) brightness(.8)'; photo(IM.hall, IM.hall.width * .5, IM.hall.height * .5, lerp(1.0, 1.08, seg(t, 6, 12.5)) * Math.max(W / IM.hall.width, H / IM.hall.height)); ctx.restore();   // flou : aucun logo lisible, aucun visage net
    const g = ctx.createLinearGradient(0, 0, 1500, 0); g.addColorStop(0, 'rgba(14,16,19,.92)'); g.addColorStop(.55, 'rgba(14,16,19,.62)'); g.addColorStop(1, 'rgba(14,16,19,.3)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    vignette(.55); grain(t); } else studioBg(t);
  ctx.save(); ctx.translate(0, 60);
  eyebrow(t, 6.2, 'UFI · BAROMÈTRE MONDIAL N° 36 · DÉC. 2025');
  pushUp(t, 6.35, 'Entreprises du secteur des salons', 150, 300, F.b8(64), C.white, 'h1', 90);
  pushUp(t, 6.5, 'qui utilisent l’IA', 150, 370, F.b8(64), C.lemon, 'h1b', 90);
  const k = eo(seg(t, 6.7, 7.0)); ctx.globalAlpha = k;
  const row = (y, lab, id) => text(lab, 150, y + 92, F.mono(26), C.grey, 'left', 3, id);
  row(440, 'JUIN 2025', 'r1'); flipTile(470, 440, 170, 130, null, '83', 0, 99, F.b8(110), C.white); flipTile(650, 440, 110, 130, null, '%', 0, 99, F.b8(80), C.white);
  row(600, 'DÉC. 2025', 'r2'); flipTile(470, 600, 170, 130, '83', '87', 8.5, t, F.b8(110), C.lemon); flipTile(650, 600, 110, 130, null, '%', 0, 99, F.b8(80), C.lemon);
  ctx.globalAlpha = 1;
  const bk = seg(t, 9.6, 9.85); if (bk > 0) { const s = back(bk, 2.2); ctx.save(); ctx.translate(1000, 650); ctx.scale(s, s);
    text('+4', 0, 30, F.b8(160), C.lemon, 'left', 0, 'plus4'); text('POINTS EN SIX MOIS', 6, 84, F.mono(24), C.paper, 'left', 3, 'plus4b'); ctx.restore(); }
  ctx.restore();
}
// ① MARCHÉ — B : une barre, une échelle : 68 / 15 / 4 / 13
const PARTS = [[68, 'Outils grand public', 'utilisés régulièrement', C.lemon], [15, 'Outils intégrés', 'aux plateformes', C.lemonD], [4, 'Algorithmes', 'maison', C.gold], [13, 'Pas ou presque', 'pas d’IA', '#3A3F47']];
function shot1B(t) {
  studioBg(t); ctx.save(); ctx.translate(0, 60);
  eyebrow(t, 12.55, 'UFI · BAROMÈTRE N° 36 · DÉC. 2025');
  pushUp(t, 12.6, 'Comment les entreprises utilisent l’IA', 150, 310, F.b8(64), C.white, 'h2', 90);
  const X = 150, BW = 1620, Y = 400, BH = 120; let acc = 0;
  PARTS.forEach(([v, a, b, col], i) => {
    const t0 = 13.0 + i * .35, k = eio(seg(t, t0, t0 + .4)), x = X + BW * acc / 100, w = BW * v / 100 * k; acc += v;
    if (k <= 0) return;
    ctx.fillStyle = col; ctx.fillRect(x, Y, Math.max(0, w - 4), BH);
    const lk = eo(seg(t, t0 + .3, t0 + .55)); ctx.globalAlpha = lk;
    const lx = i === 2 ? x - 40 : x + 18, ly = i % 2 === 0 ? Y + BH + 70 : Y + BH + 70;
    text(v + ' %', i >= 2 ? x + BW * v / 200 : lx, i >= 2 ? Y - 24 : Y + 92, F.b8(i >= 2 ? 56 : 80), i === 3 ? C.paper : (i >= 2 ? C.gold : C.ink), i >= 2 ? 'center' : 'left', 0, 'pv' + i);
    const cxl = [X + 18, X + BW * .68 + 18, X + BW * .83 + 18 - 230, X + BW * .87 + 18][i];
    const al = i === 2 ? 'left' : 'left';
    text(a, cxl, Y + BH + 60 + (i === 2 ? 90 : 0), F.b8(34), C.white, al, .5, 'pa' + i); text(b, cxl, Y + BH + 98 + (i === 2 ? 90 : 0), F.b6(26), C.grey, al, 1, 'pb' + i);
    ctx.globalAlpha = 1;
  });
  const ck = eo(seg(t, 14.0, 14.3)); if (ck > 0) { ctx.globalAlpha = ck; ctx.fillStyle = C.ink3; ctx.fillRect(X + BW - 520, 760, 520, 64); ctx.fillStyle = C.lemon; ctx.fillRect(X + BW - 520, 760, 8, 64);
    text('SANS IA : 17 % → 13 %', X + BW - 496, 802, F.mono(22), C.paper, 'left', 1.5, 'chip'); ctx.globalAlpha = 1; }
  ctx.restore();
}
// ② ORGANISATEURS — barres comparées
const SEGS = [['Organisateurs', 23, 10], ['Prestataires', 21, 19], ['Lieux', 19, 16]];
function shot2(t) {
  studioBg(t); ctx.save(); ctx.translate(0, 70);
  eyebrow(t, 17.2, 'UFI · BAROMÈTRE N° 36 · DÉC. 2025 · PAR MÉTIER');
  pushUp(t, 17.3, 'Stades les plus avancés', 150, 300, F.b8(60), C.white, 'h3', 90);
  ctx.globalAlpha = eo(seg(t, 17.5, 17.8)); text('OUTILS INTÉGRÉS OU ALGORITHMES MAISON', 150, 346, F.mono(20), C.gold, 'left', 2, 'h3b'); ctx.globalAlpha = 1;
  const S = 22, X = 520;                                   // 1 point = 22 px, même échelle pour toutes les barres
  SEGS.forEach(([n, adv, low], i) => {
    const y = 400 + i * 110, k = eio(seg(t, 18.0 + i * .5, 18.45 + i * .5)); if (k <= 0) return;
    text(n, 150, y + 62, F.b8(46), i === 0 ? C.lemon : C.white, 'left', .5, 'sn' + i);
    ctx.fillStyle = i === 0 ? C.lemon : C.grey2; ctx.fillRect(X, y + 10, adv * S * k, 70);
    if (k >= 1) text(adv + ' %', X + adv * S + 20, y + 68, F.b8(56), i === 0 ? C.lemon : C.paper, 'left', 0, 'sv' + i);
    const k2 = eio(seg(t, 20.6 + i * .3, 21.0 + i * .3)); if (k2 <= 0) return;
    ctx.globalAlpha = k2; ctx.strokeStyle = C.paper; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); ctx.strokeRect(1240, y + 10, low * S * .9, 70); ctx.setLineDash([]);
    text(low + ' %', 1240 + low * S * .9 + 16, y + 64, F.b8(44), C.grey, 'left', 0, 'sl' + i); ctx.globalAlpha = 1;
  });
  const lk = eo(seg(t, 20.5, 20.8)); if (lk > 0) { ctx.globalAlpha = lk; text('PEU OU PAS D’IA', 1240, 380, F.mono(20), C.grey, 'left', 2, 'lowh'); ctx.globalAlpha = 1; }
  stamp(t, 22.5, 1620, 240, 'EN TÊTE', -.08);
  ctx.restore();
}
// ③ CONGRÈS — A : 91 %
function shot3A(t) {
  studioBg(t); ctx.save(); ctx.translate(0, 60);
  eyebrow(t, 25.2, 'PCMA · ENQUÊTE PUBLIÉE LE 18 MARS 2025');
  const k = eo(seg(t, 25.4, 25.75)); if (k > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 260, W, 330); ctx.clip(); text('91 %', 140, 560 + (1 - k) * 330, F.b8(320), C.lemon, 'left', 2, 'n91'); ctx.restore(); }
  pushUp(t, 26.0, 'des organisateurs de réunions interrogés', 150, 660, F.b8(56), C.white, 'h4', 80);
  pushUp(t, 26.2, 'utilisent l’IA d’une manière ou d’une autre', 150, 730, F.b8(56), C.white, 'h4b', 80);
  ctx.restore();
}
// ③ CONGRÈS — B : 15 / 65 / 20 + la formule de l'enquête
const PCMA = [[15, 'Leaders', 'processus repensés', C.lemon], [65, 'Majorité', 'usage fragmenté', C.grey2], [20, 'À la traîne', 'usage minime', '#3A3F47']];
function shot3B(t) {
  studioBg(t); ctx.save(); ctx.translate(0, 60);
  eyebrow(t, 30.6, 'PCMA · 18 MARS 2025 · UTILISATEURS DE L’IA');
  const X = 150, BW = 1620, Y = 250, BH = 110; let acc = 0;
  PCMA.forEach(([v, a, b, col], i) => {
    const t0 = 30.8 + i * .35, k = eio(seg(t, t0, t0 + .4)), x = X + BW * acc / 100; acc += v; if (k <= 0) return;
    ctx.fillStyle = col; ctx.fillRect(x, Y, Math.max(0, BW * v / 100 * k - 4), BH);
    const lk = eo(seg(t, t0 + .3, t0 + .55)); ctx.globalAlpha = lk;
    text(v + ' %', x + 18, Y + 84, F.b8(72), i === 0 ? C.ink : C.paper, 'left', 0, 'qv' + i);
    text(a, x + 18, Y + BH + 54, F.b8(36), i === 0 ? C.lemon : C.white, 'left', .5, 'qa' + i); text(b, x + 18, Y + BH + 90, F.b6(26), C.grey, 'left', 1, 'qb' + i);
    ctx.globalAlpha = 1;
  });
  const qk = seg(t, 32.0, 32.25); if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(150, 560); ctx.scale(s, s); text('“', -10, 120, F.b8(220), C.lemon, 'left'); ctx.restore(); }
  pushUp(t, 32.2, 'approaches AI in a fragmented,', 290, 600, F.b8(66), C.white, 'q1', 90);
  pushUp(t, 32.38, 'rather than strategic, way', 290, 680, F.b8(66), C.white, 'q2', 90);
  const ul = eio(seg(t, 34.0, 34.35)); if (ul > 0) { const x0 = 290 + tw('rather than ', F.b8(66), 1); ctx.fillStyle = C.lemon; ctx.fillRect(x0, 692, tw('strategic', F.b8(66), 1) * ul, 8); }
  ctx.globalAlpha = eo(seg(t, 32.1, 32.4)); text('« fragmentée plutôt que stratégique »', 290, 748, F.b6(34), C.grey, 'left', .5, 'qfr'); ctx.globalAlpha = 1;
  stamp(t, 33.3, 1560, 640, '15 % STRATÈGES', -.08);
  ctx.restore();
}
// Carton de fin
function shotEnd(t) {
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.04)'; for (let x = 40 - (t * 10) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(1260, 0); ctx.lineTo(1290, 0); ctx.lineTo(1150, 790); ctx.lineTo(1120, 790); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(1300, 0); ctx.lineTo(1306, 0); ctx.lineTo(1166, 790); ctx.lineTo(1160, 790); ctx.fill();
  const m = (a, b) => eo(seg(t, a, b)), x = 150;
  const r = (y, h, k, fn) => { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, y - h, 1120, h + 30); ctx.clip(); ctx.translate(0, (1 - k) * (h + 30)); fn(); ctx.restore(); };
  ctx.globalAlpha = m(40.1, 40.3); text('EXPO INFO · L’ESSENTIEL · 13 NOV. 2026', x, 210, F.mono(24), C.gold, 'left', 3, 'e0'); ctx.globalAlpha = 1;
  r(350, 130, m(40.12, 40.42), () => text('L’IA s’installe', x - 4, 350, F.b8(130), C.white, 'left', 2, 'e1'));
  r(440, 80, m(40.25, 40.52), () => text('dans les salons et les congrès', x, 440, F.b6i(70), C.lemon, 'left', 1, 'e2'));
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 482, 880 * eio(seg(t, 40.4, 40.7)), 2);
  const sm = m(40.8, 41.1); ctx.globalAlpha = sm; ctx.fillStyle = C.line; ctx.fillRect(x, 790, 1620, 1);
  CREDIT_LINES.forEach((s, i) => text(s, x, 830 + i * 32, F.b6(24), C.grey, 'left', .5, '~ec' + i));   // petites lignes de crédits ctx.globalAlpha = 1;
  ctx.globalAlpha = m(40.3, 40.6); plate(1600, 360, .62, seg(t, 41.0, 41.45) || -1, seg(t, 40.3, 40.8)); wordmark(1600, 520, 48, 'center', 'e8'); ctx.globalAlpha = 1;
}
let CREDIT_LINES = ['Sources : UFI, Global Exhibition Barometer, 36e édition (déc. 2025) et communiqué de la 35e · PCMA, enquête publiée le 18 mars 2025',
  'Voix : synthèse Kokoro (Apache 2.0) · Musique originale, échantillons VSCO 2 CE et VCSL (CC0) · Polices Barlow Condensed, IBM Plex Mono (OFL)'];

// ============ Montage ============
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 84, 0, 84, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 5, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 5, 0, 14, H); }
function layer(fn, t, tov) { fn(t); cornerTag(tov); credit(tov); strap(tov); }
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-140, W + 140, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW));
  wipeBand(bx);
}
const OPEN = t => rundown(t, false), RECAP = t => rundown(t - 36.0, true);
const SCENES = [[1.5, OPEN], [6.0, shot1A], [12.5, shot1B], [17.0, shot2], [25.0, shot3A], [30.5, shot3B], [36.0, RECAP], [40.0, shotEnd]];
const WIPES = [[1.2, 1.5], [5.7, 6.0], [16.7, 17.0], [24.7, 25.0], [35.7, 36.0]];
function scene(t) {
  if (t < 1.5) { if (t >= 1.2) wipe(t, 1.2, 1.5, shotSting, OPEN); else layer(shotSting, t, t); stingLogo(t); return; }
  const w = WIPES.find(([a, b]) => t >= a && t < b);
  if (w) { const i = SCENES.findIndex(s => Math.abs(s[0] - w[1]) < .01); wipe(t, w[0], w[1], SCENES[i - 1][1], SCENES[i][1]); return; }
  if (t >= 39.75 && t < 40.0) {
    layer(RECAP, t, t);
    const k = eio(seg(t, 39.75, 40.0)), x = W - k * (W + 340);
    ctx.save(); ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(W + 340, 0); ctx.lineTo(W + 340, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); shotEnd(t); ctx.restore();
    ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 340, 0); ctx.lineTo(x + 380, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill(); return;
  }
  let fn = SCENES[0][1]; for (const [a, f] of SCENES) if (t >= a) fn = f;
  layer(fn, t, t);
}
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t); bug(t);
  if (t > 44.3) { ctx.fillStyle = `rgba(0,0,0,${seg(t, 44.3, 44.95)})`; ctx.fillRect(0, 0, W, H); }
}

// —— Événements sonores (exportés par events.mjs pour mix.py) ——
const EV = [
  { t: .04, type: 'swish' }, { t: .4, type: 'stab' }, { t: .9, type: 'glint' }, { t: 1.2, type: 'whoosh' },
  { t: 3.0, type: 'row' }, { t: 3.5, type: 'row' }, { t: 4.0, type: 'row' }, { t: 5.0, type: 'blip' }, { t: 5.7, type: 'whoosh' },
  { t: 6.0, type: 'hit' }, { t: 6.7, type: 'card' }, { t: 8.5, type: 'flap' }, { t: 8.62, type: 'flap' }, { t: 9.6, type: 'ding' },
  { t: 12.5, type: 'hit' }, ...[0, 1, 2, 3].map(i => ({ t: 13.0 + i * .35, type: 'grow' })), { t: 14.0, type: 'blip' },
  { t: 16.7, type: 'whoosh' }, { t: 17.0, type: 'hit' }, ...[0, 1, 2].map(i => ({ t: 18.0 + i * .5, type: 'grow' })), ...[0, 1, 2].map(i => ({ t: 20.6 + i * .3, type: 'tick' })),
  { t: 22.0, type: 'silence' }, { t: 22.5, type: 'stamp_big' },
  { t: 24.7, type: 'whoosh' }, { t: 25.0, type: 'hit' }, { t: 25.4, type: 'slam' },
  { t: 30.5, type: 'hit' }, ...[0, 1, 2].map(i => ({ t: 30.8 + i * .35, type: 'grow' })), { t: 32.0, type: 'quote' }, { t: 34.0, type: 'mark' }, { t: 33.3, type: 'stamp' },
  { t: 35.7, type: 'whoosh' }, ...[0, 1, 2].map(i => ({ t: 37.0 + i * .5, type: 'tick_ok', i })),
  { t: 39.75, type: 'whoosh' }, { t: 40.0, type: 'end' },
];
const VO_AT = { V1: 1.6, V2: 6.1, V3: 13.0, V4: 17.1, V5: 25.1, V6: 31.1, V7: 37.2 };
for (const id in VO_AT) EV.push({ t: VO_AT[id], type: 'vo', id });
window.VO_AT = VO_AT;
window.DUR = DUR; window.EV = EV; window.render = render; window.TEXTS = t => { render(t); return TX; };
(async () => {
  makeGrain();
  if (PHOTO) { try { IM.hall = await loadImg(PHOTO); } catch (e) { IM.hall = null; } }
  if (IM.hall) CREDIT_LINES.push('Photo d’illustration : « Lisbon Web Summit 2017 », Carlos Rodrigues / Web Summit, CC BY 2.0, via Wikimedia Commons (duotone, floutée)');
  await Promise.all([F.b8(40), F.b6(40), F.b6i(40), F.mono(40)].map(f => document.fonts.load(f, 'Aa é %')));
  render(0); window.READY = true;
})();
