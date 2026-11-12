// 28 · Fraiseuse CNC — atelier : la fraise creuse tout sauf le mot (peau crème, cœur corail), en quatre passes ; 40 000 copeaux
import { THREE, textMask, gpuPoints, chrome, matte, rig, pchip, makeCam, fitDist, orbit, clamp, ss, rnd, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = bgRadial("#22364a", "#0f1b28", "#060b12");
  rig(scene, { key: 2.4, pos: [-5, 8, 6], amb: 0.5, size: 8 });
  const bench = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), matte(0x142231, { roughness: 0.7 })); bench.rotation.x = -Math.PI / 2; bench.receiveShadow = true; scene.add(bench);
  const m = textMask(mot(28, "USINÉ"), { font: "din", width: 6.2, res: 1300, pad: 0.07 }), MW = m.w, MH = m.h, AW = m.W, AD = m.Hh, DMAX = 0.3, dist = new Float32Array(MW * MH), BIG = 1e6;
  for (let i = 0; i < MW * MH; i++) dist[i] = m.data[i * 4 + 3] > 127 ? 0 : BIG;      // distance vers la lettre la plus proche (depuis l'extérieur)
  const rel = (i, j, d) => { if (dist[j] + d < dist[i]) dist[i] = dist[j] + d; };
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const i = y * MW + x; if (!dist[i]) continue; rel(i, i - 1, 3); rel(i, i - MW, 3); rel(i, i - MW - 1, 4); rel(i, i - MW + 1, 4); }
  for (let y = MH - 2; y > 0; y--) for (let x = MW - 2; x > 0; x--) { const i = y * MW + x; if (!dist[i]) continue; rel(i, i + 1, 3); rel(i, i + MW, 3); rel(i, i + MW + 1, 4); rel(i, i + MW - 1, 4); }
  const data = new Uint8Array(MW * MH * 4); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = Math.min(BIG, dist[y * MW + x]) / 3 * m.scale, o = ((MH - 1 - y) * MW + x) * 4; data[o] = Math.round(clamp(d / DMAX) * 255); data[o + 3] = 255; }
  const tex = new THREE.DataTexture(data, MW, MH, THREE.RGBAFormat); tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const TOP = 0.62, FLO = 0.2, NROW = 4, T0 = 0.5, TM = 4.0, U = { uD: { value: tex }, uP: { value: 0 }, uT: { value: 0 }, uPx: { value: 1 } };
  const HG = `uniform sampler2D uD; uniform float uP;
    float cut(vec2 uv){ float r = floor(uv.y * ${NROW}.), cr = floor(uP), fr = uP - cr, dirx = mod(r, 2.) < .5 ? uv.x : 1. - uv.x; return r < cr ? 1. : (r > cr ? 0. : step(dirx, fr)); }
    float hgt(vec2 uv){ float d = texture2D(uD, uv).r * ${DMAX.toFixed(2)}; float e = smoothstep(.0, .05, d); return mix(${TOP}, mix(${TOP}, ${FLO}, e), cut(uv)); }`;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 700, 250), new THREE.ShaderMaterial({ uniforms: U, vertexShader: HG + `varying float vH; varying vec3 vN; varying vec3 vW; varying float vEdge;
      void main(){ vec2 e = vec2(1. / ${MW}., 1. / ${MH}.); float h = hgt(uv), bd = min(min(uv.x, 1. - uv.x), min(uv.y, 1. - uv.y)); vEdge = step(bd, .0015); if (vEdge > .5) h = 0.;
        float hx = (hgt(uv + vec2(e.x, 0.)) - hgt(uv - vec2(e.x, 0.))) / (2. * e.x * ${AW.toFixed(3)}), hz = -(hgt(uv + vec2(0., e.y)) - hgt(uv - vec2(0., e.y))) / (2. * e.y * ${AD.toFixed(3)});
        vN = normalize(vec3(-hx, 1., -hz)); vH = h; vW = vec3((uv.x - .5) * ${AW.toFixed(3)}, h, -(uv.y - .5) * ${AD.toFixed(3)}); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`,
    fragmentShader: `varying float vH; varying vec3 vN; varying vec3 vW; varying float vEdge; void main(){ vec3 n = normalize(vN), L = normalize(vec3(-.5, .75, .45)); float df = max(dot(n, L), 0.), skin = smoothstep(${(TOP - 0.07).toFixed(2)}, ${(TOP - 0.05).toFixed(2)}, vH);
        vec3 core = vec3(1., .30, .17) * (.9 + .1 * sin(vW.x * 150.)), c = mix(core, vec3(.96, .90, .78), skin); c *= .28 + .95 * df; c += vec3(.25) * pow(max(dot(reflect(-L, n), normalize(cameraPosition - vW)), 0.), 30.); gl_FragColor = vec4(c, 1.); }` })); top.frustumCulled = false; scene.add(top);
  // copeaux : chacun naît là où était la fraise à son instant de naissance
  const NCH = 40000; scene.add(gpuPoints(NCH, { aS: [4, rnd(NCH * 4, 1, 31)] }, U, `attribute vec4 aS; uniform float uT, uPx; varying float vA; varying float vS;
    void main(){ float tb = ${T0} + aS.x * ${TM.toFixed(1)}, tau = uT - tb, pp = aS.x * ${NROW}., r = floor(pp), fr = pp - r, dx = mod(r, 2.) < .5 ? fr : 1. - fr, sgn = mod(r, 2.) < .5 ? -1. : 1.;
      vec3 p0 = vec3((dx - .5) * ${AW.toFixed(3)}, ${TOP}, -((r + .5) / ${NROW}. - .5) * ${AD.toFixed(3)} + (aS.y - .5) * ${(AD / NROW).toFixed(3)});
      vec3 v = vec3(sgn * (1.5 + 2.5 * aS.z), 2.2 + 2.6 * aS.w, (aS.y - .5) * 3.); vec3 p = p0 + v * tau + vec3(0., -9., 0.) * tau * tau; p.y = max(p.y, .03);
      vA = step(0., tau) * (1. - sst(.9, 1.5, tau)); vS = aS.w; vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.4, (.02 + .03 * aS.z) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; varying float vS; void main(){ if (vA < .02 || length(gl_PointCoord - .5) > .5) discard; gl_FragColor = vec4(mix(vec3(1., .36, .2), vec3(.97, .9, .78), step(.6, vS)) * (.6 + .5 * vS), 1.); }", { blending: THREE.NormalBlending }));
  const tool = new THREE.Group(), bit = new THREE.Mesh(new THREE.CylinderGeometry(AD / NROW / 2 * 0.92, AD / NROW / 2 * 0.92, 0.5, 24), chrome({ roughness: 0.18 })); bit.position.y = 0.25; const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.4, 20), chrome({ roughness: 0.3 })); shank.position.y = 1.7;
  const spin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.3, 0.9), matte(0x22364a, { roughness: 0.5, metalness: 0.5 })); spin.position.y = 3.3; const band = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.92), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.8, 0.4) })); band.position.y = 2.8; tool.add(bit, shank, spin, band); scene.add(tool); bit.castShadow = shank.castShadow = true;
  const DF = fitDist(AW, 30, 0.88), AZ = pchip([[0, -44], [2.4, -24], [4.5, -4], [6, 4]]), EL = pchip([[0, 22], [2.4, 30], [4.6, 50], [6, 55]]), DK = pchip([[0, 0.56], [2.4, 0.72], [4.6, 1], [6, 0.97]]);
  return { n: 28, title: "Fraiseuse CNC", style: "Atelier (peau crème, cœur corail)", font: "Barlow Condensed Bold", cam: "trois quarts près de la fraise, puis plongée", geste: "quatre passes creusent tout sauf le mot ; 40 000 copeaux", scene, camera, accent: "#ff5a3c", bloom: [0.2, 0.5, 1.1],
    render(t, K) {
      const P = NROW * clamp((t - T0) / TM), r = Math.min(NROW - 1, Math.floor(P)), fr = P >= NROW ? 1 : P - r, dx = r % 2 === 0 ? fr : 1 - fr, up = ss(T0 + TM, T0 + TM + 0.7, t); U.uP.value = P; U.uT.value = t; U.uPx.value = K.px(camera);
      const tx = (dx - 0.5) * AW, tz = -((r + 0.5) / NROW - 0.5) * AD; tool.position.set(tx, FLO + up * 6, tz); bit.rotation.y = t * 40;
      orbit(camera, { az: AZ(t), el: EL(t), dist: DF * DK(t), target: [tx * 0.25 * (1 - ss(3.6, 4.8, t)), 0.3, 0] });
    } };
}
