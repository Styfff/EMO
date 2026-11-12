// 6 · Gel orbital — pop art : le mot éclate en 16 000 gouttes de peinture, gel, tour complet, puis le temps repart en arrière
import { THREE, word, maskPoints, gpuInst, paint, pchip, timeTable, makeCam, fitDist, orbit, ss, mulberry, bg , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.7;
  scene.background = bg((g, w, h) => { g.fillStyle = "#ffd400"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2a900"; for (let y = 0; y < h; y += 14) for (let x = (y / 14) % 2 * 7; x < w; x += 14) { const d = Math.hypot(x - w / 2, y - h * 0.55) / h; g.beginPath(); g.arc(x, y, 1 + 5.5 * Math.min(1, d * 1.5), 0, 7); g.fill(); } }, 864, 1080);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe9a0, 1.5)); const dl = new THREE.DirectionalLight(0xffffff, 2.6); dl.position.set(-4, 8, 8); scene.add(dl);
  const RED = 0xff2a2a, BLUE = 0x1b4dff, INK = 0x111111, COLS = [RED, BLUE, RED, BLUE];
  const TP0 = timeTable((t) => 1 - (1 - 0.012) * ss(1.36, 1.6, t) * (1 - ss(4.3, 4.6, t)) - 3.4 * ss(4.55, 4.9, t), 6), TP = (t) => Math.max(0.3, TP0(t));
  const CUT = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 99);
  const w = word(mot(6, "FIGÉ"), { font: "impact", cap: 1.5, depth: 0.5, bevel: 0.03 }), L = w.letters.map((l) => { const m = new THREE.Mesh(l.geo, [paint(COLS[l.i % COLS.length], { roughness: 0.25, clippingPlanes: [CUT], side: THREE.DoubleSide }), paint(INK, { roughness: 0.3, clippingPlanes: [CUT], side: THREE.DoubleSide })]); m.position.x = l.x; scene.add(m); return m; });
  const JETS = []; { const q = mulberry(77); for (let i = 0; i < 46; i++) JETS.push(new THREE.Vector3(q() - 0.5, (q() - 0.4) * 0.9, (q() - 0.3) * 0.9).normalize()); }
  const N = 16000, P = maskPoints(mot(6, "FIGÉ"), N, { font: "impact", width: w.width, depth: 0.5, seed: 4 }), r = mulberry(8), aO = new Float32Array(N * 3), aV = new Float32Array(N * 3), aD = new Float32Array(N * 2), col = new THREE.Color();
  const im = gpuInst(new THREE.IcosahedronGeometry(1, 1), paint(0xffffff, { roughness: 0.22 }), N, { aO: [3, aO], aV: [3, aV], aD: [2, aD] }, { uTp: { value: 0 } }, {
    decl: "attribute vec3 aO, aV; attribute vec2 aD; uniform float uTp;",
    pos: "float tau = max(0., uTp - aD.y), kk = 1.5, q = (1. - exp(-kk * tau)) / kk; transformed = transformed * (aD.x * sst(0., .05, tau)) + aO + aV * q + vec3(0., -5.5, 0.) * (tau - q) / kk;" });
  for (let i = 0; i < N; i++) { const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2]; aO.set([x, y, z], i * 3);
    const jet = r() < 0.38, J = JETS[(r() * JETS.length) | 0], d = jet ? J.clone().addScaledVector(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5), 0.09).normalize() : new THREE.Vector3(x * 0.55 + (r() - 0.5), y * 1.2 + (r() - 0.3), z * 2 + (r() - 0.35) * 1.6).normalize(), sp = jet ? 1.5 + r() * 12 : 0.7 + r() * r() * 7.5; aV.set([d.x * sp, d.y * sp, d.z * sp], i * 3);
    aD[i * 2] = 0.016 + r() * r() * r() * 0.085; aD[i * 2 + 1] = 0.9 + (w.width / 2 - x) / w.width * 1.15 + r() * 0.05;
    let li = 0, best = 1e9; w.letters.forEach((l, k) => { const dd = Math.abs(x - l.x); if (dd < best) { best = dd; li = k; } }); im.setColorAt(i, col.setHex(r() < 0.1 ? INK : r() < 0.06 ? 0xffffff : COLS[li % COLS.length])); }
  scene.add(im);
  const D0 = fitDist(w.width, 30, 0.7);
  const AZ = pchip([[0, -20], [1.36, -4], [1.66, 9], [4.3, 351], [4.6, 360], [6, 367]]), EL = pchip([[0, 6], [3, 14], [4.7, 6], [6, 3]]), DK = pchip([[0, 1.05], [1.4, 1.35], [4.4, 1.4], [6, 1]]);
  return { n: 6, title: "Gel orbital (bullet time)", style: "Pop art", font: "Anton", cam: "tour complet de 360° pendant le gel", geste: "le mot éclate de droite à gauche ; gel à mi-course, puis marche arrière", scene, camera, light: true, accent: "#e5121c", bloom: [0.1, 0.5, 1.3], vig: 0.2, tone: "neutral",
    render(t) {
      const tp = TP(t); im.U.uTp.value = tp;
      CUT.constant = tp < 0.9 ? 99 : w.width / 2 - (tp - 0.9) / 1.15 * w.width;
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.1, 0] });
    } };
}
