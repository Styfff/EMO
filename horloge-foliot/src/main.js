// Horloge à foliot, éclatée — render(t) draws one frame; everything is a function of t.
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { makePost } from '/core/three/post.js';
import { clamp, lerp, seg, ss, eio, track, mulberry } from '/core/lib.js';
import { spurWheel, lanternPinion, crownBand, skeletonDisc, capsule, boss, screwHead, jewel, handShape, extrude } from './parts.js';
import * as TL from './timeline.js';

const { T, DUR, PARTS, LANDDUR, LIFTDUR, DROP, RATE, RAMP } = TL;
const W = 1920, H = 1080;
const Q = new URLSearchParams(location.search);
const SS = +(Q.get('ss') || 2);

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(SS); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('stage').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, W / H, 8, 6000);
const post = makePost(renderer, scene, camera, W, H, { ssaa: SS, ao: true, aoRadius: 9, aoThickness: 6, aoScale: 1.4, aoAmt: .55 });
post.bloom.strength = .22; post.bloom.radius = .45; post.bloom.threshold = 1.5;
post.vig.uniforms.amt.value = .42; post.vig.uniforms.contrast.value = .1; post.vig.uniforms.warm.value = .08;
{
  const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const g = c.getContext('2d');
  const gr = g.createRadialGradient(900, 470, 60, 960, 540, 1250);
  gr.addColorStop(0, '#34363a'); gr.addColorStop(.45, '#212326'); gr.addColorStop(1, '#0d0e10');
  g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
const hdr = await new RGBELoader().loadAsync('/core/assets/polyhaven/photo_studio_loft_hall_2k.hdr');
hdr.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(hdr).texture;
scene.environmentIntensity = .55; scene.environmentRotation = new THREE.Euler(0, 1.2, 0);
RectAreaLightUniformsLib.init();
const key = new THREE.DirectionalLight('#fff0dc', 2.1);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -330, right: 330, top: 330, bottom: -330, near: 50, far: 2000 });
key.shadow.bias = -.0004; key.shadow.normalBias = .25; key.shadow.radius = 4; key.shadow.blurSamples = 12;
scene.add(key, key.target);
const rim = new THREE.RectAreaLight('#dbe7ff', 2.6, 380, 120); scene.add(rim);
const top = new THREE.RectAreaLight('#ffffff', .5, 600, 600); scene.add(top);
scene.add(new THREE.HemisphereLight('#c9d3e0', '#1a1712', .12));

// ---------- materials ----------
const M = {
  steel: new THREE.MeshPhysicalMaterial({ color: '#d6d9de', metalness: 1, roughness: .17 }),
  satin: new THREE.MeshPhysicalMaterial({ color: '#bfc3c9', metalness: 1, roughness: .33 }),
  pinSteel: new THREE.MeshStandardMaterial({ color: '#e2e4e8', metalness: 1, roughness: .12 }),
  gold: new THREE.MeshPhysicalMaterial({ color: '#e6b85e', metalness: 1, roughness: .2 }),
  brass: new THREE.MeshPhysicalMaterial({ color: '#cf9f4c', metalness: 1, roughness: .28 }),
  ruby: new THREE.MeshPhysicalMaterial({ color: '#c0102f', metalness: 0, roughness: .06, clearcoat: 1, clearcoatRoughness: .03, ior: 1.77, specularIntensity: 1, emissive: '#5a0012', emissiveIntensity: .55, sheen: .4, sheenColor: '#ff4060' }),
  blue: new THREE.MeshPhysicalMaterial({ color: '#2b55d0', metalness: 1, roughness: .19, clearcoat: .4, clearcoatRoughness: .1 }),
  dark: new THREE.MeshBasicMaterial({ color: '#050505' }),
  thread: new THREE.MeshStandardMaterial({ color: '#e8e2d4', roughness: .7 }),
};
function ropeTexture() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#b7a17a'; g.fillRect(0, 0, 64, 256);
  const rnd = mulberry(7);
  for (let i = -8; i < 40; i++) {           // three twisted strands: bright ridges, dark grooves
    const y = i * 8;
    g.strokeStyle = 'rgba(40,30,18,.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(0, y); g.lineTo(64, y + 26); g.stroke();
    g.strokeStyle = 'rgba(255,240,210,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y + 4); g.lineTo(64, y + 30); g.stroke();
  }
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${rnd() < .5 ? '255,245,220' : '30,22,12'},${.08 + rnd() * .12})`; g.fillRect(rnd() * 64, rnd() * 256, 1, 2 + rnd() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  return t;
}
const ropeTex = ropeTexture(), ropeTexFree = ropeTex.clone(); ropeTexFree.needsUpdate = true;
M.rope = new THREE.MeshStandardMaterial({ map: ropeTex, roughness: .88, bumpMap: ropeTex, bumpScale: 1.2 });
M.ropeFree = new THREE.MeshStandardMaterial({ map: ropeTexFree, roughness: .88, bumpMap: ropeTexFree, bumpScale: 1.2 });

const shadowy = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const mesh = (g, m, x = 0, y = 0, z = 0) => { const o = shadowy(new THREE.Mesh(g, m)); o.position.set(x, y, z); return o; };

// ---------- layout (the arbors lie along Z; the clock faces +Z) ----------
const A1 = [0, 0];
const A2 = [70 * Math.cos(52 * Math.PI / 180), 70 * Math.sin(52 * Math.PI / 180)];
const A3 = [A2[0] + 60 * Math.cos(100 * Math.PI / 180), A2[1] + 60 * Math.sin(100 * Math.PI / 180)];
const VX = A3[0], VZ = 13;                   // the verge axis (vertical)
const MX = 165, PZ0 = -31, PZ1 = -25;        // montant x, back plate z range
const PA = [-60, -45], PB = [85, -5];          // front bridge pillars
const FOLY = 207, POTY = 246;

const root = new THREE.Group(); scene.add(root);
const G = {}; for (const k of Object.keys(PARTS)) { G[k] = new THREE.Group(); root.add(G[k]); }
const spin = {};                               // rotating sub-groups
function spinner(part, x, y, axis = 'z') { const s = new THREE.Group(); s.position.set(x, y, 0); s.userData.axis = axis; G[part].add(s); return s; }

const SCREW = screwHead(3.0, 1.7), JEWEL = jewel(3.0);
function screw(parent, x, y, z, rz = 0, facing = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (facing < 0) g.rotation.y = Math.PI; g.rotation.z = rz;
  g.add(mesh(SCREW.head, M.gold), new THREE.Mesh(SCREW.slot, M.dark)); parent.add(g); return g;
}
function jewelAt(parent, x, y, z, facing = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); if (facing < 0) g.rotation.y = Math.PI;
  g.add(mesh(JEWEL.chaton, M.gold), mesh(JEWEL.ruby, M.ruby), new THREE.Mesh(JEWEL.hole, M.dark)); parent.add(g); return g;
}
function rodZ(parent, r, z0, z1, mat = M.steel) { const g = new THREE.CylinderGeometry(r, r, z1 - z0, 24); g.rotateX(Math.PI / 2); return parent.add(mesh(g, mat, 0, 0, (z0 + z1) / 2)); }
function collarZ(parent, r, z0, z1, mat = M.brass) { const g = boss(r, z1 - z0, 0); const m = mesh(g, mat, 0, 0, z0); parent.add(m); return m; }

// --- drum (C) with its coils of cord (B)
spin.drum = spinner('drum', ...A1);
{
  const core = new THREE.CylinderGeometry(18, 18, 38, 64); core.rotateX(Math.PI / 2);
  spin.drum.add(mesh(core, M.satin, 0, 0, 14));
  spin.drum.add(mesh(boss(26, 3, 2.6), M.steel, 0, 0, -8), mesh(boss(26, 3, 2.6), M.steel, 0, 0, 33));
  const coil = new THREE.TorusGeometry(19.4, 1.35, 12, 96);
  ropeTex.repeat.set(1, 12);
  for (let i = 0; i < 12; i++) spin.drum.add(mesh(coil, M.rope, 0, 0, -2.6 + i * 2.75));
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; screw(spin.drum, 21.5 * Math.cos(a), 21.5 * Math.sin(a), 36, a); }
}
const CORD_EXIT = [19.4, 0, 27.65];
// --- drum wheel (D) and arbor 1
spin.wheelD = spinner('wheelD', ...A1);
{
  spin.wheelD.add(mesh(spurWheel(62, 64, 4, { spokes: 4, rim: 6, hub: 8, sw: 4.6, axle: 2.4 }), M.steel, 0, 0, -14));
  rodZ(spin.wheelD, 2.4, -31, 57);
  collarZ(spin.wheelD, 7, -10, -8.5);
  collarZ(spin.wheelD, 6, -17.5, -14);
}
// --- lantern pinion 1 (on arbor 2) and wheel E
function lantern(parent, rp, N, z0, z1) {
  const L = lanternPinion(rp, N, z1 - z0);
  parent.add(mesh(L.flange, M.brass, 0, 0, z0 + .65), mesh(L.flange, M.brass, 0, 0, z1 - .65));
  for (let i = 0; i < N; i++) { const a = i / N * Math.PI * 2; parent.add(mesh(L.pin, M.pinSteel, rp * Math.cos(a), rp * Math.sin(a), (z0 + z1) / 2)); }
}
spin.pin1 = spinner('pin1', ...A2);
lantern(spin.pin1, 8, 8, -16.5, -7.5); rodZ(spin.pin1, 2, -31, 41);
spin.wheelE = spinner('wheelE', ...A2);
spin.wheelE.add(mesh(spurWheel(52, 60, 3.6, { spokes: 4, rim: 5, hub: 7, sw: 4, axle: 2 }), M.steel, 0, 0, -22));
collarZ(spin.wheelE, 5.5, -24.5, -22);
// --- lantern pinion 2 (on arbor 3)
spin.pin2 = spinner('pin2', ...A3);
lantern(spin.pin2, 8, 8, -23.8, -16.2); rodZ(spin.pin2, 2, -31, -3);
// --- crown wheel F (roue de rencontre)
spin.crown = spinner('crown', ...A3);
spin.crown.add(mesh(skeletonDisc(56, 3, { spokes: 4, rimW: 6.5, hub: 8, sw: 5, axle: 2 }), M.steel, 0, 0, -6));
spin.crown.add(mesh(crownBand(50.5, 56, 3, 8.5, 15, 40), M.steel, 0, 0, -3.2));
collarZ(spin.crown, 6.5, -3.4, -1.2);
// --- verge H with its two pallets G (rotates about Y)
spin.verge = new THREE.Group(); spin.verge.position.set(VX, 0, VZ); G.verge.add(spin.verge);
{
  const rod = new THREE.CylinderGeometry(1.7, 1.7, 214 - 42, 20); spin.verge.add(mesh(rod, M.steel, 0, (214 + 42) / 2, 0));
  const flag = new THREE.BoxGeometry(2.2, 12, 12.5); flag.translate(0, 0, -6.2);    // a flat pallet reaching −Z (towards the teeth)
  const yTop = A3[1] + 53.2, yBot = A3[1] - 53.2;
  const pTop = mesh(flag, M.steel, 0, yTop, 0); pTop.rotation.y = .9; spin.verge.add(pTop);
  const pBot = mesh(flag, M.steel, 0, yBot, 0); pBot.rotation.y = -.9; spin.verge.add(pBot);
  for (const y of [yTop, yBot]) { const c = new THREE.CylinderGeometry(3.2, 3.2, 10, 24); spin.verge.add(mesh(c, M.steel, 0, y, 0)); }
  const cap = new THREE.CylinderGeometry(4.6, 4.6, 6, 32); spin.verge.add(mesh(cap, M.brass, 0, 211, 0));
}
// --- foliot I and its regulating weights J (rotates about Y with the verge)
spin.foliot = new THREE.Group(); spin.foliot.position.set(VX, FOLY, VZ); G.foliot.add(spin.foliot);
{
  const bar = new THREE.BoxGeometry(226, 5.5, 5.5); spin.foliot.add(mesh(bar, M.steel, 0, 0, 0));
  const notch = new THREE.BoxGeometry(2.2, 2.2, 5.6);
  for (let i = -12; i <= 12; i++) if (Math.abs(i) > 2) spin.foliot.add(mesh(notch, M.steel, i * 8.6, 3.6, 0));
  const tip = new THREE.SphereGeometry(4, 24, 16);
  spin.foliot.add(mesh(tip, M.steel, 113, 0, 0), mesh(tip, M.steel, -113, 0, 0));
  const hub = new THREE.CylinderGeometry(8, 8, 9, 40); spin.foliot.add(mesh(hub, M.brass, 0, 0, 0));
  screw(spin.foliot, 0, 0, 0).rotation.set(-Math.PI / 2, 0, 0); spin.foliot.children.at(-1).position.y = 4.5;
  const reg = new THREE.CylinderGeometry(10, 10, 15, 48), link = new THREE.CylinderGeometry(1.2, 1.2, 9, 12);
  const ring = new THREE.TorusGeometry(3.6, 1.1, 10, 24);
  for (const s of [-1, 1]) {
    const x = s * 86;
    spin.foliot.add(mesh(ring, M.steel, x, 4.2, 0), mesh(link, M.steel, x, -6, 0), mesh(reg, M.brass, x, -18, 0));
    const capG = new THREE.CylinderGeometry(6, 10, 3, 48); spin.foliot.add(mesh(capG, M.gold, x, -9.2, 0));
  }
}
// --- potence (top bracket) with the suspension thread
{
  const arm = capsule(0, 0, Math.hypot(MX - VX, PZ0 + 3 - VZ), 0, 12, 6);
  const m = mesh(arm, M.satin); m.rotation.x = -Math.PI / 2;   // lies in XZ
  const ang = Math.atan2(-(PZ0 + 3 - VZ), MX - VX);
  const holder = new THREE.Group(); holder.position.set(VX, POTY, VZ); holder.rotation.y = ang; holder.add(m); G.potence.add(holder);
  m.position.y = -3;
  const stud = new THREE.CylinderGeometry(4.5, 4.5, 8, 32); G.potence.add(mesh(stud, M.satin, VX, POTY - 6, VZ));
  jewelAt(G.potence, VX, POTY + 3.1, VZ).rotation.x = -Math.PI / 2;
  const th = new THREE.CylinderGeometry(.45, .45, POTY - 214 - 10, 8); G.potence.add(mesh(th, M.thread, VX, (POTY - 10 + 214) / 2, VZ));
  const s1 = screw(G.potence, MX, POTY + 3, PZ0 + 3); s1.rotation.set(-Math.PI / 2, 0, .4);
}
// --- lower cock (pivot of the verge)
{
  const arm = capsule(0, 0, Math.hypot(MX - VX, PZ0 + 3 - VZ), 0, 10, 5);
  const m = mesh(arm, M.satin); m.rotation.x = -Math.PI / 2;
  m.position.y = -5;
  const holder = new THREE.Group(); holder.position.set(VX, 41, VZ); holder.rotation.y = Math.atan2(-(PZ0 + 3 - VZ), MX - VX); holder.add(m); G.cock.add(holder);
  jewelAt(G.cock, VX, 41.1, VZ).rotation.x = -Math.PI / 2;
  const s1 = screw(G.cock, MX, 41.1, PZ0 + 3); s1.rotation.set(-Math.PI / 2, 0, 1.1);
}
// --- back plate with the montant
{
  const g = G.plate, th = PZ1 - PZ0;
  const bars = [[A1, A2, 13], [A2, A3, 12], [A1, [MX, -14], 13], [A3, [MX, 150], 12], [A1, PA, 13], [[MX, -26], [MX, 254], 14]];
  for (const [p, q, w] of bars) g.add(mesh(capsule(p[0], p[1], q[0], q[1], w, th), M.satin, 0, 0, PZ0));
  for (const [p, r] of [[A1, 15], [A2, 13], [A3, 13], [PA, 9]]) g.add(mesh(boss(r, th + .6), M.satin, p[0], p[1], PZ0 - .3));
  for (const p of [A1, A2, A3]) { jewelAt(g, p[0], p[1], PZ1 + .3); jewelAt(g, p[0], p[1], PZ0 - .3, -1); }
  for (const [x, y] of [[MX, -14], [MX, 150], [MX, 55], [PA[0], PA[1]], [PB[0], PB[1]]]) screw(g, x, y, PZ0 - .2, x * .1, -1);
  // two feet: rings where the montant meets its arms
  g.add(mesh(boss(9, th + .8), M.satin, MX, POTY, PZ0 - .4), mesh(boss(9, th + .8), M.satin, MX, 41.5, PZ0 - .4));
}
// --- front bridge with its pillars
{
  const g = G.bridge, z0 = 40, th = 4.2;
  for (const [p, q, w] of [[A1, PA, 12], [A1, PB, 12], [A1, A2, 11]]) g.add(mesh(capsule(p[0], p[1], q[0], q[1], w, th), M.satin, 0, 0, z0));
  for (const [p, r] of [[A1, 13], [A2, 10], [PA, 8.5], [PB, 8.5]]) g.add(mesh(boss(r, th + .6), M.satin, p[0], p[1], z0 - .3));
  for (const p of [A1, A2]) jewelAt(g, p[0], p[1], z0 + th + .3);
  for (const p of [PA, PB]) {
    const pil = new THREE.CylinderGeometry(4, 4, z0 - PZ1, 32); pil.rotateX(Math.PI / 2);
    g.add(mesh(pil, M.steel, p[0], p[1], (z0 + PZ1) / 2));
    screw(g, p[0], p[1], z0 + th + .3, p[0] * .07);
  }
}
// --- dial K: a brushed steel chapter ring with engraved Roman numerals
await document.fonts.load('400 120px "IM Fell English"');
{
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
  const o = document.createElement('canvas'); o.width = o.height = S; const go = o.getContext('2d');
  const R0 = 64, R1 = 92, k = S / 2 / R1, cx = S / 2;
  g.fillStyle = '#b9bdc3'; g.fillRect(0, 0, S, S);
  go.fillStyle = 'rgb(0,90,255)'; go.fillRect(0, 0, S, S);             // G = roughness .35, B = metal
  const rnd = mulberry(3);
  for (let r = R0 * k; r < R1 * k; r += 1.3) {                           // circular brushing
    const v = 150 + rnd() * 70 | 0; g.strokeStyle = `rgba(${v},${v + 3},${v + 8},.35)`; g.lineWidth = 1; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke();
  }
  const ink = (f) => { f(g, '#16171a'); f(go, 'rgb(0,160,0)'); };
  ink((ctx, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    for (const r of [R0 + 2.2, R0 + 4.4, R1 - 2.6]) { ctx.beginPath(); ctx.arc(cx, cx, r * k, 0, Math.PI * 2); ctx.stroke(); }
    for (let i = 0; i < 48; i++) {
      const a = i / 48 * Math.PI * 2, r0 = (R0 + 2.2) * k, r1 = (R0 + 4.4) * k;
      ctx.beginPath(); ctx.moveTo(cx + r0 * Math.sin(a), cx - r0 * Math.cos(a)); ctx.lineTo(cx + r1 * Math.sin(a), cx - r1 * Math.cos(a)); ctx.stroke();
    }
  });
  const ROM = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  ink((ctx, col) => {
    ctx.fillStyle = col; ctx.font = `400 ${15.5 * k}px "IM Fell English"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ROM.forEach((s, i) => {
      const a = i / 12 * Math.PI * 2, r = (R0 + R1) / 2 * k + 1.6 * k;
      ctx.save(); ctx.translate(cx + r * Math.sin(a), cx - r * Math.cos(a)); ctx.rotate(a);
      ctx.scale(.82, 1); ctx.fillText(s, 0, 0); ctx.restore();
    });
  });
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const orm = new THREE.CanvasTexture(o); orm.anisotropy = 8;
  const face = new THREE.RingGeometry(R0, R1, 128, 1);
  const mat = new THREE.MeshPhysicalMaterial({ map, roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, clearcoat: .15, clearcoatRoughness: .3 });
  const s = new THREE.Shape(); s.absarc(0, 0, R1, 0, Math.PI * 2, false); const hp = new THREE.Path(); hp.absarc(0, 0, R0, 0, Math.PI * 2, true); s.holes.push(hp);
  G.dial.add(mesh(extrude(s, 3, .4, 128), M.satin, 0, 0, 48));
  G.dial.add(mesh(face, mat, 0, 0, 51.02));
  for (const p of [PA, PB]) { const pin = new THREE.CylinderGeometry(1.6, 1.6, 4.6, 16); pin.rotateX(Math.PI / 2); const d = Math.hypot(...p), u = 78 / d; G.dial.add(mesh(pin, M.steel, p[0] * u, p[1] * u, 46)); }
}
// --- hand L (blued steel), on arbor 1
spin.hand = spinner('hand', ...A1);
spin.hand.add(mesh(handShape(60), M.blue, 0, 0, 53.4));
{ const nut = new THREE.CylinderGeometry(3.2, 3.6, 2.6, 32); nut.rotateX(Math.PI / 2); spin.hand.add(mesh(nut, M.gold, 0, 0, 56.2)); }

// --- weight A and the free cord B
const weight = new THREE.Group(); root.add(weight);
{
  const prof = [[0, 0], [5, 0], [5, -3], [10, -4], [12.5, -9], [24, -12], [24.6, -13], [24.6, -60], [24, -61.2], [20, -62], [0, -62]];
  const lg = new THREE.LatheGeometry(prof.slice().reverse().map(([r, y]) => new THREE.Vector2(Math.max(.01, r), y)), 96);
  weight.add(mesh(lg, M.satin, 0, -6, 0));
  const band = new THREE.CylinderGeometry(25.4, 25.4, 6, 96, 1, true); weight.add(mesh(band, M.brass, 0, -26, 0));
  const band2 = new THREE.CylinderGeometry(25.4, 25.4, 2.2, 96, 1, true); weight.add(mesh(band2, M.brass, 0, -58, 0));
  const hook = new THREE.TorusGeometry(4.2, 1.3, 12, 32); weight.add(mesh(hook, M.steel, 0, -2, 0));
}
const cordG = new THREE.CylinderGeometry(1.35, 1.35, 1, 14, 1, true); cordG.translate(0, .5, 0);
const cord = mesh(cordG, M.ropeFree); root.add(cord);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.ShadowMaterial({ color: '#000000', opacity: .32 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -232; floor.receiveShadow = true; scene.add(floor);

// ---------- kinematics ----------
// beat phase φ: at rest before the wake, spins up over RAMP, then RATE beats/s; a tooth drops at every φ = n + DROP
function phase(t) {
  if (t >= T.run) return DROP + RATE * (t - T.run);
  if (t <= T.wake) return DROP - RATE * RAMP / 2;
  const u = t - T.wake; return DROP - RATE / (2 * RAMP) * (RAMP * RAMP - u * u);
}
// escape-wheel advance per beat (in beats): impulse, drop, recoil
function step(phi) {
  const n = Math.floor(phi), u = phi - n;
  let h;
  if (u < DROP) h = .6 * u / DROP;
  else if (u < DROP + .05) h = .6 + .55 * ss((u - DROP) / .05);
  else h = 1.15 - .15 * ss((u - DROP - .05) / (1 - DROP - .05));
  return n + h;
}
const HALF_TOOTH = Math.PI / 15;               // 15 teeth, two beats per tooth
const AMP = .58;                               // foliot amplitude (rad)
function kin(t) {
  const phi = phase(t), s = step(phi) - step(phase(0));
  const a3 = -s * HALF_TOOTH, a2 = -a3 * 8 / 60, a1 = -a2 * 8 / 64;
  return { phi, a1, a2, a3, foliot: AMP * Math.cos(Math.PI * phi) };
}

// ---------- assembly / explode ----------
const eo3 = x => 1 - Math.pow(1 - clamp(x), 3);
function partK(k, t) {
  const P = PARTS[k];
  const landed = eo3(seg(t, P.land - LANDDUR, P.land));
  const seat = t > P.land && t < P.land + .3 ? -.012 * Math.sin((t - P.land) / .3 * Math.PI) : 0;   // a small mechanical seat
  const lifted = eio(seg(t, P.lift, P.lift + LIFTDUR));
  return (1 - landed) + seat + lifted;
}
const FL = Object.fromEntries(Object.keys(PARTS).map((k, i) => [k, i * 1.37]));
const floatAmt = t => seg(t, T.open + 2.5, T.open + 4.5);
function placeParts(t) {
  for (const k of Object.keys(PARTS)) {
    const e = partK(k, t), o = PARTS[k].off;
    const f = 1.1 * Math.sin(t * 1.7 + FL[k]) * floatAmt(t) * clamp(e);
    G[k].position.set(o[0] * e, o[1] * e + f, o[2] * e);
  }
}
function placeMotion(t) {
  const K = kin(t);
  spin.drum.rotation.z = spin.wheelD.rotation.z = spin.hand.rotation.z = K.a1;
  spin.pin1.rotation.z = spin.wheelE.rotation.z = K.a2;
  spin.pin2.rotation.z = spin.crown.rotation.z = K.a3;
  spin.verge.rotation.y = spin.foliot.rotation.y = K.foliot;
  // the weight hangs under the cord's exit from the drum and goes down as the drum unwinds
  const ex = new THREE.Vector3(CORD_EXIT[0], CORD_EXIT[1], CORD_EXIT[2]).add(G.drum.position);
  const sway = 1.6 * Math.sin(t * 1.25) * (1 - seg(t, 4, 9)) ;
  const hookY = -128 - 19.4 * Math.abs(K.a1);
  const hk = new THREE.Vector3(CORD_EXIT[0] + sway, hookY, CORD_EXIT[2]);
  weight.position.copy(hk); weight.rotation.y = .4 + .25 * Math.sin(t * .37);
  const d = new THREE.Vector3().subVectors(ex, hk), len = d.length();
  cord.position.copy(hk); cord.scale.set(1, len, 1);
  cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  ropeTexFree.repeat.set(1, len / 9); ropeTexFree.offset.y = -19.4 * Math.abs(K.a1) / 9;
  return K;
}

// ---------- camera ----------
const orbitEye = k => {
  const [, az, el, dist, tx, ty, tz, fov] = k, A = az * Math.PI / 180, E = el * Math.PI / 180;
  return [tx + dist * Math.cos(E) * Math.sin(A), ty + dist * Math.sin(E), tz + dist * Math.cos(E) * Math.cos(A), tx, ty, tz, fov];
};
const camKeys = TL.CAM.filter(k => k[0] < TL.ORBIT_FROM).map(k => [k[0], k.slice(1)]);
camKeys.push([TL.ORBIT_FROM, orbitEye(TL.ORBIT[0])]);
const camTrack = track(camKeys);
const orbTrack = track(TL.ORBIT.map(k => [k[0], k.slice(1)]));
const camAt = t => t < TL.ORBIT_FROM ? camTrack(t) : orbitEye([0, ...orbTrack(t)]);
function setCamera(t) {
  const [ex, ey, ez, tx, ty, tz, fov] = camAt(t);
  camera.position.set(ex, ey, ez); camera.fov = fov; camera.lookAt(tx, ty, tz); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const dist = Math.hypot(ex - tx, ey - ty, ez - tz);
  rim.intensity = 2.6 * clamp((dist - 120) / 380, .3, 1);
  post.dof.focus = dist; post.dof.aper = +(Q.get('aper') || 2600) * (dist < 260 ? 1 : 1); post.dof.maxCoc = 12;
  const A = Math.atan2(ex - tx, ez - tz), la = A - .85;
  key.position.set(tx + 700 * Math.sin(la), ty + 620, tz + 700 * Math.cos(la)); key.target.position.set(tx, ty - 40, tz);
  rim.position.set(tx + 520 * Math.sin(A + 2.7), ty + 180, tz + 520 * Math.cos(A + 2.7)); rim.lookAt(tx, ty, tz);
  top.position.set(tx, ty + 520, tz); top.lookAt(tx, ty, tz);
}

// ---------- events for the mixer (window.EV) ----------
const EV = [];
const panOf = (k, t) => {
  setCamera(t); placeParts(t);
  const b = new THREE.Box3().setFromObject(G[k]); const c = b.getCenter(new THREE.Vector3()).project(camera);
  return +clamp(c.x, -1, 1).toFixed(2);
};
for (const k of Object.keys(PARTS)) {
  EV.push({ t: PARTS[k].land, type: 'land', part: k, pan: panOf(k, PARTS[k].land) });
  EV.push({ t: +(PARTS[k].land - LANDDUR).toFixed(3), type: 'arrive', part: k, pan: panOf(k, PARTS[k].land - .5) });
  EV.push({ t: PARTS[k].lift, type: 'lift', part: k, pan: panOf(k, PARTS[k].lift + .4) });
}
for (let n = 0; T.run + n * .5 < DUR - .01; n++) EV.push({ t: +(T.run + n * .5).toFixed(3), type: 'tick', n, top: n % 2 === 0 });
EV.push({ t: T.wake, type: 'wake' }, { t: T.open, type: 'open' }, { t: T.resolve, type: 'resolve' });
EV.sort((a, b) => a.t - b.t);
window.EV = EV; window.DUR = +(Q.get("dur") || DUR); const T0 = +(Q.get("t0") || 0);

// ---------- frame ----------
window.render = t0 => { const t = t0 + T0;
  placeParts(t);
  placeMotion(t);
  setCamera(t);
  post.composer.render();
};
window.TEXTS = () => [];
window.DBG = t => ({ cam: camAt(t).map(v => +v.toFixed(1)), k: kin(t) });
window.render(Number(Q.get('t') || 0));
window.READY = true;
