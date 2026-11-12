// 24 · Monolithes vus du ciel — métaphysique : des blocs de 5 unités de haut, illisibles depuis la rue, forment le mot en plongée totale
import { THREE, word, matte, rig, pchip, makeCam, fitDist, orbit, cast, mulberry, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.25; scene.background = bgLinear([[0, "#12525c"], [0.55, "#2f8f8a"], [0.8, "#f0b26a"], [1, "#f6d58f"]]); scene.fog = new THREE.Fog(0xf0c27c, 30, 110);
  const Lg = rig(scene, { key: 3.4, pos: [-16, 9, 7], amb: 0.6, size: 24, map: 4096, soft: 2, color: 0xffd9a0, sky: 0x9fd0d0, ground: 0xd9a441 }); Lg.key.shadow.camera.far = 120;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), matte(0xd9a441, { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const H = 5, w = word(mot(24, "VERTIGE"), { font: "helv", cap: 2.5, depth: H, bevel: 0, back: true, track: 0.1 }), side = matte(0xe9dcc2, { roughness: 0.9 }), top = matte(0xdd3a1c, { roughness: 0.7 });
  for (const l of w.letters) { const m = cast(new THREE.Mesh(l.geo, [top, side])); m.rotation.x = -Math.PI / 2; m.position.set(l.x, 0, 0); scene.add(m); }
  const r = mulberry(5), NPp = 70, ppl = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.035, 0.11, 4, 8), matte(0x1b2a30), NPp), o = new THREE.Object3D(); ppl.castShadow = true;
  for (let i = 0; i < NPp; i++) { o.position.set((r() - 0.5) * 16, 0.09, 2.2 + r() * 7); o.updateMatrix(); ppl.setMatrixAt(i, o.matrix); } scene.add(ppl);
  const DT = fitDist(w.width, 30, 0.88);
  const AZ = pchip([[0, -42], [2.2, -22], [4.6, 0], [6, 0]]), EL = pchip([[0, 2.5], [1.6, 12], [3.4, 52], [4.9, 88.5], [6, 89.2]]), DS = pchip([[0, 9.5], [1.6, 13], [3.4, 20], [4.9, DT], [6, DT * 0.97]]), TY = pchip([[0, 1.4], [2, 3], [4.9, H], [6, H]]), TZ = pchip([[0, 1.5], [3, 0.5], [4.9, 0], [6, 0]]);
  return { n: 24, title: "Monolithes vus du ciel", style: "Surréalisme métaphysique", font: "Oswald Bold", cam: "de la rue, grue continue jusqu'à la plongée totale", geste: "sept blocs géants ne se lisent comme un mot que d'en haut", scene, camera, accent: "#ff7a45", bloom: [0.12, 0.5, 1.2],
    render(t) { orbit(camera, { az: AZ(t), el: EL(t), dist: DS(t), target: [0, TY(t), TZ(t)] }); } };
}
