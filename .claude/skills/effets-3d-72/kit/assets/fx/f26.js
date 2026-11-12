// 26 · Mise en abyme — op art : le O du mot contient le mot, qui contient le mot… zoom de deux niveaux, sans coupe
import { THREE, FONTS, word, glyphShapes, paint, matte, rig, pchip, makeCam, fitDist, orbit , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), YEL = 0xffd400, BLK = 0x0c0c0c; scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = new THREE.Color(BLK);
  rig(scene, { key: 2.6, pos: [-4, 7, 9], amb: 0.7, size: 8 });
  const FONT = "futura", CAP = 1, TRY = mot(26, "ZOOM"), HOLE = (s) => [...s].findIndex((c) => c !== " " && glyphShapes(FONT, c).some((g) => g.holes.length)), TXT = HOLE(TRY) >= 0 ? TRY : "ZOOM", w = word(TXT, { font: FONT, cap: CAP, depth: 0.3, bevel: 0.02 }), k = CAP / FONTS[FONT].cap, O = w.letters.find((l) => glyphShapes(FONT, l.ch).some((g) => g.holes.length)), hp = glyphShapes(FONT, O.ch).find((g) => g.holes.length).holes[0].getPoints(24);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of hp) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
  const cO = new THREE.Vector3(O.x + ((x0 + x1) / 2) * k - O.w / 2, ((y0 + y1) / 2) * k - CAP / 2, 0), rH = ((x1 - x0) / 2) * k, S = (0.74 * 2 * rH) / w.width, F = cO.clone().multiplyScalar(1 / (1 - S));
  const root = new THREE.Group(), levels = [], mat = [paint(YEL, { roughness: 0.3 }), paint(0x161616, { roughness: 0.3 })], dm = [matte(BLK), matte(YEL)]; scene.add(root);
  for (let i = -1; i <= 4; i++) { const g = new THREE.Group(), sc = Math.pow(S, i), par = ((i % 2) + 2) % 2; g.scale.setScalar(sc); g.position.copy(F).multiplyScalar(1 - sc);
    for (const l of w.letters) { const m = new THREE.Mesh(l.geo, mat[par]); m.position.x = l.x; m.castShadow = true; g.add(m); }
    const disc = new THREE.Mesh(new THREE.CircleGeometry((rH / S) * 0.985, 96), dm[par]); disc.position.z = -0.2; disc.receiveShadow = true; g.add(disc); root.add(g); levels.push({ g, i }); }
  const D0 = fitDist(w.width, 30, 0.8), UU = pchip([[0, 0], [0.7, 0.03], [5.1, 1.97], [6, 2]]), AZ = pchip([[0, -9], [3, 7], [6, -4]]);
  return { n: 26, title: "Mise en abyme", style: "Op art (jaune et noir)", font: "Jost Bold", cam: "fixe : c'est le monde qui grandit autour du point fixe", geste: "le O contient le mot, qui contient le mot : zoom de deux niveaux", scene, camera, accent: "#ffd400", bloom: [0.08, 0.4, 1.3], tone: "neutral",
    render(t) {
      const u = UU(t), Z = Math.pow(S, -u); root.scale.setScalar(Z); root.position.copy(F).multiplyScalar(1 - Z);
      for (const q of levels) { const s = Math.pow(S, q.i - u); q.g.visible = s > 0.0006 && s < 40; }
      orbit(camera, { az: AZ(t), el: 3, dist: D0, target: [0, 0, 0] });
    } };
}
