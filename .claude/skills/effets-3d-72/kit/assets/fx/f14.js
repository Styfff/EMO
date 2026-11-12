// 14 · Pendules en vague — victorien : douze lettres de laiton, périodes T = 5/(4+i) s, la vague se défait puis se refait exactement
import { THREE, word, rig, pchip, makeCam, fitDist, orbit, ss, gpuPoints, bgRadial, cast , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.9; scene.background = bgRadial("#1c4a3a", "#0b241c", "#04100c");
  rig(scene, { key: 2.4, pos: [-4, 8, 7], amb: 0.35, size: 8, color: 0xffe2b0 });
  const TXT = mot(14, "OSCILLATIONS"), w = word(TXT, { font: "copper", cap: 0.8, depth: 0.24, bevel: 0.026, track: 0.07 }), NP = w.letters.length, LEN = 2.9, YB = 2.0, A = 0.5, TREL = 0.55, TC = 5;
  const brass = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.22 }), dark = new THREE.MeshStandardMaterial({ color: 0x1a120a, metalness: 0.6, roughness: 0.5 }), P = [];
  const bar = cast(new THREE.Mesh(new THREE.BoxGeometry(w.width + 1.2, 0.14, 0.34), dark)); bar.position.y = YB + 0.07; scene.add(bar);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), brass); f.position.set(s * (w.width / 2 + 0.6), YB + 0.07, 0); scene.add(f); }
  const rodG = new THREE.CylinderGeometry(0.008, 0.008, 1, 6); rodG.translate(0, -0.5, 0);
  for (const l of w.letters) { const g = new THREE.Group(); g.position.set(l.x, YB, 0); const m = cast(new THREE.Mesh(l.geo, brass)); m.position.y = -LEN; g.add(m);
    for (const s of [-1, 1]) { const rod = new THREE.Mesh(rodG, brass), dx = s * l.w * 0.3, L2 = Math.hypot(dx, LEN - 0.34); rod.scale.y = L2; rod.rotation.z = Math.atan2(dx, LEN - 0.34) * -1; rod.position.set(-dx * 0 , 0, 0); rod.rotation.z = Math.atan2(-dx, LEN - 0.34); g.add(rod); rod.position.x = 0; rod.userData.dx = dx; }
    scene.add(g); P.push({ g, T: TC / (1.5 + l.i * 0.19) }); }
  const ang = (t, T) => { const env = 1 - ss(4.2, 5.7, t); return t < TREL ? A : A * env * Math.cos(2 * Math.PI * (t - TREL) / T); };
  const NT = 110, aI = new Float32Array(NP * NT * 3); for (let i = 0; i < NP; i++) for (let j = 0; j < NT; j++) aI.set([w.letters[i].x, TC / (1.5 + i * 0.19), j], (i * NT + j) * 3);
  const U = { uT: { value: 0 }, uPx: { value: 1 } };
  scene.add(gpuPoints(NP * NT, { aI: [3, aI] }, U, `attribute vec3 aI; uniform float uT, uPx; varying float vA;
    void main(){ float tt = uT - aI.z * .011, env = 1. - sst(4.2, 5.7, tt), th = tt < ${TREL} ? ${A} : ${A} * env * cos(6.2832 * (tt - ${TREL}) / aI.y);
      vec3 p = vec3(aI.x, ${YB.toFixed(1)} - ${LEN.toFixed(1)} * cos(th), ${LEN.toFixed(1)} * sin(th)); vec4 mv = modelViewMatrix * vec4(p, 1.); float k = 1. - aI.z / ${NT}.; vA = k * k * step(${TREL}, tt) * sst(${TREL}, ${TREL + 0.3}, uT) * (1. - sst(5.5, 5.95, uT));
      gl_PointSize = max(1.5, (.05 + .09 * k) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.6, 1.0, .35) * vA * .34 * smoothstep(.5, 0., d), 1.); }"));
  const D0 = fitDist(w.width + 1.0, 30, 0.96);
  const AZ = pchip([[0, -4], [6, 4]]), EL = pchip([[0, 17], [3.5, 13], [6, 7]]), DK = pchip([[0, 1.06], [6, 0.96]]);
  return { n: 14, title: "Pendules en vague", style: "Victorien (laiton)", font: "Cinzel Black", cam: "de face, en légère plongée qui s'abaisse", geste: "douze périodes décalées, lentes ; la vague s'apaise et le mot se pose", scene, camera, accent: "#d9a441", bloom: [0.32, 0.6, 1.0],
    render(t, K) { U.uT.value = t; U.uPx.value = K.px(camera); for (const p of P) p.g.rotation.x = -ang(t, p.T) * -1; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, YB - LEN * 0.56, 0] }); } };
}
