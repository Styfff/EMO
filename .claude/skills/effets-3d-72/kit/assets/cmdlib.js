// cmdlib.js — socle partagé des commandes motion (HyperFrames + Three.js 0.169)
// Tout est fonction de t. Aucun Math.random(), aucun fetch.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
export { THREE };

// ---------- maths ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const inv = (a, b, x) => clamp((x - a) / (b - a));
export const ss = (a, b, x) => { const u = inv(a, b, x); return u * u * (3 - 2 * u); };
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = (x) => 1 - Math.pow(1 - clamp(x), 4);
export const ei = (x) => Math.pow(clamp(x), 3);
export const sine = (x) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2;
export const backOut = (x, s = 1.6) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
export const springIO = (x) => { x = clamp(x); return eio(x) + Math.sin(Math.PI * x) * Math.sin(Math.PI * x * 2) * 0.06; };
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// stop-motion : quantifie le temps à fps images/s
export const stepT = (t, fps = 12) => Math.floor(t * fps) / fps;

// champ de courant lisse (somme de sinus) : potentiel psi et vitesse sans divergence (curl)
export function flowField(seed = 1, n = 6, scale = 1) {
  const r = mulberry(seed), K = [];
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, f = (0.8 + r() * 2.6) * scale; K.push({ kx: Math.cos(a) * f, ky: Math.sin(a) * f, p: r() * 6.283, w: (r() - 0.5) * 1.2, amp: 1 / (1 + i * 0.6) }); }
  return {
    // vitesse (vx, vy) au point (x, y) à l'instant t
    vel(x, y, t, out) { let vx = 0, vy = 0; for (const k of K) { const c = Math.cos(k.kx * x + k.ky * y + k.p + k.w * t) * k.amp; vx += c * k.ky; vy -= c * k.kx; } out[0] = vx; out[1] = vy; return out; },
    psi(x, y, t) { let s = 0; for (const k of K) s += Math.sin(k.kx * x + k.ky * y + k.p + k.w * t) * k.amp; return s; },
  };
}

// ---------- polices ----------
export async function fonts(list = ['700 80px "Inter"', '400 27px "JetBrains Mono"']) { for (const f of list) await document.fonts.load(f); }

// ---------- texte → masque → points ----------
// lines : tableau de lignes ; renvoie { mask (Float32 0..1), w, h, canvas }
export function textMask(lines, { font = '800 220px "Inter"', w = 1024, h = 512, lineH = 1.0, fill = 0.86, track = 0 } = {}) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, w, h);
  g.font = font; if (track) g.letterSpacing = track + "px";
  const size = parseFloat(font.match(/(\d+)px/)[1]);
  const widest = Math.max(...lines.map((l) => g.measureText(l).width));
  const k = Math.min((w * fill) / widest, (h * fill) / (size * lineH * lines.length));
  g.save(); g.translate(w / 2, h / 2); g.scale(k, k);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((l, i) => g.fillText(l, 0, (i - (lines.length - 1) / 2) * size * lineH));
  g.restore();
  const d = g.getImageData(0, 0, w, h).data, mask = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = d[i * 4] / 255;
  return { mask, w, h, canvas: c };
}
// n points tirés dans le masque, coordonnées centrées : x ∈ [-0.5, 0.5], y ∈ [-h/2w, h/2w]
export function samplePoints(m, n, seed = 1, thr = 0.5) {
  const r = mulberry(seed), pts = []; let tries = 0;
  while (pts.length < n && tries < n * 400) { tries++; const x = r() * m.w, y = r() * m.h; if (m.mask[(y | 0) * m.w + (x | 0)] > thr) pts.push([x / m.w - 0.5, (0.5 - y / m.h) * (m.h / m.w)]); }
  return pts;
}
// cellules d'une grille (pas en px du masque) couvertes par le texte
export function sampleCells(m, step, thr = 0.5) {
  const out = [];
  for (let y = step / 2; y < m.h; y += step) for (let x = step / 2; x < m.w; x += step) if (m.mask[(y | 0) * m.w + (x | 0)] > thr) out.push([x / m.w - 0.5, (0.5 - y / m.h) * (m.h / m.w)]);
  return out;
}

// ---------- canvas → texture ----------
export function canvasTex(size, draw, { h = size, srgb = true } = {}) {
  const c = document.createElement("canvas"); c.width = size; c.height = h;
  draw(c.getContext("2d"), size, h);
  const tx = new THREE.CanvasTexture(c); if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}

// ---------- rendu 3D ----------
export function stage({ W = 1080, H = 1350, canvasId = "scene", pr = 1.5, fov = 30, exposure = 1.0, env = 0.55, shadows = true, tone = THREE.ACESFilmicToneMapping, clear = null } = {}) {
  const canvas = document.getElementById(canvasId);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: clear === null, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  if (clear === null) renderer.setClearColor(0x000000, 0); else renderer.setClearColor(clear, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = tone; renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = env;
  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.05, 400);
  return { renderer, scene, camera, W, H };
}
export function studioLights(scene, { key = 3.0, rim = 2.2, hemi = 0.35, keyPos = [-2, 12, 3], rimPos = [5, 3, -6], box = 5, keyColor = 0xffe2c0, rimColor = 0x9fc4ff } = {}) {
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x111111, hemi));
  const k = new THREE.DirectionalLight(keyColor, key); k.position.set(...keyPos); k.castShadow = true;
  k.shadow.mapSize.set(2048, 2048); Object.assign(k.shadow.camera, { left: -box, right: box, top: box, bottom: -box, near: 0.5, far: 60 });
  k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02; scene.add(k);
  const r = new THREE.DirectionalLight(rimColor, rim); r.position.set(...rimPos); scene.add(r);
  return { key: k, rim: r };
}
export function floor(scene, y = 0, { shadow = 0.28, grid = true, size = 40 } = {}) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity: shadow }));
  f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true; scene.add(f);
  let gr = null;
  if (grid) { gr = new THREE.GridHelper(size * 0.75, size * 1.5, 0x2a3038, 0x1b2026); gr.position.y = y + 0.001; gr.material.transparent = true; gr.material.opacity = 0.55; scene.add(gr); }
  return { floor: f, grid: gr };
}
export const shadowy = (m) => { m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; };
// caméra en orbite : azimut/élévation en degrés, distance, cible
export function orbit(camera, { az = 0, el = 25, dist = 10, target = [0, 0, 0] }) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  camera.position.set(target[0] + Math.sin(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(a) * Math.cos(e) * dist);
  camera.lookAt(...target); camera.updateMatrixWorld();
}
const _v = new THREE.Vector3();
export function toScreen(p, camera, W = 1080, H = 1350) { _v.copy(p).project(camera); return { x: (_v.x * 0.5 + 0.5) * W, y: (-_v.y * 0.5 + 0.5) * H, z: _v.z }; }

// ---------- légendes (trait coudé + « 0N Nom ») ----------
const SVGNS = "http://www.w3.org/2000/svg";
export function makeLabels(items, { svg = "#wires", box = "#labels", colX = 652, L0 = 3.2, step = 0.17, minGap = 54, side = "right", lineColor = "#c9ced6", accent = "#ff6a1a" } = {}) {
  const S = document.querySelector(svg), B = document.querySelector(box);
  const L = items.map((it, i) => {
    const pl = document.createElementNS(SVGNS, "polyline"); pl.setAttribute("fill", "none"); pl.setAttribute("stroke", it.hero ? accent : lineColor); pl.setAttribute("stroke-width", "1.6");
    const dot = document.createElementNS(SVGNS, "circle"); dot.setAttribute("r", "5.5"); dot.setAttribute("fill", "none"); dot.setAttribute("stroke", it.hero ? accent : "#e8eaee"); dot.setAttribute("stroke-width", "1.8");
    S.append(pl, dot);
    const el = document.createElement("div"); el.className = "lbl" + (it.hero ? " hero" : "") + (side === "left" ? " left" : "");
    el.innerHTML = `<b>${it.num ?? String(i + 1).padStart(2, "0")}</b><span>${it.name}</span>`; B.append(el);
    return { pl, dot, el, it };
  });
  return {
    // anchors : [{x,y}] en px ; t : temps ; starts optionnels par légende
    update(anchors, t, starts) {
      const rows = anchors.map((a) => a.y);
      for (let i = 1; i < rows.length; i++) rows[i] = Math.max(rows[i], rows[i - 1] + minGap);
      L.forEach((l, i) => {
        const a = anchors[i], ty = rows[i], s = t - (starts ? starts[i] : L0 + i * step);
        const draw = eo(s / 0.32), txt = eo((s - 0.22) / 0.3);
        const dir = side === "left" ? -1 : 1, ex = colX - 26 * dir;
        const elbowX = dir > 0 ? Math.max(a.x + 30, ex - 70) : Math.min(a.x - 30, ex + 70);
        const p0 = [a.x, a.y], p1 = [elbowX, ty];
        const s0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), s1 = Math.abs(ex - elbowX), d = draw * (s0 + s1);
        let path;
        if (d <= s0) { const f = s0 ? d / s0 : 1; path = [p0, [lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f)]]; }
        else path = [p0, p1, [elbowX + dir * (d - s0), ty]];
        l.pl.setAttribute("points", path.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" "));
        l.pl.setAttribute("opacity", draw > 0 ? 1 : 0);
        l.dot.setAttribute("cx", a.x.toFixed(1)); l.dot.setAttribute("cy", a.y.toFixed(1)); l.dot.setAttribute("opacity", clamp(s / 0.12));
        const tx = side === "left" ? colX - l.el.offsetWidth : colX;
        l.el.style.transform = `translate(${tx + (1 - txt) * 18 * dir}px, ${ty - 20}px)`; l.el.style.opacity = txt;
      });
    },
  };
}

// ---------- horloge HyperFrames ----------
// render(t) est appelé à chaque image ; extra(tl) ajoute les tweens GSAP du titre, etc.
export function run(DUR, render, extra) {
  const clock = { t: 0 };
  const tl = gsap.timeline({ paused: true });
  tl.fromTo(clock, { t: 0 }, { t: DUR, duration: DUR, ease: "none", onUpdate: () => render(clock.t) }, 0);
  if (extra) extra(tl);
  window.__timelines = window.__timelines || {}; window.__timelines["main"] = tl;
  tl.seek(0); render(0);
  return tl;
}
// titre standard : #t1, #t2, #sub
export function titleIn(tl, at = 0.1) {
  ["#t1", "#t2"].forEach((s, i) => { if (document.querySelector(s)) tl.fromTo(s, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, at + i * 0.12); });
  if (document.querySelector("#sub")) tl.fromTo("#sub", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, at + 0.4);
}
