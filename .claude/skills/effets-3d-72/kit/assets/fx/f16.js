// 16 · Voxels au vent — dégradé « aurora » : ~40 000 cubes quittent le mot A, portés par le vent, et se reposent en mot B
import { THREE, textMask, gpuInst, pchip, makeCam, fitDist, orbit, mulberry, bgRadial , mots } from "../kit.js";
function cells(text, width, step, layers, font) { const m = textMask(text, { font, width, res: 1500, pad: 0.02 }), out = []; for (let y = -m.Hh / 2; y < m.Hh / 2; y += step) for (let x = -width / 2 - 0.2; x < width / 2 + 0.2; x += step) { const px = Math.round(x / m.scale + m.w / 2), py = Math.round(m.h / 2 - y / m.scale); if (px >= 0 && py >= 0 && px < m.w && py < m.h && m.at(px, py) > 128) for (let k = 0; k < layers; k++) out.push([x, y, (k - (layers - 1) / 2) * step]); } return out; }
const W2 = mots(16, ["VOXEL", "VENT"]);
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.55; scene.background = bgRadial("#1a1440", "#0a0820", "#03020a");
  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a1a70, 1.1)); const dl = new THREE.DirectionalLight(0xffffff, 2.6); dl.position.set(-4, 7, 8); scene.add(dl);
  const STEP = 0.032, A = cells(W2[0], 6.3, STEP, 7, "avenir"), B = cells(W2[1], 5.4, STEP, 7, "avenir"), N = Math.max(A.length, B.length), r = mulberry(5);
  A.sort((p, q) => p[0] - q[0]); B.sort((p, q) => p[0] - q[0]);
  const aA = new Float32Array(N * 3), aB = new Float32Array(N * 3), aR = new Float32Array(N * 4), U = { uT: { value: 0 } }, col = new THREE.Color(), c1 = new THREE.Color(0x14e8c0), c2 = new THREE.Color(0x7a4dff), c3 = new THREE.Color(0xff4fa3);
  const im = gpuInst(new THREE.BoxGeometry(STEP * 0.9, STEP * 0.9, STEP * 0.9), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), N, { aA: [3, aA], aB: [3, aB], aR: [4, aR] }, U, {
    decl: "attribute vec3 aA, aB; attribute vec4 aR; uniform float uT; mat3 vxR; float vxU;",
    nrm: "vxU = sst(0., 1., (uT - 1.2 - (aA.x + 3.3) * .19 - aR.x * .35) / 1.7); vxR = rotAx(normalize(aR.yzw - .5), vxU * 6.2832 * (1. + floor(aR.x * 3.))); objectNormal = vxR * objectNormal;",
    pos: `float sw = sin(3.14159 * vxU), sc = 1. - .45 * sw * aR.y; vec3 wind = vec3(1.9 * sw * (.4 + aR.z), (aR.y - .35) * 2.6 * sw + .35 * sin(vxU * 9. + aR.x * 20.) * sw, (aR.w - .5) * 3.2 * sw);
      transformed = vxR * transformed * sc + mix(aA, aB, vxU * vxU * (3. - 2. * vxU)) + wind;` });
  for (let i = 0; i < N; i++) { const a = A[Math.floor(i * A.length / N)], b = B[Math.floor(i * B.length / N)]; aA.set(a, i * 3); aB.set(b, i * 3); aR.set([r(), r(), r(), r()], i * 4); const f = (a[0] + 3.2) / 6.4 + (a[1] * 0.12); im.setColorAt(i, f < 0.5 ? col.lerpColors(c1, c2, f * 2) : col.lerpColors(c2, c3, f * 2 - 1)); }
  scene.add(im); document.documentElement.dataset.voxels = String(N);
  const D0 = fitDist(6.5, 30, 0.94), AZ = pchip([[0, -22], [2.6, 14], [4.6, 2], [6, -3]]), EL = pchip([[0, 8], [3, 12], [6, 3]]), DK = pchip([[0, 1.0], [2.8, 1.22], [5, 1.0], [6, 0.96]]);
  return { n: 16, title: "Voxels au vent", style: "Aurora (dégradés)", font: "Montserrat ExtraBold", cam: "travelling latéral dans le sens du vent", geste: `${N.toLocaleString("fr-FR")} cubes quittent le mot A et forment le mot B`, scene, camera, accent: "#14e8c0", bloom: [0.3, 0.7, 0.95],
    render(t) { U.uT.value = t; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0.25 * Math.sin(t), 0, 0] }); } };
}
