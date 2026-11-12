// 9 · Tunnel typographique — cyberpunk : anneaux de néon contrarotatifs, hexagones lumineux, 18 u/s, le dernier anneau se range en ligne
import { THREE, word, pchip, makeCam, fitDist, gpuPoints, rnd, eo, ss, clamp, lerp , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(58); scene.background = new THREE.Color(0x05020a); scene.fog = new THREE.Fog(0x05020a, 8, 46);
  const NR = 7, DZ = 4.5, RR = 2.6, MAG = [1.7, 0.1, 1.25], CYA = [0.08, 1.2, 1.6], YEL = [1.6, 1.15, 0.08], COL = [MAG, CYA, YEL], WORDS = ["VITESSE·", "LETTRES·", "TUNNEL··"], rings = [];
  const dot = new THREE.SphereGeometry(0.08, 12, 8), cache = {};
  for (let k = 0; k < NR; k++) {
    const txt = WORDS[k % 3], g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(...COL[k % 3]), transparent: true }); g.position.z = -k * DZ;
    const G = cache[txt] || (cache[txt] = word(txt.replace(/·/g, "I"), { font: "phos", cap: 1.05, depth: 0.1, bevel: 0 }).letters);
    [...txt].forEach((ch, j) => { const a = Math.PI / 2 - j * 2 * Math.PI / txt.length, m = new THREE.Mesh(ch === "·" ? dot : G[j].geo, mat); m.position.set(Math.cos(a) * RR, Math.sin(a) * RR, 0); m.rotation.z = a - Math.PI / 2; g.add(m); });
    const hx = new THREE.Mesh(new THREE.TorusGeometry(RR + 1.15, 0.035, 6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(...COL[(k + 1) % 3]), transparent: true })); hx.position.z = -DZ / 2; g.add(hx);
    scene.add(g); rings.push({ g, mat, hm: hx.material, hx, k });
  }
  const NS = 14000, U = { uT: { value: 0 }, uZ: { value: 0 }, uPx: { value: 1 } };
  scene.add(gpuPoints(NS, { aS: [4, rnd(NS * 4, 1, 3)] }, U, `attribute vec4 aS; uniform float uZ, uPx; varying float vA; varying vec3 vC;
    void main(){ float a = aS.x * 6.2832, q = 3.9 + aS.y * 5.; vec3 p = vec3(cos(a) * q, sin(a) * q, uZ + 6. - mod(aS.z * 70. + uZ, 70.)); vec4 mv = modelViewMatrix * vec4(p, 1.);
      vA = smoothstep(46., 20., -mv.z); vC = aS.w < .33 ? vec3(1.2, .08, .9) : aS.w < .66 ? vec3(.06, .9, 1.2) : vec3(.6); gl_PointSize = max(1.2, .022 * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * vA * smoothstep(.5, .15, d), 1.); }"));
  const ZF = -NR * DZ - 6, fw = word(mot(9, "ARRIVÉE"), { font: "phos", cap: 0.8, depth: 0.1, bevel: 0 }), F = [], DF = fitDist(fw.width, 58, 0.82);
  for (const l of fw.letters) { const m = new THREE.Mesh(l.geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(...(l.ch === "É" ? MAG : [1.15, 1.15, 1.25])), fog: false, transparent: true })); scene.add(m); F.push({ m, x: l.x, i: l.i }); }
  const CZ = pchip([[0, 9], [3.9, -21], [5.4, ZF + DF * 1.05], [6, ZF + DF]]);
  return { n: 9, title: "Tunnel typographique", style: "Cyberpunk (néon)", font: "Bungee", cam: "vol FPV à 8 unités/s, léger roulis", geste: "7 anneaux de néon contrarotatifs, lisibles ; le dernier se range", scene, camera, accent: "#ff3bd0", bloom: [0.34, 0.5, 0.95], ca: 0.015, shutter: 0.4,
    render(t, K) {
      const cz = CZ(t), calm = 1 - ss(3.3, 5, t), roll = 0.09 * Math.sin(t * 1.1) * calm; U.uZ.value = cz; U.uPx.value = K.px(camera);
      for (const q of rings) { q.g.rotation.z = (q.k % 2 ? -1 : 1) * (0.28 * t + q.k * 0.5); const dz = cz - q.g.position.z, o = clamp((dz - 0.4) / 1.6); q.mat.opacity = o; q.hm.opacity = clamp((dz + DZ / 2 - 0.4) / 1.6); q.g.visible = dz > -DZ / 2; q.hx.rotation.z = -2 * q.g.rotation.z + q.k; }
      for (const f of F) { const u = eo((t - 3.9 - f.i * 0.06) / 1.4), a = Math.PI / 2 - f.i * 2 * Math.PI / 7 - 0.28 * t;
        f.m.position.set(lerp(Math.cos(a) * RR, f.x, u), lerp(Math.sin(a) * RR, 0, u), ZF); f.m.rotation.z = (a - Math.PI / 2) * (1 - u); f.m.material.opacity = ss(2.2, 3.6, t) * (t > 5.25 && t < 5.6 ? (Math.sin(t * 90 + f.i * 2) > -0.3 ? 1 : 0.25) : 1); }
      camera.position.set(0.25 * Math.sin(t * 1.1) * calm, 0.18 * Math.cos(t * 0.9) * calm, cz); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(0, 0, cz - 10); camera.updateMatrixWorld();
    } };
}
