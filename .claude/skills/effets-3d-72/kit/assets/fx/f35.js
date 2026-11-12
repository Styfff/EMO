// 35 · Lettres en feu — braise : le feu prend de gauche à droite ; 170 000 flammèches montent des lettres de charbon, qui rougissent
import { THREE, word, maskPoints, gpuPoints, pchip, makeCam, fitDist, orbit, ss, rnd, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = bgRadial("#1a0a06", "#080302", "#010000");
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0c0706, roughness: 0.82, metalness: 0.05 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0x4a5878, 0x120806, 0.5)); const key = new THREE.DirectionalLight(0xbfd0ff, 0.9); key.position.set(-4, 6, 8); scene.add(key);
  const TXT = mot(35, "BRASIER"), w = word(TXT, { font: "impact", cap: 1.7, depth: 0.42, bevel: 0.03, pivot: "base" }), X0 = -w.width / 2, T0 = 0.5, TS = 2.7, ign = (x) => T0 + ((x - X0) / w.width) * TS, L = [];
  for (const l of w.letters) { const mat = new THREE.MeshStandardMaterial({ color: 0x1c1512, roughness: 0.85, emissive: new THREE.Color(1.0, 0.22, 0.03), emissiveIntensity: 0 }), m = new THREE.Mesh(l.geo, mat); m.position.x = l.x; scene.add(m); const pl = new THREE.PointLight(0xff6a1a, 0, 9); pl.position.set(l.x, 1.9, 1.0); scene.add(pl); L.push({ mat, pl, t: ign(l.x), i: l.i }); }
  const NF = 170000, FP = maskPoints(TXT, NF, { font: "impact", width: w.width, seed: 4, res: 1500, depth: 0.5 }), aG = new Float32Array(NF); for (let i = 0; i < NF; i++) { FP[i * 3 + 1] += 0.85; aG[i] = ign(FP[i * 3]); }
  const U = { uT: { value: 0 }, uPx: { value: 1 } };
  scene.add(gpuPoints(NF, { aP: [3, FP], aG: [1, aG], aS: [4, rnd(NF * 4, 1, 6)] }, U, `attribute vec3 aP; attribute float aG; attribute vec4 aS; uniform float uT, uPx; varying vec3 vC;
    void main(){ float on = sst(0., .9, uT - aG - aS.x * .5), age = fract(aS.y + uT * (.75 + .7 * aS.z)), up = aP.y / 1.7, rise = age * (.55 + 1.5 * aS.w * up + .5 * aS.z);
      vec3 p = aP + vec3(.16 * age * sin(age * 9. + aS.x * 40. + uT * 3.) + .1 * age * age * sin(aP.x * 3. + uT * 2.), rise, .1 * age * cos(age * 7. + aS.w * 30.));
      vec3 c = mix(vec3(3.4, 2.7, 1.5), vec3(3.0, 1.1, .12), sst(0., .3, age)); c = mix(c, vec3(1.4, .14, .02), sst(.3, .75, age)); c = mix(c, vec3(.1, .03, .02), sst(.7, 1., age));
      vC = c * on * (1. - age) * (.35 + .65 * up) * .075; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.3, (.035 + .06 * aS.w) * (1. - .55 * age) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * smoothstep(.5, .05, d), 1.); }"));
  const NS = 7000, SP = new Float32Array(NS * 3), sG = new Float32Array(NS); for (let i = 0; i < NS; i++) { const j = (i * 23) % NF; SP.set([FP[j * 3], FP[j * 3 + 1], FP[j * 3 + 2]], i * 3); sG[i] = aG[j]; }
  scene.add(gpuPoints(NS, { aP: [3, SP], aG: [1, sG], aS: [4, rnd(NS * 4, 1, 16)] }, U, `attribute vec3 aP; attribute float aG; attribute vec4 aS; uniform float uT, uPx; varying float vA;
    void main(){ float on = sst(0., .6, uT - aG - aS.x), age = fract(aS.y + uT * (.22 + .25 * aS.z)); vec3 p = aP + vec3(.9 * age * sin(age * 5. + aS.x * 30.) * aS.w + .5 * age, age * (2.5 + 3.5 * aS.z), .5 * age * cos(age * 4. + aS.w * 20.));
      vA = on * (1. - age) * (.5 + .5 * sin(uT * 20. + aS.x * 60.)); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.3, .022 * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(2.6, 1.3, .3) * vA * smoothstep(.5, .1, d), 1.); }"));
  const D0 = fitDist(w.width, 30, 0.84), AZ = pchip([[0, -16], [6, 9]]), EL = pchip([[0, 4], [6, 8]]), DK = pchip([[0, 1.18], [6, 1.0]]);
  return { n: 35, title: "Lettres en feu", style: "Braise (noir et feu)", font: "Anton", cam: "basse, avance lentement en arc", geste: "le feu prend de gauche à droite ; 170 000 flammèches", scene, camera, accent: "#ff7a1a", bloom: [0.6, 0.7, 0.8],
    render(t, K) { U.uT.value = t; U.uPx.value = K.px(camera); for (const q of L) { const on = ss(0, 1.2, t - q.t), fl = 0.9 + 0.1 * Math.sin(t * 9 + q.i * 2.3) * Math.sin(t * 5.3 + q.i); q.mat.emissiveIntensity = 0.55 * on * fl; q.pl.intensity = 16 * on * fl; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 1.2, 0] }); } };
}
