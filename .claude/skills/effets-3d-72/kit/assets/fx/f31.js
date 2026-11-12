// 31 · Lumière à travers le pochoir — clair-obscur : un panneau percé du mot ; son ombre porte des lettres de lumière, faisceaux et poussière
import { THREE, FONTS, glyphShapes, measure, maskPoints, gpuPoints, matte, pchip, makeCam, fitDist, orbit, rnd, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = bgRadial("#1a1410", "#0a0806", "#020202"); scene.fog = new THREE.Fog(0x070504, 14, 46);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0x50607a, 0x100c08, 0.16));
  const TXT = mot(31, "LUMIÈRE"), FONT = "futc", CAP = 1.5, TR = 0.08, W = measure(TXT, FONT, CAP, TR), k = CAP / FONTS[FONT].cap, PW = W + 1.6, Y0 = 1.7, PH = CAP + 1.2;
  const panel = new THREE.Shape(); panel.moveTo(-PW / 2, 0); panel.lineTo(PW / 2, 0); panel.lineTo(PW / 2, PH); panel.lineTo(-PW / 2, PH); panel.closePath(); const outs = []; let pen = -W / 2;
  for (const ch of TXT) { const adv = FONTS[FONT].g[ch].adv * k; for (const sh of glyphShapes(FONT, ch)) { const pts = sh.getPoints(16).map((p) => new THREE.Vector2(pen + p.x * k, 0.6 + p.y * k)); panel.holes.push(new THREE.Path(pts)); outs.push(new THREE.Shape(pts)); } pen += adv + TR * CAP; }
  const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(panel, { depth: 0.06, bevelEnabled: false, curveSegments: 4 }), new THREE.MeshStandardMaterial({ color: 0x1c1814, roughness: 0.6, metalness: 0.5 })); pm.position.set(0, Y0, 0); pm.castShadow = true; scene.add(pm);
  for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, Y0 + PH, 0.12), matte(0x14110e)); leg.position.set(s * (PW / 2 + 0.06), (Y0 + PH) / 2, 0); leg.castShadow = true; scene.add(leg); }
  const sun = new THREE.SpotLight(0xffd9a0, 900, 60, 0.36, 0.5, 1.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0003; sun.shadow.camera.near = 4; sun.shadow.camera.far = 50; scene.add(sun, sun.target); sun.target.position.set(0, 1.2, -2.2);
  const NSL = 44, sg = new THREE.ShapeGeometry(outs, 4), sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.36), transparent: true, opacity: 0.03, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), slices = [];
  for (let i = 0; i < NSL; i++) { const m = new THREE.Mesh(sg, sm); scene.add(m); slices.push(m); }
  const ND = 36000, MP = maskPoints(TXT, ND, { font: FONT, width: W, track: TR, seed: 2, res: 1300 }), U = { uT: { value: 0 }, uPx: { value: 1 }, uDir: { value: new THREE.Vector3() } };
  for (let i = 0; i < ND; i++) MP[i * 3 + 1] += Y0 + 0.6 + CAP / 2;
  scene.add(gpuPoints(ND, { aP: [3, MP], aS: [3, rnd(ND * 3, 1, 8)] }, U, `attribute vec3 aP, aS; uniform float uT, uPx; uniform vec3 uDir; varying float vA;
    void main(){ float s = fract(aS.x + uT * .02 * (aS.y - .5)), L = aP.y / max(.05, -uDir.y); vec3 p = aP + uDir * s * L + vec3(sin(uT * .7 + aS.z * 20.), cos(uT * .5 + aS.y * 17.), 0.) * .03; vA = .35 + .65 * aS.z;
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.1, (.012 + .02 * aS.y * aS.y) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.3, .95, .55) * vA * .5 * smoothstep(.5, .1, d), 1.); }"));
  const D0 = fitDist(PW + 0.4, 30, 0.9), SX = pchip([[0, -7], [6, 5]]), AZ = pchip([[0, 62], [2.6, 34], [4.8, 6], [6, 0]]), EL = pchip([[0, 9], [2.6, 22], [4.8, 50], [6, 54]]), DK = pchip([[0, 1.05], [3, 1.25], [6, 1.42]]), dir = new THREE.Vector3();
  return { n: 31, title: "Lumière à travers le pochoir", style: "Clair-obscur", font: "Bebas Neue", cam: "rasante de côté, puis plongée de face", geste: "l'ombre du panneau porte des lettres de lumière qui glissent", scene, camera, accent: "#ffb45a", bloom: [0.45, 0.7, 0.9],
    render(t, K) {
      sun.position.set(SX(t), 13.5, 11.5); dir.set(0, Y0 + 1.35, 0).sub(sun.position).normalize(); U.uT.value = t; U.uPx.value = K.px(camera); U.uDir.value.copy(dir);
      const L = (Y0 + PH) / -dir.y; slices.forEach((m, i) => { const s = ((i + 0.5) / NSL) * L; m.position.set(dir.x * s, Y0 + dir.y * s, dir.z * s); });
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 1.0, -2.3] });
    } };
}
