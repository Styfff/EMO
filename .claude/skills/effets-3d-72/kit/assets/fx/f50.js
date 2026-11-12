// 50 · Spectacle laser — rave : dans la brume, l'émetteur balaie la salle en éventail, puis quatre faisceaux tracent le mot au mur, qui reste allumé
import { THREE, wordContours, gpuPoints, pchip, makeCam, fitDist, orbit, clamp, rnd, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(34); scene.background = new THREE.Color(0x03060a); scene.fog = new THREE.Fog(0x061018, 8, 30);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.9 })); wall.position.set(0, 6, -2.2); scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.25, metalness: 0.6 })); floor.rotation.x = -Math.PI / 2; scene.add(floor); scene.add(new THREE.HemisphereLight(0x3060a0, 0x000000, 0.25));
  const EM = new THREE.Vector3(0, 0.6, 7.5), em = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x1b1f26, metalness: 0.7, roughness: 0.4 })); em.position.copy(EM); scene.add(em);
  const TXT = mot(50, "LASER"), YW = 2.6, C = wordContours(TXT, { font: "optima", cap: 1.7, track: 0.06, step: 0.02 }), GRN = new THREE.Color(0.35, 3.0, 0.7), PNK = new THREE.Color(3.0, 0.35, 1.9), tubes = [];
  const cM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 3.2, 1.6), fog: false, toneMapped: false }), hM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.15, 1.2, 0.35), transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const NB = 4, perBeam = Array.from({ length: NB }, () => []); C.forEach((c, k) => perBeam[Math.min(NB - 1, Math.floor((c.li / TXT.length) * NB + (c.hole ? 0 : 0)))].push(c));
  const T1 = 2.2, T2 = 4.8; perBeam.forEach((list, b) => { const tot = list.reduce((s, c) => s + c.len, 0); let acc = 0; for (const c of list) { const curve = new THREE.CatmullRomCurve3(c.pts.map((p) => new THREE.Vector3(p[0], p[1] + YW, -2.15)), true), seg = c.pts.length, gc = new THREE.TubeGeometry(curve, seg, 0.03, 6, true), gh = new THREE.TubeGeometry(curve, seg, 0.11, 6, true), mc = new THREE.Mesh(gc, cM), mh = new THREE.Mesh(gh, hM); scene.add(mc, mh); tubes.push({ b, mc, mh, seg, c, f0: acc / tot, f1: (acc + c.len) / tot }); acc += c.len; } });
  const beamG = new THREE.CylinderGeometry(0.012, 0.012, 1, 6); beamG.translate(0, 0.5, 0); const NF = 14, fan = Array.from({ length: NF }, (_, i) => { const m = new THREE.Mesh(beamG, new THREE.MeshBasicMaterial({ color: (i % 3 === 0 ? PNK : GRN).clone().multiplyScalar(0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.frustumCulled = false; scene.add(m); return m; });
  const draw = Array.from({ length: NB }, () => { const m = new THREE.Mesh(beamG, new THREE.MeshBasicMaterial({ color: GRN.clone().multiplyScalar(0.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); m.frustumCulled = false; scene.add(m); return m; });
  const NH = 30000, U = { uT: { value: 0 }, uPx: { value: 1 } }; scene.add(gpuPoints(NH, { aS: [4, rnd(NH * 4, 1, 50)] }, U, `attribute vec4 aS; uniform float uT, uPx; varying float vA;
    void main(){ vec3 p = vec3((aS.x - .5) * 14. + .3 * sin(uT * .3 + aS.w * 20.), aS.y * 7., -2. + aS.z * 10.); vec4 mv = modelViewMatrix * vec4(p, 1.); vA = .035 + .03 * aS.w; gl_PointSize = max(1.2, .05 * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(.3, .6, .8) * vA * smoothstep(.5, .0, d), 1.); }"));
  const Y = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), aim = (m, P) => { dir.subVectors(P, EM); const L = dir.length(); m.position.copy(EM); m.quaternion.setFromUnitVectors(Y, dir.normalize()); m.scale.set(1, L, 1); };
  const tipOf = (b, f) => { for (const q of tubes) if (q.b === b && f >= q.f0 && f <= q.f1) { const u = (f - q.f0) / (q.f1 - q.f0), n = q.c.pts.length, i = Math.min(n - 1, Math.floor(u * n)), p = q.c.pts[i]; return new THREE.Vector3(p[0], p[1] + YW, -2.15); } return null; };
  const D0 = fitDist(C.width, 34, 0.84), AZ = pchip([[0, 40], [2.4, 18], [4.6, 0], [6, 0]]), EL = pchip([[0, 4], [6, 6]]), DK = pchip([[0, 1.3], [3, 1.4], [6, 1.25]]);
  return { n: 50, title: "Spectacle laser", style: "Rave (vert laser et brume)", font: "Alegreya Sans Black", cam: "de côté près de l'émetteur, puis de face", geste: "l'éventail balaie la brume, puis quatre faisceaux tracent le mot au mur", scene, camera, accent: "#3cff7a", bloom: [0.7, 0.55, 0.8],
    render(t, K) {
      U.uT.value = t; U.uPx.value = K.px(camera); const fanOn = clamp((t - 0.2) / 0.3) * (1 - clamp((t - T1 + 0.1) / 0.3));
      fan.forEach((m, i) => { const a = (i / (NF - 1) - 0.5) * 1.6 + 0.5 * Math.sin(t * 1.7 + i * 0.4), e = 0.35 + 0.25 * Math.sin(t * 1.3 + i); aim(m, new THREE.Vector3(EM.x + Math.sin(a) * 12, EM.y + Math.sin(e) * 8, EM.z - Math.cos(a) * 12)); m.material.opacity = 0.55 * fanOn; m.visible = fanOn > 0.01; });
      const prog = clamp((t - T1) / (T2 - T1));
      for (const q of tubes) { const u = clamp((prog - q.f0) / (q.f1 - q.f0)), n = Math.floor(u * q.seg) * 6 * 6; q.mc.geometry.setDrawRange(0, n); q.mh.geometry.setDrawRange(0, n); }
      draw.forEach((m, b) => { const p = prog > 0 && prog < 1 ? tipOf(b, prog) : null; m.visible = !!p; if (p) aim(m, p); });
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, YW - 0.2, 1.2] });
    } };
}
