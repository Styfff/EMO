// 18 · Vortex — graffiti : 150 000 gouttes de peinture tourbillonnent devant un mur de béton, puis se plaquent en mot, avec coulures
import { THREE, maskPoints, canvasTex, gpuPoints, pchip, makeCam, fitDist, orbit, eio, mulberry, rnd , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = new THREE.Color(0x8d8a84);
  const r = mulberry(40), wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 1280, (g, w, h) => { g.fillStyle = "#a9a6a0"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26000; i++) { const v = 120 + r() * 90; g.fillStyle = `rgba(${v},${v - 3},${v - 8},${0.05 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(60,58,55,0.16)"; g.fillRect(0, (i + 0.5) * h / 5, w, 3); g.fillRect((i + 0.3) * w / 5, 0, 3, h); }
    for (let i = 0; i < 40; i++) { const x = r() * w, y = r() * h, gr = g.createRadialGradient(x, y, 0, x, y, 60 + r() * 160); gr.addColorStop(0, `rgba(${r() < 0.5 ? "70,68,64" : "200,198,190"},0.10)`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }) })); wall.material.map.wrapS = wall.material.map.wrapT = THREE.RepeatWrapping; wall.material.map.repeat.set(2, 2); wall.material.color.setScalar(0.82); scene.add(wall);
  const N = 150000, T = maskPoints(mot(18, "VORTEX"), N, { font: "marker", width: 6.5, res: 1500, seed: 3 }), aC = new Float32Array(N * 3), C = [[1.0, 0.08, 0.62], [0.05, 0.85, 1.0], [0.72, 1.0, 0.1]];
  for (let i = 0; i < N; i++) { const f = (T[i * 3] + 3.25) / 6.5 * 2 + (r() - 0.5) * 0.5 + T[i * 3 + 1] * 0.25, k = f < 0.7 ? 0 : f < 1.35 ? 1 : 2, w = r() < 0.04 ? [1.2, 1.2, 1.2] : C[k]; aC.set(w, i * 3); T[i * 3 + 2] = 0.02 + r() * 0.01; }
  const U = { uT: { value: 0 }, uPx: { value: 1 } };
  scene.add(gpuPoints(N, { aT: [3, T], aC: [3, aC], aS: [4, rnd(N * 4, 1, 21)] }, U, `attribute vec3 aT, aC; attribute vec4 aS; uniform float uT, uPx; varying vec3 vC;
    void main(){ float u1 = sst(0., 1., (uT - 2.2 - aS.x * 1.3 - (aT.x + 3.3) * .08) / .7), r0 = .25 + 4.3 * aS.y * sqrt(aS.y), rr = r0 * (1. - .5 * sst(0., 2.8, uT)) + .15 * sin(uT * 3. + aS.w * 9.);
      float ang = floor(aS.z * 3.) * 2.0944 + fract(aS.z * 3.) * .9 + uT * (1.2 + 4.2 / (rr + .4)) - rr * .9, zz = .8 + 5. * (rr / 4.2) + .5 * sin(uT * 2. + aS.w * 6.283);
      vec3 pv = vec3(cos(ang) * rr, sin(ang) * rr, zz), p = mix(pv, aT, u1 * u1 * (3. - 2. * u1)); vec4 mv = modelViewMatrix * vec4(p, 1.); float arm = fract(aS.z * 3. + r0 * .12); vec3 ac = arm < .33 ? vec3(1., .08, .62) : arm < .66 ? vec3(.05, .85, 1.) : vec3(.72, 1., .1); vC = mix(mix(ac, vec3(.12), step(.8, fract(aS.z * 3. + .5))), aC, sst(.2, .9, u1)) * (.55 + .45 * aS.w);
      gl_PointSize = max(1.6, mix(.034 + .05 * aS.w * aS.w, .024, u1) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying vec3 vC; void main(){ if (length(gl_PointCoord - .5) > .5) discard; gl_FragColor = vec4(vC, 1.); }", { blending: THREE.NormalBlending }));
  const ND = 90, NPD = 220, dP = new Float32Array(ND * NPD * 4), dC = new Float32Array(ND * NPD * 3);
  for (let d = 0; d < ND; d++) { let k = (r() * N) | 0, tries = 0; while (T[k * 3 + 1] > -0.1 && tries++ < 60) k = (r() * N) | 0; const len = 0.25 + r() * r() * 1.9, st = r() * 0.8;
    for (let j = 0; j < NPD; j++) { const f = j / NPD, o = (d * NPD + j) * 4; dP.set([T[k * 3] + (r() - 0.5) * 0.02 * (1 + 2 * f * f * f), T[k * 3 + 1] - len * f, f, st], o); dC.set([aC[k * 3], aC[k * 3 + 1], aC[k * 3 + 2]], (d * NPD + j) * 3); } }
  scene.add(gpuPoints(ND * NPD, { aP: [4, dP], aC: [3, dC] }, U, `attribute vec4 aP; attribute vec3 aC; uniform float uT, uPx; varying vec3 vC; varying float vA;
    void main(){ float g = sst(0., 1., (uT - 3.6 - aP.w) / 1.5); vA = step(aP.z, g); vC = aC * .78; vec4 mv = modelViewMatrix * vec4(aP.x, aP.y, .035, 1.); gl_PointSize = max(1.6, (.03 + .03 * sst(.8, 1., aP.z / max(g, .01))) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying vec3 vC; varying float vA; void main(){ if (vA < .5 || length(gl_PointCoord - .5) > .5) discard; gl_FragColor = vec4(vC, 1.); }", { blending: THREE.NormalBlending }));
  const D0 = fitDist(6.9, 30, 0.88), DK = pchip([[0, 1.5], [2.6, 1.3], [4.4, 1.0], [6, 0.95]]), AZ = pchip([[0, 22], [3, 6], [6, -4]]);
  return { n: 18, title: "Vortex", style: "Graffiti (bombe et coulures)", font: "Permanent Marker", cam: "face au mur, en roulis d'un demi-tour qui se redresse", geste: "150 000 gouttes tourbillonnent, se plaquent en mot et coulent", scene, camera, accent: "#ff1a9e", bloom: [0.1, 0.5, 1.2], tone: "neutral", vig: 0.45,
    render(t, K) { U.uT.value = t; U.uPx.value = K.px(camera); orbit(camera, { az: AZ(t), el: 2, dist: D0 * DK(t), target: [0, -0.35, 0], roll: 2.6 * (1 - eio(t / 3.4)) }); } };
}
