// 1 · Plat → profondeur — affiche suisse : 6 calques épais, travelling compensé, passage sur la tranche
import { THREE, word, rig, pchip, makeCam, ss, eio, lerp, rad, cast, orbit, bgRadial, backOut , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(8); scene.environment = K.env; scene.background = bgRadial("#8d9096", "#4c4e53", "#232427");
  const L = rig(scene, { key: 0, pos: [-6, 7, 10], amb: 0, size: 5 }), RED = 0xe30613, INK = 0x141414, PAPER = 0xefe9dc, mats = [], layers = [];
  const flat = (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: c, emissiveIntensity: 1 }); mats.push(m); return m; };
  const ext = (shape, d = 0.045) => new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false, curveSegments: 72 });
  const rect = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.closePath(); return s; };
  const add = (geo, mat, k, x = 0, y = 0, rz = 0) => { const m = cast(new THREE.Mesh(geo, mat)); m.position.set(x, y, 0); m.rotation.z = rz; m.userData.k = k; scene.add(m); layers.push(m); return m; };
  add(ext(rect(4, 5)), flat(PAPER), 0);
  const disc = new THREE.Shape(); disc.absarc(0, 0, 1.42, 0, Math.PI * 2); add(ext(disc), flat(RED), 1, 0.5, 0.85);
  const inkM = flat(INK), redM = flat(RED), papM = flat(PAPER);
  for (let i = 0; i < 8; i++) add(ext(rect(0.07, 1.25)), inkM, 2, -1.62 + i * 0.17, -1.72, rad(-32));
  const w = word(mot(1, "RELIEF"), { font: "helv", cap: 1, depth: 0.3, bevel: 0.012, back: true }), sc = 3.55 / w.width;
  for (const l of w.letters) { const m = add(l.geo, inkM, 3, l.x * sc, -0.3); m.scale.setScalar(sc); }
  const s1 = word("PROFONDEUR", { font: "helv", cap: 0.2, depth: 0.03, bevel: 0, back: true, track: 0.12 }); for (const l of s1.letters) add(l.geo, redM, 4, 1.72 - s1.width / 2 + l.x, -1.52);
  const s2 = word("SIX CALQUES · UN TRAVELLING", { font: "helv", cap: 0.085, depth: 0.03, bevel: 0, back: true, track: 0.2 }); for (const l of s2.letters) add(l.geo, inkM, 4, 1.72 - s2.width / 2 + l.x, -1.78);
  add(ext(rect(2.1, 0.03)), inkM, 4, 0.67, -1.98); const n1 = word("01", { font: "helv", cap: 0.5, depth: 0.03, bevel: 0, back: true }); for (const l of n1.letters) add(l.geo, inkM, 4, -1.35 + l.x, 1.72);
  const fr = rect(3.76, 4.76), hole = new THREE.Path(); hole.moveTo(-1.85, -2.35); hole.lineTo(-1.85, 2.35); hole.lineTo(1.85, 2.35); hole.lineTo(1.85, -2.35); hole.closePath(); fr.holes.push(hole); add(ext(fr, 0.03), inkM, 5);
  for (const [x, y] of [[-1.6, 2.1], [1.6, -2.1]]) { add(ext(rect(0.3, 0.03), 0.03), redM, 5, x, y); add(ext(rect(0.03, 0.3), 0.03), redM, 5, x, y); }
  const AZ = pchip([[0, 0], [0.8, 0], [3.1, -66], [5.0, 22], [6, 30]]), EL = pchip([[0, 0], [0.8, 0], [3.1, 6], [5, 12], [6, 9]]);
  return { n: 1, title: "Plat → profondeur", style: "Swiss design", font: "Oswald Bold", cam: "téléobjectif de face, travelling compensé, passage sur la tranche", geste: "l'affiche devient six calques qui s'écartent", scene, camera, accent: "#ff3b30", bloom: [0.12, 0.5, 1.2], tone: "neutral",
    render(t) {
      const u = ss(0.6, 2.0, t), s = lerp(0, 0.72, eio((t - 0.9) / 2.4));
      for (const m of layers) { const k = m.userData.k; m.position.z = k * 0.004 + k * 0.72 * backOut((t - 0.85 - (5 - k) * 0.13) / 1.2, 1.9); }
      for (const m of mats) m.emissiveIntensity = 1 - 0.94 * u;
      L.key.intensity = 3.3 * u; L.hemi.intensity = 0.55 * u; scene.environmentIntensity = 0.35 * u;
      const fov = lerp(8, 36, eio((t - 0.8) / 2.6)), view = (5 / 0.7) * (1 + 0.3 * ss(1.0, 3.2, t) - 0.1 * ss(3.4, 5.4, t));
      camera.fov = fov; camera.updateProjectionMatrix(); orbit(camera, { az: AZ(t), el: EL(t), dist: view / (2 * Math.tan(rad(fov) / 2)), target: [0, 0.3, 2.5 * s] });
    } };
}
