// 46 · Faille de lave — volcanique : le sol tremble, le mot se fissure en lignes de feu, puis ses dalles tombent dans la lave ; 60 000 braises montent des trous
import { THREE, FONTS, glyphShapes, measure, wordContours, maskPoints, gpuPoints, pchip, makeCam, fitDist, orbit, ss, ei, mulberry, rnd, canvasTex , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.2; scene.background = new THREE.Color(0x0d0807); scene.fog = new THREE.Fog(0x120a08, 16, 40);
  scene.add(new THREE.HemisphereLight(0x8090b0, 0x200a04, 1.1)); const key = new THREE.DirectionalLight(0xffd0a8, 2.4); key.position.set(-6, 9, 4); scene.add(key);
  const TXT = mot(46, "MAGMA"), FONT = "futc", CAP = 1.9, TR = 0.06, Wd = measure(TXT, FONT, CAP, TR), k = CAP / FONTS[FONT].cap, SW = 70, SH = 70, DEP = 0.45;
  const slab = new THREE.Shape(); slab.moveTo(-SW / 2, -SH / 2); slab.lineTo(SW / 2, -SH / 2); slab.lineTo(SW / 2, SH / 2); slab.lineTo(-SW / 2, SH / 2); slab.closePath(); const plugs = [], isles = []; let pen = -Wd / 2, li = 0;
  for (const ch of TXT) { const adv = FONTS[FONT].g[ch].adv * k; for (const sh of glyphShapes(FONT, ch)) { const conv = (p) => new THREE.Vector2(pen + p.x * k, p.y * k - CAP / 2), outer = sh.getPoints(20).map(conv); slab.holes.push(new THREE.Path(outer)); const plug = new THREE.Shape(outer); for (const h of sh.holes) { const hp = h.getPoints(20).map(conv); plug.holes.push(new THREE.Path(hp)); isles.push(new THREE.Shape(hp)); } plugs.push({ shape: plug, li }); } pen += adv + TR * CAP; li++; }
  const r = mulberry(46), rock = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = "#4a423d"; g.fillRect(0, 0, w, h); for (let i = 0; i < 40000; i++) { const v = 50 + r() * 60; g.fillStyle = `rgba(${v},${v * 0.92 | 0},${v * 0.85 | 0},${0.2 + r() * 0.5})`; g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4); } g.strokeStyle = "rgba(10,8,7,0.6)"; for (let i = 0; i < 80; i++) { g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * w, y = r() * h; g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; g.lineTo(x, y); } g.stroke(); } }); rock.wrapS = rock.wrapT = THREE.RepeatWrapping; rock.repeat.set(0.25, 0.25);
  const rockM = new THREE.MeshStandardMaterial({ map: rock, roughness: 0.9 }), sideM = new THREE.MeshStandardMaterial({ color: 0x3a2a24, roughness: 0.85 }), ext = (s) => new THREE.ExtrudeGeometry(s, { depth: DEP, bevelEnabled: false, curveSegments: 6 });
  const ground = new THREE.Group(); ground.rotation.x = -Math.PI / 2; ground.position.y = -DEP; scene.add(ground);
  ground.add(new THREE.Mesh(ext(slab), [rockM, sideM])); for (const s of isles) ground.add(new THREE.Mesh(ext(s), [rockM, sideM]));
  const P = plugs.map((q) => { const m = new THREE.Mesh(ext(q.shape), [rockM, sideM]); ground.add(m); return { m, li: q.li, tf: 2.55 + q.li * 0.2, spin: (r() - 0.5) * 0.9 }; });
  const LU = { uT: { value: 0 } }, lava = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({ uniforms: LU, fog: false, vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `uniform float uT; varying vec2 vP; void main(){ vec2 p = vP * 1.3; float n = sin(p.x * 1.7 + uT * .6 + sin(p.y * 2.3 - uT * .4) * 1.5) + sin(p.y * 2.1 - uT * .5 + sin(p.x * 3.1 + uT * .7)) + .5 * sin((p.x + p.y) * 4.3 + uT * 1.3);
      float c = clamp(n * .3 + .5, 0., 1.), crust = smoothstep(.62, .78, c); vec3 col = mix(vec3(3.4, 1.5, .25), vec3(1.4, .18, .02), smoothstep(.2, .6, c)); col = mix(col, vec3(.08, .03, .02), crust * .85); gl_FragColor = vec4(col, 1.); }` }));
  lava.rotation.x = -Math.PI / 2; lava.position.y = -1.6; scene.add(lava);
  const lights = []; for (let i = 0; i < TXT.length; i++) { const l = new THREE.PointLight(0xff6a1a, 0, 6); l.position.set(-Wd / 2 + (i + 0.5) * (Wd / TXT.length), -0.6, 0); scene.add(l); lights.push(l); }
  const C = wordContours(TXT, { font: FONT, cap: CAP, track: TR, step: 0.02 }), crackM = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.2, 0.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  for (const c of C) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(c.pts.map((p) => new THREE.Vector3(p[0], 0.012, -p[1])), true), c.pts.length, 0.035, 5, true), crackM); scene.add(m); }
  const NE = 60000, EP = maskPoints(TXT, NE, { font: FONT, width: Wd, track: TR, seed: 7, res: 1400 }), aE = new Float32Array(NE * 3); for (let i = 0; i < NE; i++) aE.set([EP[i * 3], -1.4, -EP[i * 3 + 1]], i * 3);
  const U = { uT: LU.uT, uPx: { value: 1 } }; scene.add(gpuPoints(NE, { aP: [3, aE], aS: [4, rnd(NE * 4, 1, 47)] }, U, `attribute vec3 aP; attribute vec4 aS; uniform float uT, uPx; varying vec3 vC;
    void main(){ float on = sst(2.7, 3.6, uT - aS.w * .4), age = fract(aS.x + uT * (.3 + .3 * aS.y)); vec3 p = aP + vec3(sin(age * 6. + aS.z * 20.) * .25 * age, age * (2.5 + 3. * aS.y), cos(age * 5. + aS.w * 20.) * .2 * age);
      vC = mix(vec3(3., 1.6, .4), vec3(1.2, .12, .02), age) * on * (1. - age) * .5; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.2, (.018 + .02 * aS.z) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, "varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vC * smoothstep(.5, .1, d), 1.); }"));
  const D0 = fitDist(Wd, 30, 0.84), AZ = pchip([[0, -22], [6, 6]]), EL = pchip([[0, 38], [3, 52], [6, 60]]), DK = pchip([[0, 1.2], [6, 1.02]]);
  return { n: 46, title: "Faille de lave", style: "Volcanique", font: "Bebas Neue", cam: "plongée qui s'élève, secousses", geste: "le mot se fissure en lignes de feu, ses dalles tombent dans la lave", scene, camera, accent: "#ff6a1a", bloom: [0.55, 0.6, 0.85],
    render(t, K) {
      LU.uT.value = t; U.uPx.value = K.px(camera); crackM.opacity = ss(0.5, 2.2, t) * (0.75 + 0.25 * Math.sin(t * 23)) * (1 - 0.4 * ss(3.2, 4.2, t));
      for (const q of P) { const u = Math.max(0, t - q.tf), f = ei(Math.min(1, u / 0.9)); q.m.position.z = -4.2 * u * u * 1.3; q.m.rotation.set(q.spin * f, q.spin * 0.5 * f, 0); q.m.visible = u < 1.2; }
      lights.forEach((l, i) => { l.intensity = 12 * ss(2.6 + i * 0.2, 3.3 + i * 0.2, t); });
      const sh = (ss(0.6, 1.2, t) * (1 - ss(3.4, 4.2, t))) * 0.05, jx = Math.sin(t * 61) * sh, jy = Math.sin(t * 47 + 1) * sh;
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [jx, jy, 0] });
    } };
}
