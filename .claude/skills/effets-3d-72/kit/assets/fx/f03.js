// 3 · Chute et rebond — pâte à modeler : lettres et 260 billes en rebonds analytiques, écrasement et tremblement de gelée
import { THREE, word, rig, shadowFloor, pchip, makeCam, fitDist, cast, orbit, clamp, mulberry , mot } from "../kit.js";
function bounce(tau, h, g, e, n = 4) { if (tau < 0) return [h, -1, 0, 0]; const T0 = Math.sqrt(2 * h / g); if (tau < T0) return [h - 0.5 * g * tau * tau, -1, tau / T0, 0];
  let ts = T0, v = g * T0 * e; for (let k = 0; k < n; k++) { const d = 2 * v / g; if (tau < ts + d) { const u = tau - ts; return [v * u - 0.5 * g * u * u, u, 1, k]; } ts += d; v *= e; } return [0, tau - ts, 1, n]; }
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(28), BG = 0x3a2a78; scene.environment = K.env; scene.environmentIntensity = 0.45; scene.background = new THREE.Color(BG);
  rig(scene, { key: 3.0, pos: [-5, 10, 7], amb: 0.75, size: 9, color: 0xfff1e0, sky: 0xffffff, ground: 0x6a4fd0, soft: 9, map: 4096 }); scene.fog = new THREE.Fog(BG, 13, 30);
  { const f = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x5a45b8, roughness: 0.95 })); f.rotation.x = -Math.PI / 2; f.receiveShadow = true; scene.add(f); }
  const PAL = [0xff7a59, 0x3fe0b0, 0xffc93c, 0xfff3e6], clay = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.92, sheen: 1, sheenRoughness: 0.6, sheenColor: 0xffffff });
  const w = word(mot(3, "REBOND"), { font: "round", cap: 1.15, depth: 0.62, bevel: 0.1, bevelSeg: 6, pivot: "base", curve: 14 }), L = [];
  for (const l of w.letters) { const m = cast(new THREE.Mesh(l.geo, clay(PAL[[0, 1, 2, 3, 1, 0][l.i % 6]]))); m.position.x = l.x; scene.add(m); L.push({ m, tilt: (l.i % 2 ? -1 : 1) * (0.3 + 0.08 * l.i), t0: 0.15 + l.i * 0.14 }); }
  const NB = 260, r = mulberry(31), B = [], balls = PAL.map((c) => { const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), clay(c), NB / 4); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; });
  for (let i = 0; i < NB; i++) { const front = r() < 0.5; B.push({ x: (r() - 0.5) * 9.5, z: front ? 0.75 + r() * 2.6 : -0.8 - r() * 2.4, rad: 0.07 + r() * r() * 0.2, t0: 0.1 + r() * 3.4, h: 5 + r() * 4, e: 0.55 + r() * 0.2, vx: (r() - 0.5) * 0.8 }); }
  const D0 = fitDist(w.width, 28, 0.9); scene.fog.near = Math.max(scene.fog.near, D0 * 1.25); scene.fog.far = Math.max(scene.fog.far, D0 * 2.8); const _d0 = D0, o = new THREE.Object3D();
  const AZ = pchip([[0, -24], [6, 18]]), EL = pchip([[0, 3], [3, 9], [6, 13]]), DK = pchip([[0, 1.18], [6, 0.98]]);
  return { n: 3, title: "Chute et rebond", style: "Clay (pâte à modeler)", font: "Nunito Black", cam: "contre-plongée qui s'élève en arc, secousse aux impacts", geste: "rebonds analytiques, écrasement et gelée ; 260 billes", scene, camera, accent: "#ffc93c", bloom: [0.1, 0.5, 1.3], vig: 0.3, tone: "neutral",
    render(t) {
      let shake = 0;
      for (const q of L) { const [y, c, fall, k] = bounce(t - q.t0, 7, 30, 0.5, 3), amp = Math.pow(0.5, k), sq = c >= 0 ? 1 - 0.34 * Math.exp(-c / 0.06) * amp + 0.1 * Math.exp(-c / 0.3) * Math.sin(c * 26) * amp : 1 + 0.14 * fall;
        q.m.position.y = y; q.m.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)); q.m.rotation.z = q.tilt * (1 - fall); q.m.rotation.x = -0.4 * q.tilt * (1 - fall); if (c >= 0 && k < 3) shake += amp * Math.exp(-c / 0.09) * Math.sin(c * 70); }
      B.forEach((b, i) => { const [y, c, fall, k] = bounce(t - b.t0, b.h, 30, b.e, 5), sq = c >= 0 ? 1 - 0.3 * Math.exp(-c / 0.05) * Math.pow(b.e, k) : 1 + 0.1 * fall, tt = clamp(t - b.t0, 0, 4);
        o.position.set(b.x + b.vx * tt * (1 - tt / 8), y + b.rad * sq, b.z); o.scale.set(b.rad / Math.sqrt(sq), b.rad * sq, b.rad / Math.sqrt(sq)); o.updateMatrix(); balls[i % 4].setMatrixAt(i >> 2, o.matrix); });
      for (const im of balls) im.instanceMatrix.needsUpdate = true;
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.72 + 0.03 * shake, 0] });
    } };
}
