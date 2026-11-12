// 4 · Ferrofluide — surface liquide continue (700 000 sommets) hérissée de pointes en réseau hexagonal sous l'aimant (remplace l'aurore boréale)
import { THREE, textMask, inject, chrome, pchip, makeCam, fitDist, orbit, ss, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = bgRadial("#1d0f2b", "#0a0710", "#020203");
  { const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, vertexShader: "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: `varying vec3 vP; void main(){ vec3 d = normalize(vP); float a = atan(d.z, d.x), band = smoothstep(-.02, .1, d.y) * (1. - smoothstep(.34, .5, d.y));
        vec3 hue = mix(vec3(2.4, .12, 1.8), vec3(.08, 1.7, 2.4), .5 + .5 * sin(a + .8)), c = hue * smoothstep(-.03, .08, d.y) * (.28 + .72 * band * (.55 + .45 * sin(a * 3. + 1.)));
        c += vec3(5.) * band * smoothstep(.93, 1., sin(a * 2. - .6)) + vec3(2.2) * smoothstep(.93, 1., d.y); gl_FragColor = vec4(c + .003, 1.); }` })));
    const pm = new THREE.PMREMGenerator(K.renderer); scene.environment = pm.fromScene(s, 0.004).texture; pm.dispose(); }
  const AW = 9.8, AD = 5.6, PITCH = 0.082, m = textMask(mot(4, "FLUX"), { font: "black", width: 8.3, res: 1024, blur: 3 }), mt = new THREE.CanvasTexture(m.canvas);
  const U = { uT: { value: 0 }, uMask: { value: mt }, uMW: { value: m.W }, uMH: { value: m.Hh }, uMag: { value: new THREE.Vector2() }, uPull: { value: 0 }, uAll: { value: 0 } };
  const geo = new THREE.PlaneGeometry(AW, AD, 1150, 660); geo.rotateX(-Math.PI / 2);
  const fluid = new THREE.Mesh(geo, inject(new THREE.MeshStandardMaterial({ color: 0x70707c, metalness: 1, roughness: 0.16 }), U, {
    decl: `uniform sampler2D uMask; uniform float uT, uMW, uMH, uPull, uAll; uniform vec2 uMag;
      float ferro(vec2 p){ vec2 q = p / ${PITCH}, a = vec2(1., 1.7320508), hh = a * .5, g1 = mod(q, a) - hh, g2 = mod(q - hh, a) - hh, o = (dot(g1, g1) < dot(g2, g2) ? g1 : g2) * ${PITCH}, c = p - o;
        float mk = texture2D(uMask, vec2(c.x / uMW + .5, .5 - c.y / uMH)).a; vec2 dm = c - uMag; float d2 = dot(dm, dm), hr = h11(c.x * 91.1 + c.y * 17.9);
        float amp = mk * max(exp(-d2 / 3.2) * uPull, uAll) * (.45 + .45 * hr) * (.86 + .14 * sin(uT * 8. + hr * 6.283)) + exp(-d2 / .55) * uPull * .5 * (.6 + .4 * hr);
        float r = clamp(1. - length(o) / ${(PITCH * 0.6).toFixed(4)}, 0., 1.); return amp * (r * r * (.35 + .65 * r)) + .004 * sin(p.x * 9. + uT * 2.) * sin(p.y * 7. - uT * 1.4); }`,
    nrm: "vec2 pp = position.xz; float e = .0035, hC = ferro(pp); objectNormal = normalize(vec3(hC - ferro(pp + vec2(e, 0.)), e, hC - ferro(pp + vec2(0., e))));",
    pos: "transformed.y = hC;" })); fluid.frustumCulled = false; scene.add(fluid);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x70707c, metalness: 1, roughness: 0.16 })); pool.rotation.x = -Math.PI / 2; pool.position.y = -0.006; scene.add(pool);
  const mag = new THREE.Group(); mag.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 48), chrome({ roughness: 0.1 })));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 10, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.4, 3.2) })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.2; mag.add(ring); scene.add(mag);
  const D0 = fitDist(8.8, 30, 0.9), MX = pchip([[0, -4.6], [0.4, -4.2], [3.5, 4.1], [4.2, 4.8]]);
  const AZ = pchip([[0, -26], [3.4, -8], [6, 7]]), EL = pchip([[0, 14], [3.4, 17], [6, 22]]), DK = pchip([[0, 1.0], [3.4, 0.95], [6, 0.9]]), TX = pchip([[0, 0], [6, 0]]);
  return { n: 4, title: "Ferrofluide", style: "Futuriste", font: "Archivo Black", cam: "vue d'ensemble en arc lent, qui s'élève", geste: "le liquide magnétique se hérisse et dessine le mot", scene, camera, accent: "#ff2bd6", bloom: [0.45, 0.6, 0.95], ca: 0.012,
    render(t) {
      const up = ss(3.9, 5.0, t); U.uT.value = t; U.uMag.value.set(MX(t), 0.45 * Math.sin(t * 2.3)); U.uPull.value = ss(0.15, 0.6, t) * (1 - ss(3.8, 4.5, t)); U.uAll.value = up * (0.92 + 0.08 * Math.sin(t * 5));
      mag.position.set(MX(t), 1.7 + up * 7, 0.45 * Math.sin(t * 2.3));
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [TX(t), 0.3, 0] });
    } };
}
