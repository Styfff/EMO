// 23 · Tube qui écrit — bonbon : des tubes laqués tracent les contours de chaque lettre, pointe lumineuse, puis la lettre se remplit derrière
import { THREE, word, wordContours, paint, matte, rig, pchip, makeCam, fitDist, orbit, clamp, eo, cast , mot , at } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), BG = 0xfff1dc; scene.environment = K.env; scene.environmentIntensity = 0.7; scene.background = new THREE.Color(BG);
  rig(scene, { key: 2.4, pos: [-4, 6, 9], amb: 0.95, size: 7, soft: 6, ground: 0xffd9b0 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), matte(BG, { roughness: 0.95 })); wall.position.z = -0.1; wall.receiveShadow = true; scene.add(wall);
  const TXT = mot(23, "TRACE"), CAP = 1.3, OPT = { font: "gill", cap: CAP, track: 0.06 }, C = wordContours(TXT, { ...OPT, step: 0.03 }), PAL = [0xff3d7f, 0xffb21a, 0x18c7ae, 0x7a4dff, 0xff3d7f], T0 = 0.35, GAP = 0.6, DUR = 1.25, tubes = [];
  for (const c of C) { const curve = new THREE.CatmullRomCurve3(c.pts.map((p) => new THREE.Vector3(p[0], p[1], 0)), true, "centripetal"), seg = c.pts.length, RS = 12, geo = new THREE.TubeGeometry(curve, seg, 0.062, RS, true);
    const m = cast(new THREE.Mesh(geo, paint(PAL[c.li % PAL.length], { roughness: 0.18 }))); m.position.z = 0.07; scene.add(m);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 2.0) })); scene.add(tip); tubes.push({ m, geo, seg, RS, c, tip }); }
  const w = word(TXT, { ...OPT, depth: 0.22, bevel: 0, back: true }), fills = w.letters.map((l) => { const m = cast(new THREE.Mesh(l.geo, paint(PAL[l.i % PAL.length], { roughness: 0.45, clearcoat: 0.3 }))); m.position.set(l.x, 0, -0.1); m.scale.z = 0.001; scene.add(m); return m; });
  const LXs = w.letters.map((l) => l.x), D0 = fitDist(C.width, 30, 0.84), TX = pchip([[0, LXs[0]], [0.9, LXs[0]], [1.5, at(LXs, 1)], [2.1, at(LXs, 2)], [2.7, at(LXs, 3)], [3.6, 0.3], [4.6, 0], [6, 0]]), DK = pchip([[0, 0.42], [2.7, 0.5], [4.3, 1], [6, 0.96]]), AZ = pchip([[0, -24], [3, -12], [4.6, 0], [6, 6]]), EL = pchip([[0, 8], [6, 2]]);
  return { n: 23, title: "Tube qui écrit", style: "Bonbon (tubes laqués)", font: "Rubik Black", cam: "suit la pointe de lettre en lettre, puis recule", geste: "des tubes tracent chaque contour, puis la lettre se remplit", scene, camera, light: true, accent: "#ff3d7f", bloom: [0.25, 0.5, 1.2], vig: 0.14, tone: "neutral",
    render(t) {
      for (const q of tubes) { const p = clamp((t - T0 - q.c.li * GAP) / DUR), e = p * p * (3 - 2 * p), n = Math.floor(e * q.seg); q.geo.setDrawRange(0, n * q.RS * 6); const pt = q.c.pts[Math.min(q.seg - 1, n) % q.seg]; q.tip.position.set(pt[0], pt[1], 0.07); q.tip.visible = p > 0 && p < 1; }
      fills.forEach((m, i) => { m.scale.z = Math.max(0.001, eo((t - T0 - i * GAP - DUR * 0.9) / 0.7)); m.visible = m.scale.z > 0.002; });
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [TX(t), 0, 0] });
    } };
}
