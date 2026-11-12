// 19 · Sortie de l'eau — surréalisme : des lettres chromées émergent d'une mer miroir à l'aube, anneaux d'onde et gouttes qui retombent
import { THREE, word, maskPoints, gpuPoints, pchip, makeCam, fitDist, orbit, eo, clamp, ss, rnd , mot } from "../kit.js";
import { Water } from "three/addons/objects/Water.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32);
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP); float y = d.y; float warm = smoothstep(-.35, .75, -d.z / max(.001, length(d.xz)));
      vec3 dawn = mix(vec3(1.25, .52, .16), vec3(.78, .15, .30), smoothstep(0., .09, y)); dawn = mix(dawn, vec3(.17, .06, .30), smoothstep(.05, .26, y)); dawn = mix(dawn, vec3(.015, .015, .07), smoothstep(.2, .7, y));
      vec3 night = mix(vec3(.06, .09, .24), vec3(.012, .015, .06), smoothstep(0., .5, y)); vec3 c = mix(night, dawn, warm);
      float s = max(0., dot(d, normalize(vec3(0., .085, -1.)))); c += vec3(1.1, .5, .18) * pow(s, 90.) + vec3(6., 3.4, 1.4) * smoothstep(.9984, .9988, s); if (y < 0.) c = mix(mix(vec3(.06, .09, .24), vec3(1.25, .52, .16), warm), vec3(.02, .02, .06), smoothstep(0., -.3, y)); gl_FragColor = vec4(c, 1.); }` });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), skyMat));
  { const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), skyMat)); const pm = new THREE.PMREMGenerator(K.renderer); scene.environment = pm.fromScene(s, 0.01).texture; pm.dispose(); scene.environmentIntensity = 1.0; }
  const nc = document.createElement("canvas"); nc.width = nc.height = 256; { const g = nc.getContext("2d"), im = g.createImageData(256, 256), W = [[3, 1, 0.5, 0.2], [1, 4, 0.35, 1.1], [5, -2, 0.25, 2.3], [-2, 7, 0.2, 0.7], [9, 3, 0.12, 1.9], [4, -9, 0.1, 3.1]], H = (x, y) => W.reduce((a, w) => a + w[2] * Math.sin((w[0] * x + w[1] * y) * Math.PI * 2 / 256 + w[3]), 0);
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const dx = H(x + 1, y) - H(x - 1, y), dy = H(x, y + 1) - H(x, y - 1), n = new THREE.Vector3(-dx * 3.5, -dy * 3.5, 1).normalize(), o = (y * 256 + x) * 4; im.data[o] = (n.x * 0.5 + 0.5) * 255; im.data[o + 1] = (n.y * 0.5 + 0.5) * 255; im.data[o + 2] = (n.z * 0.5 + 0.5) * 255; im.data[o + 3] = 255; } g.putImageData(im, 0, 0); }
  const nt = new THREE.CanvasTexture(nc); nt.wrapS = nt.wrapT = THREE.RepeatWrapping;
  const water = new Water(new THREE.PlaneGeometry(600, 600), { textureWidth: 1024, textureHeight: 1024, waterNormals: nt, sunDirection: new THREE.Vector3(0, 0.085, -1).normalize(), sunColor: 0xa8602c, waterColor: 0x04060f, distortionScale: 1.2, fog: false }); water.rotation.x = -Math.PI / 2; water.material.uniforms.size.value = 2.2; scene.add(water);
  scene.add(new THREE.HemisphereLight(0x5060a0, 0x10102a, 0.3)); const sun = new THREE.DirectionalLight(0xffa050, 3.0); sun.position.set(-6, 2.5, -20); scene.add(sun);
  const TXT = mot(19, "MARÉE"), w = word(TXT, { font: "round", cap: 1.5, depth: 0.55, bevel: 0.07, pivot: "base", bevelSeg: 6, curve: 14 }), chromeM = new THREE.MeshStandardMaterial({ color: 0xf2f2f6, metalness: 1, roughness: 0.07 }), L = [];
  const ringG = new THREE.RingGeometry(0.96, 1, 96); ringG.rotateX(-Math.PI / 2);
  for (const l of w.letters) { const m = new THREE.Mesh(l.geo, chromeM); m.position.x = l.x; scene.add(m); const t0 = 0.45 + l.i * 0.3, rings = [0, 1, 2].map((k) => { const q = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: 0xffb890, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); q.position.set(l.x, 0.02, 0); scene.add(q); return q; }); L.push({ m, t0, rings, x: l.x, w: l.w }); }
  const ND = 70000, DP = maskPoints(TXT, ND, { font: "round", width: w.width, depth: 0.55, seed: 9, res: 1500 }), aL = new Float32Array(ND), HZ = 0.55 / 2 + 0.085;
  for (let i = 0; i < ND; i++) { let b = 0, bd = 1e9; L.forEach((q, k) => { const d = Math.abs(DP[i * 3] - q.x); if (d < bd) { bd = d; b = k; } }); aL[i] = 0.45 + b * 0.3; DP[i * 3 + 1] += 0.75; DP[i * 3 + 2] = (i % 5 === 0 ? -1 : 1) * HZ; }
  const U = { uT: { value: 0 }, uPx: { value: 1 } }, SEED = rnd(ND * 3, 1, 2);
  // 1) ruissellement : 7 000 filets (9 points chacun, en file) glissent sur les faces en accélérant, tant que la lettre est mouillée
  { const NF = 7000, KT = 9, fP = new Float32Array(NF * KT * 3), fL = new Float32Array(NF * KT), fS = new Float32Array(NF * KT * 4);
    for (let i = 0; i < NF; i++) { const j = (i * 9973) % ND; for (let k = 0; k < KT; k++) { const o = i * KT + k; fP.set([DP[j * 3], DP[j * 3 + 1], DP[j * 3 + 2]], o * 3); fL[o] = aL[j]; fS.set([SEED[j * 3], SEED[j * 3 + 1], SEED[j * 3 + 2], k], o * 4); } }
    scene.add(gpuPoints(NF * KT, { aP: [3, fP], aL: [1, fL], aS: [4, fS] }, U, `attribute vec3 aP; attribute vec4 aS; attribute float aL; uniform float uT, uPx; varying float vA;
      void main(){ float tl = uT - aL, rise = 1. - pow(1. - clamp(tl / 1.6, 0., 1.), 4.), per = 1.1 + 1.5 * aS.y, tau = mod(tl - aS.x * per, per) - aS.w * .022, sl = .08 * tau + .5 * tau * tau, y = aP.y - 1.99 * (1. - rise) - sl;
        vec3 p = vec3(aP.x + .01 * sin(sl * 26. + aS.z * 20.), y, aP.z); float head = 1. - aS.w / ${KT}.;
        vA = step(0., tau) * step(0., tl - aS.x * per) * step(.015, y) * (1. - sst(.45, .85, sl)) * (1. - sst(2.6, 4.6, tl)) * head * head;
        vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.2, (.012 + .016 * head) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
      "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.9, 1.6, 1.35) * vA * .5 * smoothstep(.5, .1, d), 1.); }")); }
  // 2) gouttes : elles se détachent du bas des lettres et tombent dans l'eau
  const NDR = 26000, DR = new Float32Array(NDR * 3), aL2 = new Float32Array(NDR); { let k = 0, i = 0; while (k < NDR) { const j = (i * 7919) % ND; i++; if (DP[j * 3 + 1] < 0.62 || i > ND * 6) { DR.set([DP[j * 3], DP[j * 3 + 1], DP[j * 3 + 2] * 0.9], k * 3); aL2[k] = aL[j]; k++; } } }
  scene.add(gpuPoints(NDR, { aP: [3, DR], aL: [1, aL2], aS: [3, rnd(NDR * 3, 1, 12)] }, U, `attribute vec3 aP, aS; attribute float aL; uniform float uT, uPx; varying float vA;
    void main(){ float tl = uT - aL, rise = 1. - pow(1. - clamp(tl / 1.6, 0., 1.), 4.), per = .8 + 1.1 * aS.y, tau = mod(tl - aS.x * per, per), y0 = aP.y * .35 - 1.99 * (1. - rise) * .0 + .02, y = aP.y * .45 * rise + .04 - 5.2 * tau * tau;
      vec3 p = vec3(aP.x, y, aP.z + (aS.z - .5) * .12); vA = step(0., tl - .5 - aS.x * per) * step(.01, y) * (1. - sst(3.2, 5.0, tl)) * (.5 + .5 * aS.y);
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.4, (.03 + .03 * aS.x) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.8, 1.3, .9) * vA * .6 * smoothstep(.5, .1, d), 1.); }"));
  const D0 = fitDist(w.width, 32, 0.84), AZ = pchip([[0, -26], [3.2, -6], [6, 8]]), EL = pchip([[0, 1.2], [3, 4], [6, 6]]), DK = pchip([[0, 1.35], [3.4, 1.05], [6, 0.96]]);
  return { n: 19, title: "Sortie de l'eau", style: "Surréalisme (mer miroir à l'aube)", font: "Nunito Black", cam: "au ras de l'eau, qui s'élève à peine en arc", geste: "les lettres émergent ; l'eau ruisselle sur les faces et goutte", scene, camera, accent: "#ff8a5c", bloom: [0.4, 0.6, 1.25], exposure: 1.0,
    render(t, K) {
      U.uT.value = t; U.uPx.value = K.px(camera); water.material.uniforms.time.value = t * 0.5;
      for (const q of L) { const u = clamp((t - q.t0) / 1.6), e = eo(u); q.m.position.y = -1.95 * (1 - e) - 0.04; q.rings.forEach((rg, k) => { const a = clamp((t - q.t0 - k * 0.35) / 1.7); rg.scale.setScalar(0.3 + 2.6 * a + q.w * 0.3); rg.material.opacity = t > q.t0 + k * 0.35 ? 0.5 * (1 - a) * (1 - a) : 0; }); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.7, 0] });
    } };
}
