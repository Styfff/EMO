// 27 · Zootrope — jouet de foire : 24 poses d'une lettre qui saute ; à une case par image, le plateau semble immobile et la lettre s'anime
import { THREE, word, paint, matte, rig, pchip, timeTable, makeCam, orbit, ss, cast, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.6; scene.background = bgRadial("#274a52", "#12262b", "#060d0f");
  rig(scene, { key: 2.8, pos: [-4, 9, 7], amb: 0.6, size: 7, color: 0xfff0d6 });
  const NST = 24, RP = 3.1, STEP = (2 * Math.PI) / NST, OM = 2 * Math.PI * 30 / NST, V = (t) => ss(0.3, 1.8, t) * (1 - ss(5.0, 5.9, t)), I = timeTable(V, 6), KK = 3 - I(3), DELTA = (OM * KK) % STEP;
  const RED = 0xd7263d, CREAM = 0xfff1d0, TEAL = 0x1b998b, gold = new THREE.MeshStandardMaterial({ color: 0xe0b040, metalness: 1, roughness: 0.25 }), plate = new THREE.Group(); scene.add(plate);
  const disc = cast(new THREE.Mesh(new THREE.CylinderGeometry(RP + 0.45, RP + 0.45, 0.16, 96), paint(CREAM, { roughness: 0.35 }))); disc.position.y = -0.08; plate.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(RP + 0.45, 0.07, 12, 96), gold); rim.rotation.x = Math.PI / 2; plate.add(rim);
  const Z = word(mot(27, "ZOOTROPE").replace(/ /g, "")[0], { font: "rock", cap: 0.72, depth: 0.22, bevel: 0.02, pivot: "base" }).letters[0].geo, zm = paint(RED, { roughness: 0.3 }), pm = paint(TEAL, { roughness: 0.4 });
  for (let k = 0; k < NST; k++) { const ph = k / NST, a = k * STEP, hop = ph < 0.5 ? ph * 2 : ph * 2 - 1, big = ph >= 0.5, y = (big ? 1.25 : 0.7) * 4 * hop * (1 - hop), sq = 1 - 0.3 * Math.exp(-Math.min(hop, 1 - hop) / 0.06);
    const st = new THREE.Group(); st.position.set(Math.sin(a) * RP, 0, Math.cos(a) * RP); st.rotation.y = a; plate.add(st);
    const ped = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.1, 24), pm)); ped.position.y = 0.05; st.add(ped);
    const piv = new THREE.Group(); piv.position.y = 0.1 + y + 0.36 * sq; st.add(piv); const m = cast(new THREE.Mesh(Z, zm)); m.position.y = -0.36; piv.add(m); piv.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); if (big) piv.rotation.x = -hop * Math.PI * 2; }
  const pole = cast(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.4, 24), gold)); pole.position.y = 1.7; plate.add(pole); const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16), gold); ball.position.y = 3.5; plate.add(ball);
  const base = cast(new THREE.Mesh(new THREE.CylinderGeometry(RP + 0.75, RP + 0.95, 0.6, 96), paint(RED, { roughness: 0.4 }))); base.position.y = -0.46; scene.add(base);
  const lab = word(mot(27, "ZOOTROPE"), { font: "rock", cap: 0.34, depth: 0.05, bevel: 0.008, track: 0.12 }), RB = RP + 0.87, lm = paint(CREAM, { roughness: 0.4 });
  for (const l of lab.letters) { const a = l.x / RB, m = new THREE.Mesh(l.geo, lm); m.position.set(Math.sin(a) * RB, -0.46, Math.cos(a) * RB); m.rotation.y = a; scene.add(m); }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), matte(0x10252a, { roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.76; floor.receiveShadow = true; scene.add(floor);
  const EL = pchip([[0, 40], [2.4, 28], [6, 15]]), DS = pchip([[0, 20], [3, 18], [6, 16.8]]), AZ = pchip([[0, -8], [6, 8]]);
  return { n: 27, title: "Zootrope", style: "Rétro (jouet de foire)", font: "Zilla Slab Bold", cam: "de haut, descend à hauteur des figures", geste: "le plateau accélère jusqu'à une case par image : la lettre s'anime", scene, camera, accent: "#e0b040", bloom: [0.2, 0.5, 1.1], shutter: (t) => (t > 1.82 && t < 4.98 ? 0.03 : 0.5),
    render(t) { plate.rotation.y = -OM * I(t) + DELTA; orbit(camera, { az: AZ(t), el: EL(t), dist: DS(t), target: [0, 0.75, 0] }); } };
}
