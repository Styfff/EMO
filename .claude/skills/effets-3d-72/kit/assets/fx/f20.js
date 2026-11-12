// 20 · Feu d'artifice — cinq bouquets, un par lettre : les étincelles de chaque explosion retombent en place et deviennent la lettre
import { THREE, word, maskPoints, gpuPoints, pchip, makeCam, orbit, mulberry, bgLinear, canvasTex , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(40); scene.background = bgLinear([[0, "#01020a"], [0.6, "#070b24"], [0.82, "#121a40"], [1, "#05060f"]]);
  const TXT = mot(20, "BRAVO"), WW = 7.4, YW = 1.9, wd = word(TXT, { font: "cochin", cap: 1, depth: 0.1, bevel: 0 }), sc = WW / wd.width, LX = wd.letters.map((l) => l.x * sc), DTB = Math.min(0.62, 2.6 / Math.max(1, wd.letters.length - 1));
  const SH = LX.map((x, i) => [x, YW + 0.15, 0.6 + i * DTB, 0]), COL5 = [[2.8, 1.9, 0.5], [2.6, 0.35, 1.7], [0.3, 1.9, 2.7], [2.8, 1.9, 0.5], [2.6, 0.35, 1.7]], COL = LX.map((_, i) => COL5[i % 5]);
  const NPT = 110000, J = 4, r = mulberry(99), WT = maskPoints(TXT, NPT, { font: "cochin", width: WW, seed: 5, res: 1500 }), N = NPT * J;
  const aB = new Float32Array(N * 2), aD = new Float32Array(N * 3), aT = new Float32Array(N * 3), aS = new Float32Array(N * 3);
  for (let i = 0; i < NPT; i++) { const x = WT[i * 3], y = WT[i * 3 + 1] + YW; let s = 0, bd = 1e9; LX.forEach((lx, k) => { const d = Math.abs(x - lx); if (d < bd) { bd = d; s = k; } });
    const z = r() * 2 - 1, a = r() * 6.283, q = Math.sqrt(1 - z * z), sp = (r() < 0.25 ? 1.5 : 3.1) * (0.85 + r() * 0.3), s1 = r(), s2 = r(), s3 = r();
    for (let j = 0; j < J; j++) { const k = i * J + j; aB.set([s, j], k * 2); aD.set([Math.cos(a) * q * sp, z * sp, Math.sin(a) * q * sp * 0.6], k * 3); aT.set([x, y, 0], k * 3); aS.set([s1, s2, s3], k * 3); } }
  const U = { uT: { value: 0 }, uPx: { value: 1 }, uSh: { value: SH.map((s) => new THREE.Vector4(...s)) }, uCol: { value: COL.map((c) => new THREE.Vector3(...c)) }, uFlip: { value: 0 } };
  const VS = `attribute vec2 aB; attribute vec3 aD, aT, aS; uniform float uT, uPx, uFlip; uniform vec4 uSh[${LX.length}]; uniform vec3 uCol[${LX.length}]; varying vec3 vC;
    void main(){ int s = int(aB.x + .5); vec4 sh = uSh[s]; float tau = uT - sh.z - aB.y * .028, a = 0.; vec3 c0 = vec3(sh.x, sh.y, 0.), p = c0, col = uCol[s];
      if (tau < 0.) { float tr = clamp((tau + .6) / .6, 0., 1.); p = vec3(sh.x + .05 * sin(tr * 12. + sh.z * 5.), mix(-3.2, sh.y, 1. - (1. - tr) * (1. - tr)) - aS.x * .5 * (1. - tr), 0.); a = (aS.y < .0015 && tr > 0. && tr < 1.) ? 2.5 : 0.; col = vec3(2.2, 1.6, .8); }
      else { float k = 1.5, q = (1. - exp(-k * tau)) / k; vec3 pe = c0 + aD * q + vec3(0., -1.2, 0.) * (tau - q) / k; float u = sst(.45, 1.5, tau + aS.z * .25); u = u * u * (3. - 2. * u);
        float late = max(0., uT - 5.35 - aS.x * .5); p = mix(pe, aT + vec3(sin(tau * 7. + aS.x * 30.), cos(tau * 6. + aS.y * 30.), 0.) * .012, u) + vec3((aS.x - .5) * .3 * late, -1.2 * late * late, 0.);
        a = (.55 + .45 * sin(tau * 30. + aS.x * 50.)) * mix(1., .34, u) * (1. - sst(.9, 1.5, late)) * (tau < .08 ? 2.6 : 1.); col = mix(col, vec3(2.8, 2.3, 1.3), u * .55); }
      a *= 1. - aB.y / ${J}. * .8;
      if (uFlip > .5) { p.y = -6.4 - p.y; p.x += .07 * sin(p.y * 9. + uT * 2.5); a *= .26; }
      vec4 mv = modelViewMatrix * vec4(p, 1.); vC = col * a; gl_PointSize = max(1.3, (.034 - .005 * aB.y) * (.6 + .8 * aS.y) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, FS = "varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * .2 * smoothstep(.5, .05, d), 1.); }";
  const fw = gpuPoints(N, { aB: [2, aB], aD: [3, aD], aT: [3, aT], aS: [3, aS] }, U, VS, FS); scene.add(fw);
  const fl = new THREE.Points(fw.geometry, fw.material.clone()); fl.material.uniforms = { ...U, uFlip: { value: 1 } }; fl.frustumCulled = false; scene.add(fl);
  const city = new THREE.Mesh(new THREE.PlaneGeometry(26, 2.6), new THREE.MeshBasicMaterial({ transparent: true, map: canvasTex(2048, 205, (g, w, h) => { let x = 0; while (x < w) { const bw = 26 + r() * 70, bh = 30 + r() * r() * 170; g.fillStyle = "#04050c"; g.fillRect(x, h - bh, bw, bh); for (let yy = h - bh + 8; yy < h - 6; yy += 11) for (let xx = x + 5; xx < x + bw - 6; xx += 9) if (r() < 0.2) { g.fillStyle = r() < 0.7 ? "#ffd27a" : "#9fd8ff"; g.fillRect(xx, yy, 4, 5); } x += bw + 2; } }) })); city.position.set(0, -3.2 + 1.3, -1); scene.add(city);
  const AZ = pchip([[0, -9], [6, 7]]), EL = pchip([[0, -9], [6, -5]]), DK = pchip([[0, 18.5], [6, 16.2]]), TY = pchip([[0, 0.6], [3, 1.1], [6, 1.25]]);
  return { n: 20, title: "Feu d'artifice", style: "Lumière pure (nuit de fête)", font: "Cormorant Garamond Bold", cam: "contre-plongée, arc lent, secousse à chaque bouquet", geste: "cinq bouquets : les étincelles de chacun deviennent une lettre", scene, camera, accent: "#ffcf5a", bloom: [0.42, 0.6, 0.8], shutter: 0.6,
    render(t, K) { U.uT.value = t; U.uPx.value = K.px(camera); fl.material.uniforms.uT.value = t; fl.material.uniforms.uPx.value = U.uPx.value; let sh = 0; for (const s of SH) { const d = t - s[2]; if (d > 0) sh += Math.exp(-d / 0.18) * Math.sin(d * 55) * 0.05; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: DK(t), target: [0, TY(t) + sh, 0] }); } };
}
