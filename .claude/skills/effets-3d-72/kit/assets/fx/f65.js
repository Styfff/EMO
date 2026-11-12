// 65 · Rideau d'eau — fontaine numérique : une rampe lâche des gouttes en motif : rideau plein, puis le mot écrit en gouttes qui tombe, deux passages
import { THREE, textMask, gpuInst, pchip, makeCam, fitDist, orbit, matte, chrome, rnd, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32); scene.environment = K.env; scene.environmentIntensity = 1.0; scene.background = bgLinear([[0, "#02101e"], [0.7, "#062a44"], [1, "#0a3d5c"]]);
  scene.add(new THREE.HemisphereLight(0x8ad8ff, 0x02101e, 0.8)); const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 8); scene.add(key);
  const NX = 96, W = 8.6, H = 6.4, G = 7.0, DT = 0.02, m = textMask(mot(65, "PLUIE"), { font: "black", width: NX, res: 960, pad: 0.03 }), rowsOf = [];
  for (let y = 0; y < m.h; y += Math.max(1, Math.round(m.h / 30))) { const row = []; for (let i = 0; i < NX; i++) { const px = Math.round(((i + 0.5) / NX) * m.w * 0.94 + m.w * 0.03); row.push(m.at(px, y) > 128 ? 1 : 0); } if (row.some((v) => v)) rowsOf.push(row); }
  const WR = rowsOf.length, rows = [], push = (t0, mask) => rows.push({ t0, mask });
  for (const T of [0.3, 3.3]) { for (let k = 0; k < 14; k++) push(T + k * DT, null); const TW = T + 0.75; for (let k = 0; k < WR; k++) push(TW + k * DT, rowsOf[WR - 1 - k]); for (let k = 0; k < 10; k++) push(TW + WR * DT + 0.55 + k * DT, null); }
  const drops = []; for (const rw of rows) for (let i = 0; i < NX; i++) if (!rw.mask || rw.mask[i]) drops.push([(i / (NX - 1) - 0.5) * W, rw.t0]);
  const N = drops.length, aD = new Float32Array(N * 2); drops.forEach((d, k) => aD.set(d, k * 2)); const U = { uT: { value: 0 } };
  scene.add(gpuInst(new THREE.SphereGeometry(0.033, 10, 8), new THREE.MeshPhysicalMaterial({ color: 0xbfeaff, roughness: 0.05, metalness: 0, transmission: 0, envMapIntensity: 2.2, emissive: 0x0a3a5a }), N, { aD: [2, aD] }, U, {
    decl: "attribute vec2 aD; uniform float uT;", pos: `float tau = uT - aD.y, y = ${H.toFixed(1)} - .5 * ${G.toFixed(1)} * tau * tau, vis = step(0., tau) * step(0., y); float st = 1. + .07 * ${G.toFixed(1)} * tau; transformed = transformed * vec3(vis, vis * st, vis) + vec3(aD.x, y, 0.);` }));
  const bar = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, 0.22, 0.36), chrome({ roughness: 0.2 })); bar.position.y = H + 0.16; scene.add(bar); const led = new THREE.Mesh(new THREE.BoxGeometry(W + 0.6, 0.04, 0.38), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.6, 2.4) })); led.position.y = H + 0.02; scene.add(led);
  const PU = { uT: U.uT }, pool = new THREE.Mesh(new THREE.PlaneGeometry(W + 3, 3.2, 1, 1), new THREE.ShaderMaterial({ uniforms: PU, vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: "uniform float uT; varying vec2 vP; void main(){ float s = 0.; for (int i = 0; i < 6; i++) { float fi = float(i); vec2 c = vec2(sin(fi * 2.1 + uT * .3) * 4., cos(fi * 1.7) * 1.2); s += sin(length(vP - c) * 18. - uT * 9. + fi) / (1. + length(vP - c) * 2.); } vec3 col = vec3(.02, .16, .26) + vec3(.2, .6, .8) * (s * .08 + .1); gl_FragColor = vec4(col, 1.); }" })); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0, 0.4); scene.add(pool);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(W + 3.4, 0.3, 3.6), matte(0x1a2a36, { roughness: 0.5 })); rim.position.set(0, -0.16, 0.4); scene.add(rim);
  const D0 = fitDist(W + 1, 32, 0.92), AZ = pchip([[0, -16], [6, 10]]), EL = pchip([[0, 2], [6, 4]]), DK = pchip([[0, 1.05], [6, 0.98]]);
  return { n: 65, title: "Rideau d'eau", style: "Fontaine numérique (bleu nuit)", font: "Archivo Black", cam: "de face, arc lent", geste: `${Math.round(N / 1000)} 000 gouttes lâchées en motif : rideau, puis le mot qui tombe, deux fois`, scene, camera, accent: "#5ad1ff", bloom: [0.3, 0.5, 1.05], shutter: 0.3,
    render(t) { U.uT.value = t; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, H / 2 + 0.2, 0] }); } };
}
