// 70 · Nuée d'oiseaux — estampe au couchant : 14 000 oiseaux en silhouette tournoient, puis se posent en vol pour écrire le mot, ailes battantes
import { THREE, maskPoints, gpuInst, pchip, makeCam, fitDist, orbit, rnd, bg, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(34); const r = mulberry(70);
  scene.background = bg((g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2b1f4a"); gr.addColorStop(0.45, "#c24f5a"); gr.addColorStop(0.7, "#f39a4a"); gr.addColorStop(1, "#f7d07a"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "#fff2c9"; g.beginPath(); g.arc(w * 0.62, h * 0.66, 120, 0, 7); g.fill();
    [["#7a2f4a", 0.74, 50, 3], ["#4a1f3a", 0.82, 40, 5], ["#2a1228", 0.9, 30, 7]].forEach(([c, y, a, s]) => { g.fillStyle = c; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 6) g.lineTo(x, h * y - a * (0.5 + 0.5 * Math.sin(x * 0.01 * s / 3 + y * 20)) - 30 * Math.abs(Math.sin(x * 0.004 * s))); g.lineTo(w, h); g.fill(); }); }, 864, 1080);
  const N = 14000, YW = 3.6, T = maskPoints(mot(70, "ENVOL"), N, { font: "gill", width: 8.6, seed: 70, res: 1500 }); for (let i = 0; i < N; i++) { T[i * 3 + 1] += YW; T[i * 3 + 2] = (r() - 0.5) * 0.25; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-0.11, 0, -0.02, 0, 0, 0.06, 0, 0, -0.05, 0, 0, 0.06, 0.11, 0, -0.02, 0, 0, -0.05]), 3));
  const U = { uT: { value: 0 } }; scene.add(gpuInst(geo, new THREE.MeshBasicMaterial({ color: 0x180c1c, side: THREE.DoubleSide }), N, { aT: [3, T], aS: [4, rnd(N * 4, 1, 71)] }, U, {
    decl: `attribute vec3 aT; attribute vec4 aS; uniform float uT;
      vec3 flock(float t){ float k = 1. - sst(2.6, 4.6, t); vec3 c = vec3(2.6 * sin(.45 * t) * k, ${YW.toFixed(1)} + .8 * sin(.7 * t) * k, -1.5 * k); float th = aS.x * 6.2832 + (.5 + aS.y) * .8 * t, ph = acos(2. * aS.y - 1.) + .4 * sin(.7 * t + aS.x * 9.);
        float R0 = 3.1 * (.88 + .12 * aS.z) * (1. + .3 * sin(2. * th + .8 * t) * sin(3. * ph - .6 * t)); return c + vec3(sin(ph) * cos(th) * 1.5, cos(ph) * .75, sin(ph) * sin(th)) * R0; }
      vec3 bpos(float t){ float u = sst(0., 1., (t - 1.6 - aS.z * 1.5 - (aT.x + 4.3) * .07) / 1.7); vec3 tg = aT + vec3(sin(t * 3. + aS.x * 20.), cos(t * 2.6 + aS.y * 20.), sin(t * 2. + aS.z * 9.)) * .04; return mix(flock(t), tg, u); }`,
    pos: "vec3 P = bpos(uT), V = bpos(uT + .02) - P; if (length(V) < 1e-5) V = vec3(1., 0., 0.); vec3 F = normalize(V), Rt = normalize(cross(F, vec3(0., 1., 0.)) + vec3(1e-4)), Up = cross(Rt, F); float fl = sin(uT * 22. + aS.x * 40.) * .7; vec3 lp = transformed * (.8 + .6 * aS.w); lp.y += abs(lp.x) * fl; transformed = P + Rt * lp.x + Up * lp.y + F * lp.z;" }));
  const D0 = fitDist(8.6, 34, 0.86), AZ = pchip([[0, -10], [6, 6]]), EL = pchip([[0, -4], [6, -2]]), DK = pchip([[0, 1.25], [6, 1.02]]);
  return { n: 70, title: "Nuée d'oiseaux", style: "Estampe au couchant", font: "Rubik Black", cam: "grand angle, contre-plongée qui se rapproche", geste: "14 000 oiseaux tournoient, puis se posent en vol pour écrire le mot", scene, camera, accent: "#f39a4a", bloom: [0.15, 0.5, 1.2], tone: "neutral", shutter: 0.35,
    render(t) { U.uT.value = t; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, YW, 0] }); } };
}
