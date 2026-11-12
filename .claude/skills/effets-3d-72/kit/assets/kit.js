// kit.js v3 — socle des effets (tout est fonction de t ; particules calculées dans les shaders)
import * as THREE from "three";
import { FONTS } from "./glyphs.js";
import { CONFIG } from "./config.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
export { THREE, FONTS };
export { CONFIG };
// caractères disponibles dans les 21 polices : le mot de l'utilisateur est passé en majuscules et filtré
export const SAFE = new Set(Object.values(FONTS).map((f) => Object.keys(f.g)).reduce((a, b) => a.filter((c) => b.includes(c))));
const clean = (v) => [...String(v).toUpperCase().normalize("NFC")].filter((c) => SAFE.has(c)).join("").trim();
// mot(n, défaut) : le mot choisi pour l'effet n, sinon celui d'origine
export function mot(n, def) { const v = CONFIG.mots && CONFIG.mots[n]; const s = v ? clean(String(v).split("|").pop()) : ""; return s || def; }
// mots(n, [défauts]) : effets à plusieurs mots ; "A|B" remplace dans l'ordre, un seul mot remplace le dernier
export function mots(n, defs) { const v = CONFIG.mots && CONFIG.mots[n]; if (!v) return defs; const p = String(v).split("|").map(clean).filter(Boolean); if (!p.length) return defs; const out = defs.slice(); const k = Math.min(p.length, defs.length); for (let i = 0; i < k; i++) out[defs.length - k + i] = p[p.length - k + i]; return out; }
// lignes(n, [défauts]) : texte sur plusieurs lignes ; "A|B" = deux lignes
export function lignes(n, defs) { const v = CONFIG.mots && CONFIG.mots[n]; if (!v) return defs; const p = String(v).split("|").map(clean).filter(Boolean); return p.length ? p : defs; }
export const at = (a, i) => a[Math.max(0, Math.min(a.length - 1, i))];
export const ASPECT = 0.8, rad = THREE.MathUtils.degToRad;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, x) => a + (b - a) * x;
export const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eo = (x) => 1 - Math.pow(1 - clamp(x), 4);
export const ei = (x) => Math.pow(clamp(x), 3);
export const backOut = (x, s = 1.6) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
export const mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- lettres vectorielles ----------
const _sh = {}, _p2 = {};
export function glyphShapes(font, ch) {
  const k = font + ch; if (_sh[k]) return _sh[k];
  const F = FONTS[font], g = F.g[ch]; if (!g) throw new Error("glyphe absent : " + font + " " + ch);
  const sp = new THREE.ShapePath();
  for (const c of g.c) { if (c[0] === "M") sp.moveTo(c[1], c[2]); else if (c[0] === "L") sp.lineTo(c[1], c[2]); else if (c[0] === "Q") sp.quadraticCurveTo(c[1], c[2], c[3], c[4]); else if (c[0] === "C") sp.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]); }
  return (_sh[k] = sp.toShapes(F.ccw));
}
export function glyphPath(font, ch) {
  const k = font + ch; if (_p2[k]) return _p2[k];
  const p = new Path2D();
  for (const c of FONTS[font].g[ch].c) { if (c[0] === "M") p.moveTo(c[1], c[2]); else if (c[0] === "L") p.lineTo(c[1], c[2]); else if (c[0] === "Q") p.quadraticCurveTo(c[1], c[2], c[3], c[4]); else if (c[0] === "C") p.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]); else p.closePath(); }
  return (_p2[k] = p);
}
export function measure(text, font, cap = 1, track = 0.04) { const F = FONTS[font], k = cap / F.cap; let w = 0; for (const ch of text) w += F.g[ch].adv * k + track * cap; return w - track * cap; }
// dessine un texte dans un canvas 2D : (x, y) = centre/ligne de pied ; cap = hauteur de capitale en px
export function drawText(g, text, { font = "avenir", cap = 100, x = 0, y = 0, align = "center", track = 0.04, fill = "#fff", stroke = null, lw = 0 } = {}) {
  const F = FONTS[font], k = cap / F.cap, w = measure(text, font, cap, track); let pen = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  for (const ch of text) { const p = glyphPath(font, ch); g.save(); g.translate(pen, y); g.scale(k, -k); if (fill) { g.fillStyle = fill; g.fill(p, "nonzero"); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw / k; g.lineJoin = "round"; g.stroke(p); } g.restore(); pen += F.g[ch].adv * k + track * cap; }
  return w;
}
export function word(text, { font = "avenir", cap = 1, depth = 0.3, bevel = 0.02, track = 0.04, curve = 10, pivot = "center", back = false, flat = false, crease = 40, bevelSeg = 3 } = {}) {
  const F = FONTS[font], k = cap / F.cap, out = []; let pen = 0;
  for (const ch of text) {
    const adv = F.g[ch].adv * k;
    if (ch !== " ") {
      const shapes = glyphShapes(font, ch); let geo;
      if (flat) geo = new THREE.ShapeGeometry(shapes, curve);
      else geo = new THREE.ExtrudeGeometry(shapes, { depth: depth / k, bevelEnabled: bevel > 0, bevelThickness: bevel / k, bevelSize: bevel / k, bevelSegments: bevelSeg, curveSegments: curve });
      geo.scale(k, k, k); geo.translate(-adv / 2, pivot === "base" ? 0 : -cap / 2, flat ? 0 : back ? bevel : -depth / 2);
      if (!flat) geo = toCreasedNormals(geo, rad(crease));
      geo.computeBoundingBox(); out.push({ ch, i: out.length, geo, x: pen + adv / 2, w: adv });
    }
    pen += adv + track * cap;
  }
  const W = pen - track * cap; for (const l of out) l.x -= W / 2; return { letters: out, width: W };
}
// masque d'un texte (une ou plusieurs lignes) : canvas + conversion px → monde (mot centré, largeur `width`)
export function textMask(lines, { font = "avenir", width = 6, res = 1400, track = 0.04, lineGap = 0.32, pad = 0.06, blur = 0 } = {}) {
  if (typeof lines === "string") lines = [lines];
  const wmax = Math.max(...lines.map((l) => measure(l, font, 1, track))), cap = (res * (1 - 2 * pad)) / wmax, lh = cap * (1 + lineGap), H = Math.ceil(lines.length * lh - cap * lineGap + 2 * pad * res + cap * 0.45);
  const c = document.createElement("canvas"); c.width = res; c.height = H; const g = c.getContext("2d");
  if (blur) g.filter = `blur(${blur}px)`;
  lines.forEach((l, i) => drawText(g, l, { font, cap, x: res / 2, y: pad * res + cap * 1.3 + i * lh - cap * 0.05, track }));
  const d = g.getImageData(0, 0, res, H).data, s = width / (res * (1 - 2 * pad)) ;
  return { canvas: c, w: res, h: H, data: d, scale: s, W: res * s, Hh: H * s, at: (px, py) => d[(py * res + px) * 4] };
}
// n points tirés dans le texte → Float32Array xyz (z au hasard dans ±depth/2)
export function maskPoints(lines, n, o = {}) {
  const m = textMask(lines, o), r = mulberry(o.seed || 1), out = new Float32Array(n * 3), depth = o.depth || 0; let i = 0, guard = 0;
  while (i < n && guard++ < n * 600) { const x = r() * m.w, y = r() * m.h; if (m.at(x | 0, y | 0) > 128) { out[i * 3] = (x - m.w / 2) * m.scale; out[i * 3 + 1] = (m.h / 2 - y) * m.scale; out[i * 3 + 2] = (r() - 0.5) * depth; i++; } }
  out.height = m.Hh; return out;
}
// le texte en lignes de balayage : rows rangées de segments [x0, x1] (pour tranches, couches d'impression)
export function scanRuns(text, { font = "avenir", width = 6, rows = 60, res = 1800, track = 0.04 } = {}) {
  const m = textMask(text, { font, width, res, track, pad: 0.01, lineGap: 0 }); let top = m.h, bot = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x += 3) if (m.at(x, y) > 128) { top = Math.min(top, y); bot = Math.max(bot, y); }
  const rh = (bot - top + 1) / rows, runs = [];
  for (let r = 0; r < rows; r++) { const y = Math.min(m.h - 1, Math.round(top + (r + 0.5) * rh)); let x0 = -1;
    for (let x = 0; x <= m.w; x++) { const on = x < m.w && m.at(x, y) > 128; if (on && x0 < 0) x0 = x; if (!on && x0 >= 0) { if (x - x0 > 2) runs.push({ r: rows - 1 - r, x0: (x0 - m.w / 2) * m.scale, x1: (x - m.w / 2) * m.scale }); x0 = -1; } } }
  return { runs, rows, rowH: rh * m.scale, height: (bot - top + 1) * m.scale };
}
// contours d'un mot, rééchantillonnés à pas constant : [{ li (lettre), pts [[x, y]…], len }] (mot centré, capitale centrée sur y = 0)
function resample(pts, step) {
  const P = pts.slice(); P.push(pts[0]); const seg = []; let L = 0; for (let i = 0; i < P.length - 1; i++) { const d = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push(d); L += d; }
  const n = Math.max(8, Math.round(L / step)), out = []; let i = 0, acc = 0;
  for (let k = 0; k < n; k++) { const s = (k / n) * L; while (i < seg.length - 1 && (acc + seg[i] < s || seg[i] === 0)) { acc += seg[i]; i++; } const u = seg[i] ? (s - acc) / seg[i] : 0; out.push([lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u)]); }
  out.len = L; return out;
}
export function wordContours(text, { font = "avenir", cap = 1, track = 0.04, step = 0.05 } = {}) {
  const F = FONTS[font], k = cap / F.cap, W = measure(text, font, cap, track), out = []; let pen = -W / 2, li = 0;
  for (const ch of text) { const adv = F.g[ch].adv * k; if (ch !== " ") { for (const sh of glyphShapes(font, ch)) for (const path of [sh, ...sh.holes]) { const raw = path.getPoints(20).map((p) => [pen + p.x * k, p.y * k - cap / 2]); const r = resample(raw, step); out.push({ li, pts: r, len: r.len, hole: path !== sh }); } li++; } pen += adv + track * cap; }
  out.width = W; return out;
}
export const fitDist = (w, fov = 30, frac = 0.8) => w / (frac * ASPECT * 2 * Math.tan(rad(fov) / 2));

// ---------- matières, lumière ----------
export const paint = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.38, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18, ...o });
export const matte = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });
export const chrome = (o = {}) => new THREE.MeshStandardMaterial({ color: 0xeef0f2, metalness: 1, roughness: 0.06, ...o });
export function studioEnv(renderer, { top = 1.5, band = 0.035, floor = 0.22, tint = [1, 1, 1] } = {}) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: { uT: { value: new THREE.Vector3(...tint) } },
    vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `varying vec3 vP; uniform vec3 uT; void main(){ vec3 d = normalize(vP); float y = d.y;
      vec3 c = mix(vec3(${floor.toFixed(3)}), vec3(${band.toFixed(3)}), smoothstep(-.7, -.06, y)); c = mix(c, vec3(${top.toFixed(2)}), smoothstep(.12, .8, y));
      float a = atan(d.z, d.x); c += .5 * smoothstep(.55, 1., sin(a * 5.)) * smoothstep(-.6, -.2, y) * (1. - smoothstep(-.1, .05, y));
      gl_FragColor = vec4(c * uT, 1.); }` })));
  const box = (w, h, x, y, z, v) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v * tint[0], v * tint[1], v * tint[2]), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  box(26, 12, 0, 3, 30, 1.7); box(10, 16, -26, 8, 6, 2.6); box(8, 14, 24, 10, -8, 2.0); box(16, 5, 0, 26, 0, 3.0);
  const pm = new THREE.PMREMGenerator(renderer), tx = pm.fromScene(s, 0.02).texture; pm.dispose(); return tx;
}
export function rig(scene, { key = 2.4, pos = [4, 7, 6], amb = 0.35, size = 8, color = 0xffffff, map = 2048, sky = 0xffffff, ground = 0x1c2026, soft = 5 } = {}) {
  const k = new THREE.DirectionalLight(color, key); k.position.set(...pos); k.castShadow = true; k.shadow.mapSize.set(map, map);
  const c = k.shadow.camera; c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 0.5; c.far = 80;
  k.shadow.bias = -0.0004; k.shadow.normalBias = 0.02; k.shadow.radius = soft; scene.add(k, k.target);
  const h = new THREE.HemisphereLight(sky, ground, amb); scene.add(h); return { key: k, hemi: h };
}
export function shadowFloor(scene, y = 0, opacity = 0.38, size = 80) { const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity })); f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true; scene.add(f); return f; }
export const cast = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
export function makeCam(fov = 30) { return new THREE.PerspectiveCamera(fov, ASPECT, 0.05, 600); }
export function orbit(camera, { az = 0, el = 25, dist = 10, target = [0, 0, 0], roll = 0 }) {
  const a = rad(az), e = rad(el); camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.position.set(target[0] + Math.sin(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.cos(a) * Math.cos(e) * dist); camera.lookAt(...target); camera.updateMatrixWorld();
}
// fond : dégradé (linéaire vertical ou radial) et dessin libre, en texture de fond de scène
export function bg(draw, w = 432, h = 540) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export const bgRadial = (c0, c1, c2 = c1, cx = 0.5, cy = 0.55) => bg((g, w, h) => { const gr = g.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, h * 0.75); gr.addColorStop(0, c0); gr.addColorStop(0.6, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
export const bgLinear = (stops) => bg((g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => gr.addColorStop(p, c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
export function canvasTex(w, h, draw, { srgb = true } = {}) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// ---------- clés et temps ----------
export function pchip(keys) {
  const n = keys.length, x = keys.map((k) => k[0]), y = keys.map((k) => k[1]), h = [], d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) { h[i] = x[i + 1] - x[i]; d[i] = (y[i + 1] - y[i]) / h[i]; }
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) if (d[i - 1] * d[i] > 0) { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  return (t) => { if (t <= x[0]) return y[0]; if (t >= x[n - 1]) return y[n - 1]; let i = 0; while (t > x[i + 1]) i++;
    const u = (t - x[i]) / h[i], u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h[i] * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h[i] * m[i + 1]; };
}
export function timeTable(speed, dur) {
  const STEP = 1 / 600, N = Math.ceil(dur / STEP) + 2, T = new Float64Array(N);
  for (let i = 1; i < N; i++) T[i] = T[i - 1] + speed((i - 0.5) * STEP) * STEP;
  return (t) => { const f = clamp(t, 0, dur) / STEP, i = Math.floor(f); return lerp(T[i], T[Math.min(N - 1, i + 1)], f - i); };
}

// ---------- objets par milliers, animés dans le vertex shader ----------
export const GLSL = `
float h11(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
vec3 h31(float n){ return fract(sin(vec3(n * 127.1, n * 269.5 + 3.1, n * 419.2 + 7.7)) * 43758.5453); }
mat3 rotAx(vec3 a, float t){ float c = cos(t), s = sin(t), o = 1. - c; return mat3(o*a.x*a.x+c, o*a.x*a.y+a.z*s, o*a.z*a.x-a.y*s, o*a.x*a.y-a.z*s, o*a.y*a.y+c, o*a.y*a.z+a.x*s, o*a.z*a.x+a.y*s, o*a.y*a.z-a.x*s, o*a.z*a.z+c); }
float sst(float a, float b, float x){ float u = clamp((x - a) / (b - a), 0., 1.); return u * u * (3. - 2. * u); }
`;
export function gpuInst(geo, mat, n, attrs, uniforms, { decl = "", pos = "", nrm = "", frag = null } = {}) {
  const g = geo.clone(); for (const [k, [size, arr]] of Object.entries(attrs)) g.setAttribute(k, new THREE.InstancedBufferAttribute(arr, size));
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL + decl).replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n" + nrm).replace("#include <begin_vertex>", "#include <begin_vertex>\n" + pos);
    if (frag) sh.fragmentShader = frag(sh.fragmentShader); };
  const m = new THREE.InstancedMesh(g, mat, n), I = new THREE.Matrix4(); for (let i = 0; i < n; i++) m.setMatrixAt(i, I); m.frustumCulled = false; m.U = uniforms; return m;
}
// même principe sur un maillage simple (surface déformée dans le vertex shader)
export function inject(mat, uniforms, { decl = "", pos = "", nrm = "", fdecl = "", fcol = "" } = {}) {
  mat.onBeforeCompile = (sh) => { Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL + decl).replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n" + nrm).replace("#include <begin_vertex>", "#include <begin_vertex>\n" + pos);
    if (fdecl || fcol) sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\n" + fdecl).replace("#include <color_fragment>", "#include <color_fragment>\n" + fcol); };
  return mat;
}
export function gpuPoints(n, attrs, uniforms, vs, fs, { blending = THREE.AdditiveBlending, depthTest = true } = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  for (const [k, [size, arr]] of Object.entries(attrs)) g.setAttribute(k, new THREE.BufferAttribute(arr, size));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: GLSL + vs, fragmentShader: fs, transparent: true, depthWrite: false, depthTest, blending })); m.frustumCulled = false; return m;
}
export const rnd = (n, size, seed = 1, f = (r) => r()) => { const r = mulberry(seed), a = new Float32Array(n * size); for (let i = 0; i < a.length; i++) a[i] = f(r, i); return a; };
