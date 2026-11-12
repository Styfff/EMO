// 45 · Arcs électriques — laboratoire steampunk : une bobine haute tension foudroie chaque lettre de cuivre, qui rougit ; puis de petits arcs courent d'une lettre à l'autre
import { THREE, word, maskPoints, gpuPoints, chrome, matte, pchip, makeCam, fitDist, orbit, ss, mulberry, rnd, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.35; scene.background = bgRadial("#14233a", "#080d16", "#020305");
  scene.add(new THREE.HemisphereLight(0x6a86c0, 0x0a0806, 0.35)); const key = new THREE.DirectionalLight(0xffe2c0, 1.2); key.position.set(-5, 6, 7); scene.add(key);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.45, metalness: 0.6 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const CZ = -3.4, coil = new THREE.Group(); coil.position.set(0, 0, CZ); scene.add(coil);
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.5, 40), matte(0x1a1410, { roughness: 0.5, metalness: 0.6 })); b.position.y = 0.25; coil.add(b); }
  { const pts = []; for (let k = 0; k <= 900; k++) { const a = k * 0.2, y = 0.55 + k * 0.0033; pts.push(new THREE.Vector3(Math.cos(a) * 0.42, y, Math.sin(a) * 0.42)); } coil.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 1800, 0.022, 6), new THREE.MeshStandardMaterial({ color: 0xd9824a, metalness: 1, roughness: 0.3 }))); }
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 3.0, 24), matte(0x2b2018, { roughness: 0.7 })); c.position.y = 2.05; coil.add(c); }
  const TOP = 3.95, torus = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.26, 24, 64), chrome({ roughness: 0.12 })); torus.rotation.x = Math.PI / 2; torus.position.y = TOP; coil.add(torus);
  const glow = new THREE.PointLight(0x7fb0ff, 0, 18); glow.position.set(0, TOP, CZ + 0.6); scene.add(glow);
  const CAP = 1.25, w = word(mot(45, "VOLTAGE"), { font: "rock", cap: CAP, depth: 0.36, bevel: 0.03, pivot: "base" }), N = w.letters.length, L = [];
  for (const l of w.letters) { const mat = new THREE.MeshStandardMaterial({ color: 0xc8753f, metalness: 1, roughness: 0.28, emissive: new THREE.Color(1.6, 0.35, 0.05), emissiveIntensity: 0 }), m = new THREE.Mesh(l.geo, mat); m.position.x = l.x; scene.add(m); L.push({ m, mat, x: l.x, ti: 0.75 + l.i * 0.36 }); }
  const SLOTS = 9, core = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.6, 4.0), fog: false }), halo = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.45, 1.3), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }), arcs = [];
  for (let i = 0; i < SLOTS; i++) { const a = new THREE.Mesh(new THREE.BufferGeometry(), core), b = new THREE.Mesh(new THREE.BufferGeometry(), halo); a.frustumCulled = b.frustumCulled = false; scene.add(a, b); arcs.push([a, b]); }
  const bolt = (A, B, seed, rough) => { const r = mulberry(seed); let P = [A.clone(), B.clone()]; let d = A.distanceTo(B) * rough; for (let lv = 0; lv < 5; lv++) { const Q = [P[0]]; for (let i = 0; i < P.length - 1; i++) { const m = P[i].clone().add(P[i + 1]).multiplyScalar(0.5); m.x += (r() - 0.5) * d; m.y += (r() - 0.5) * d; m.z += (r() - 0.5) * d; Q.push(m, P[i + 1]); } P = Q; d *= 0.55; } return P; };
  const setArc = (k, pts, rc) => { const c = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1); for (const [j, rad] of [[0, rc], [1, rc * 4.2]]) { const m = arcs[k][j]; m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(c, pts.length * 2, rad, 5); m.visible = true; } };
  const NSP = 24000, aP = new Float32Array(NSP * 4); { const r = mulberry(45); for (let i = 0; i < NSP; i++) { const q = L[i % N]; aP.set([q.x + (r() - 0.5) * 0.5, CAP * 0.92, (r() - 0.5) * 0.3, q.ti + r() * 0.45], i * 4); } }
  const U = { uT: { value: 0 }, uPx: { value: 1 } }; scene.add(gpuPoints(NSP, { aP: [4, aP], aS: [3, rnd(NSP * 3, 1, 46)] }, U, `attribute vec4 aP; attribute vec3 aS; uniform float uT, uPx; varying float vA;
    void main(){ float tau = uT - aP.w; vec3 v = vec3((aS.x - .5) * 4., 1. + 3.5 * aS.y, (aS.z - .5) * 3.); vec3 p = aP.xyz + v * tau + vec3(0., -9.8, 0.) * tau * tau; p.y = max(p.y, .01); vA = step(0., tau) * (1. - sst(.25, .8, tau));
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.2, .016 * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(3., 1.8, .7) * vA * smoothstep(.5, .1, d), 1.); }"));
  const D0 = fitDist(w.width, 30, 0.86), AZ = pchip([[0, -26], [3, -8], [6, 10]]), EL = pchip([[0, 7], [6, 11]]), DK = pchip([[0, 1.18], [6, 1.02]]), V = THREE.Vector3;
  return { n: 45, title: "Arcs électriques", style: "Laboratoire steampunk", font: "Zilla Slab Bold", cam: "basse en arc lent, la bobine derrière le mot", geste: "la bobine foudroie chaque lettre, puis les arcs courent de lettre en lettre", scene, camera, accent: "#7fb0ff", bloom: [0.55, 0.55, 0.85],
    render(t, K) {
      U.uT.value = t; U.uPx.value = K.px(camera); const slot = Math.floor(t * 15); let k = 0; for (const a of arcs) a[0].visible = a[1].visible = false;
      const top = new V(0, TOP + 0.05, CZ);
      for (const q of L) { const d = t - q.ti; if (d > 0 && d < 0.55) { setArc(k++, bolt(top, new V(q.x, CAP * 0.95, 0.05), slot * 31 + q.x * 7 | 0, 0.28), 0.014); if (k < SLOTS) setArc(k++, bolt(top, new V(q.x + 0.2, CAP * 0.7, 0.1), slot * 17 + 3 + q.x * 11 | 0, 0.32), 0.009); }
        q.mat.emissiveIntensity = 1.1 * ss(q.ti, q.ti + 0.35, t) * (1 - 0.55 * ss(q.ti + 0.6, q.ti + 2.4, t)); }
      if (t > 3.5) for (let i = 0; i < N - 1 && k < SLOTS; i++) { if (((slot + i) % 3) === 0) setArc(k++, bolt(new V(L[i].x + 0.15, CAP * 0.85, 0.05), new V(L[i + 1].x - 0.15, CAP * 0.85, 0.05), slot * 13 + i * 5, 0.35), 0.008); }
      glow.intensity = 22 * (t < 3.4 ? 1 : 0.6) * (0.85 + 0.15 * Math.sin(t * 40));
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 1.75, -0.8] });
    } };
}
