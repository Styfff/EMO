// 29 · Portail — fantastique : un anneau s'ouvre sur un vortex, 90 000 étincelles tournent sur son bord ; les lettres en sortent une à une et se posent
import { THREE, word, paint, matte, gpuPoints, pchip, makeCam, fitDist, orbit, clamp, eo, backOut, ss, rnd, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32); scene.environment = K.env; scene.environmentIntensity = 0.18; scene.background = bgRadial("#150a2a", "#07040f", "#010103");
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0d0a16, roughness: 0.55, metalness: 0.4 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const RP = 2.0, CY = 2.25, pl = new THREE.PointLight(0x9a50ff, 0, 30); pl.position.set(0, CY, 0.8); const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 9); scene.add(pl, key, new THREE.HemisphereLight(0x8080ff, 0x100818, 0.35));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(RP, 0.16, 20, 96), new THREE.MeshStandardMaterial({ color: 0x1a1426, metalness: 0.9, roughness: 0.3 })); ring.position.y = CY; scene.add(ring);
  const glowR = new THREE.Mesh(new THREE.TorusGeometry(RP - 0.12, 0.03, 10, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.6, 3.2) })); glowR.position.y = CY; scene.add(glowR);
  const U = { uT: { value: 0 }, uO: { value: 0 }, uPx: { value: 1 } };
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RP - 0.1, 96), new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: `uniform float uT, uO; varying vec2 vP; void main(){ float r = length(vP) / ${(RP - 0.1).toFixed(2)}, a = atan(vP.y, vP.x); if (r > uO) discard;
      float s1 = .5 + .5 * sin(a * 3. + r * 9. - uT * 3.2), s2 = .5 + .5 * sin(a * 5. - r * 15. + uT * 4.6), core = pow(1. - r, 2.2);
      vec3 c = mix(vec3(.38, .10, 1.2), vec3(.10, .95, 1.1), s1) * (.25 + .9 * s2) * (.55 + .45 * r) + vec3(1.6, 1.4, 2.2) * core + vec3(1.2, .5, 2.4) * smoothstep(uO - .08, uO, r); gl_FragColor = vec4(c, 1.); }` })); disc.position.set(0, CY, -0.02); scene.add(disc);
  const NS = 90000; const sp = gpuPoints(NS, { aS: [4, rnd(NS * 4, 1, 77)] }, U, `attribute vec4 aS; uniform float uT, uO, uPx; varying vec3 vC;
    void main(){ float life = fract(aS.x + uT * (.25 + .35 * aS.w)), th = aS.y * 6.2832 + uT * (1.4 + 2.2 * aS.z) + life * 2.5, rr = ${RP.toFixed(1)} * (1.32 - .42 * life) * uO + .12 * sin(aS.w * 40. + uT * 3.);
      vec3 p = vec3(cos(th) * rr, ${CY} + sin(th) * rr, (aS.z - .5) * .5 * (1. - life) + .6 * (1. - life) * (1. - life)); vec4 mv = modelViewMatrix * vec4(p, 1.);
      vC = mix(vec3(.5, .16, 1.5), vec3(.15, 1.1, 1.3), aS.w) * (1. - life) * uO * .22; gl_PointSize = max(1.2, (.018 + .03 * aS.z * aS.z) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * smoothstep(.5, .1, d), 1.); }"); scene.add(sp);
  const CUT = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0.02), w = word(mot(29, "PORTAIL"), { font: "optima", cap: 1.0, depth: 0.34, bevel: 0.03, pivot: "base" }), L = [], ZF = 3.4;
  for (const l of w.letters) { const m = new THREE.Mesh(l.geo, paint(0xf3efff, { roughness: 0.25, clippingPlanes: [CUT] })); scene.add(m); L.push({ m, x: l.x, t0: 1.05 + l.i * 0.42 }); }
  const D0 = fitDist(w.width, 32, 0.86), AZ = pchip([[0, 54], [2.6, 26], [4.6, 4], [6, -4]]), EL = pchip([[0, 9], [3, 12], [6, 8]]), DK = pchip([[0, 1.25], [3, 1.3], [6, 1.16]]);
  return { n: 29, title: "Portail", style: "Fantastique (portail)", font: "Alegreya Sans Black", cam: "de profil, puis de face", geste: "le vortex s'ouvre ; les lettres en sortent une à une et se posent", scene, camera, accent: "#b07bff", bloom: [0.6, 0.7, 0.85],
    render(t, K) {
      const open = backOut((t - 0.25) / 0.9, 1.2) * (1 - ss(4.95, 5.6, t)); U.uT.value = t; U.uO.value = Math.max(0, open); U.uPx.value = K.px(camera); pl.intensity = 26 * Math.max(0, open); glowR.material.color.setRGB(1.6 * open + 0.1, 0.6 * open + 0.03, 3.2 * open + 0.2);
      for (const q of L) { const u = clamp((t - q.t0) / 1.35), e = eo(u), s = 0.12 + 0.88 * e; q.m.visible = u > 0; q.m.position.set(q.x * e, CY * (1 - e) + Math.sin(Math.PI * e) * 0.9 * (1 - e) - (1 - e) * 0.5 * s, -0.6 + (ZF + 0.6) * e); q.m.scale.setScalar(s); q.m.rotation.y = (1 - e) * Math.PI * 2; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 1.35, 1.9] });
    } };
}
