// 52 · Pluie de météores — fin du monde : les lettres tombent du ciel en feu, s'écrasent ; onde de choc, cratère, 30 000 éclats ; puis elles refroidissent
import { THREE, word, gpuPoints, pchip, makeCam, fitDist, orbit, clamp, ei, ss, rnd, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32); scene.environment = K.env; scene.environmentIntensity = 0.25; scene.background = bgLinear([[0, "#05030f"], [0.55, "#1a1238"], [0.8, "#4a2440"], [1, "#2a1622"]]);
  scene.add(new THREE.HemisphereLight(0x6070b0, 0x201010, 0.5)); const moon = new THREE.DirectionalLight(0x9db0ff, 0.9); moon.position.set(4, 8, 5); scene.add(moon);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x2a2228, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const CAP = 1.5, w = word(mot(52, "IMPACT"), { font: "phos", cap: CAP, depth: 0.5, bevel: 0.03, pivot: "base" }), DIR = new THREE.Vector3(-0.55, -1, -0.35).normalize(), FALL = 0.85, L = [];
  const trailG = new THREE.ConeGeometry(0.55, 1, 20, 1, true); trailG.translate(0, -0.5, 0); trailG.rotateX(Math.PI);
  const crG = new THREE.CircleGeometry(1, 48); crG.rotateX(-Math.PI / 2); const ringG = new THREE.RingGeometry(0.92, 1, 64); ringG.rotateX(-Math.PI / 2);
  w.letters.forEach((l, i) => { const mat = new THREE.MeshStandardMaterial({ color: 0x3a3438, roughness: 0.75, emissive: new THREE.Color(3.2, 1.6, 0.5), emissiveIntensity: 1 }), m = new THREE.Mesh(l.geo, mat); scene.add(m);
    const tr = new THREE.Mesh(trailG, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.9, 0.25), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(tr);
    const cr = new THREE.Mesh(crG, new THREE.MeshBasicMaterial({ color: 0x0e0a0c, transparent: true, opacity: 0 })); cr.position.set(l.x, 0.005, 0.1); scene.add(cr);
    const ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.2, 0.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); ring.position.set(l.x, 0.02, 0); scene.add(ring);
    const pl = new THREE.PointLight(0xff7a2a, 0, 9); scene.add(pl); L.push({ m, mat, tr, cr, ring, pl, x: l.x, ti: 0.9 + ([0, 0.55, 0.25, 0.85, 0.4, 1.1][i % 6] + Math.floor(i / 6) * 0.12) * 1.4 }); });
  const NS = 30000, aI = new Float32Array(NS * 2); for (let i = 0; i < NS; i++) aI.set([L[i % L.length].x, L[i % L.length].ti], i * 2);
  const U = { uT: { value: 0 }, uPx: { value: 1 } }; scene.add(gpuPoints(NS, { aI: [2, aI], aS: [4, rnd(NS * 4, 1, 53)] }, U, `attribute vec2 aI; attribute vec4 aS; uniform float uT, uPx; varying vec3 vC;
    void main(){ float tau = uT - aI.y, a = aS.x * 6.2832, sp = 1.5 + 5. * aS.y * aS.y; vec3 p = vec3(aI.x + cos(a) * sp * tau * .8, (2. + 4. * aS.z) * tau - 6. * tau * tau, sin(a) * sp * tau * .6); p.y = max(p.y, .02);
      vC = mix(vec3(3., 1.5, .4), vec3(.25, .2, .2), sst(.0, .9, tau)) * step(0., tau) * (1. - sst(1., 1.8, tau)); vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.2, (.016 + .03 * aS.w) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, "varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vC, 1.); }", { blending: THREE.NormalBlending }));
  const D0 = fitDist(w.width, 32, 0.84), AZ = pchip([[0, 18], [6, 6]]), EL = pchip([[0, 4], [6, 9]]), DK = pchip([[0, 1.25], [6, 1.02]]), Y = new THREE.Vector3(0, 1, 0);
  return { n: 52, title: "Pluie de météores", style: "Fin du monde (nuit et feu)", font: "Bungee", cam: "rasante, secouée à chaque impact", geste: "les lettres tombent en feu, s'écrasent, puis refroidissent ; 30 000 éclats", scene, camera, accent: "#ff7a2a", bloom: [0.55, 0.6, 0.85],
    render(t, K) {
      U.uT.value = t; U.uPx.value = K.px(camera); let shake = 0;
      for (const q of L) { const u = clamp((t - q.ti + FALL) / FALL), d = 22 * (1 - ei(u)), hit = t - q.ti; q.m.position.set(q.x - DIR.x * d, -DIR.y * d, -DIR.z * d); q.m.rotation.z = (1 - u) * 0.6; q.m.visible = u > 0;
        q.tr.visible = u > 0 && u < 1; q.tr.position.copy(q.m.position).add(new THREE.Vector3(0, CAP * 0.5, 0)); q.tr.quaternion.setFromUnitVectors(Y, DIR.clone().negate()); q.tr.scale.set(1, 3 + 6 * u, 1);
        q.mat.emissiveIntensity = hit < 0 ? 1 : Math.max(0, 1 - hit / 2.6); q.mat.emissive.setRGB(3.2 * Math.max(0.3, 1 - hit * 0.2), 1.6 * Math.max(0.08, 1 - hit * 0.5), 0.5 * Math.max(0, 1 - hit));
        q.cr.material.opacity = hit > 0 ? 0.85 * ss(0, 0.15, hit) : 0; q.cr.scale.setScalar(0.9 + 0.3 * ss(0, 0.3, hit));
        q.ring.material.opacity = hit > 0 ? 0.6 * (1 - clamp(hit / 0.9)) : 0; q.ring.scale.setScalar(0.4 + 4.5 * eiOut(clamp(hit / 0.9)));
        q.pl.position.set(q.x, 0.8, 0.6); q.pl.intensity = hit > 0 ? 18 * Math.exp(-hit / 0.9) : 6 * u; if (hit > 0) shake += Math.exp(-hit / 0.12) * Math.sin(hit * 60); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.9 + 0.06 * shake, 0] });
    } };
}
const eiOut = (x) => 1 - Math.pow(1 - x, 3);
