// 10 · Sable qui s'écoule — 110 000 grains tombent en rideau, le sable prend la forme des lettres (talus = distance au bord), puis le vent se lève
import { THREE, textMask, maskPoints, matte, rig, pchip, makeCam, fitDist, orbit, ss, clamp, lerp, gpuPoints, rnd, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.25; scene.background = bgLinear([[0, "#2b1230"], [0.45, "#7a2f3f"], [0.75, "#e2733f"], [1, "#f6b867"]]); scene.fog = new THREE.Fog(0x7a2f3f, 14, 44);
  rig(scene, { key: 2.6, pos: [-8, 4, -3], amb: 0.5, size: 8, color: 0xffb070, sky: 0xffd9b0, ground: 0x3a1420 });
  const gr = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), matte(0x8a3a28, { roughness: 0.95 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; scene.add(gr);
  const m = textMask(mot(10, "DUNE"), { font: "avenir", width: 6.6, res: 1200, pad: 0.05, blur: 11 }), MW = m.w, MH = m.h, AW = m.W, AD = m.Hh, DMAX = 0.5, dist = new Float32Array(MW * MH), BIG = 1e6;
  for (let i = 0; i < MW * MH; i++) dist[i] = m.data[i * 4 + 3] > 120 ? BIG : 0;
  const rel = (i, j, d) => { if (dist[j] + d < dist[i]) dist[i] = dist[j] + d; };
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const i = y * MW + x; if (!dist[i]) continue; rel(i, i - 1, 3); rel(i, i - MW, 3); rel(i, i - MW - 1, 4); rel(i, i - MW + 1, 4); }
  for (let y = MH - 2; y > 0; y--) for (let x = MW - 2; x > 0; x--) { const i = y * MW + x; if (!dist[i]) continue; rel(i, i + 1, 3); rel(i, i + MW, 3); rel(i, i + MW + 1, 4); rel(i, i + MW - 1, 4); }
  const data = new Uint8Array(MW * MH * 4); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const d = (dist[y * MW + x] / 3) * m.scale, o = ((MH - 1 - y) * MW + x) * 4; data[o] = Math.round(clamp(d / DMAX) * 255); data[o + 3] = 255; }
  const tex = new THREE.DataTexture(data, MW, MH, THREE.RGBAFormat); tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.needsUpdate = true;
  const X0 = -AW / 2 - 0.1, VX = (AW + 0.5) / 3.6, T0 = 0.45, U = { uD: { value: tex }, uXh: { value: -9 }, uT: { value: 0 }, uPx: { value: 1 }, uWind: { value: 0 }, uZh: { value: 0 }, uOn: { value: 0 } }, LD = "normalize(vec3(-.74, .36, -.3))";
  const HG = `uniform sampler2D uD; uniform float uXh, uZh, uOn, uT, uWind;
    float hgt(vec2 uv){ float d = texture2D(uD, uv).r * ${DMAX.toFixed(2)}, x = (uv.x - .5) * ${AW.toFixed(3)}, z = -(uv.y - .5) * ${AD.toFixed(3)}; float f = clamp((uXh - x) / .9 + .3, 0., 1.); f = f * f * (3. - 2. * f);
      float q = clamp(d / .36, 0., 1.), dome = .37 * (1. - (1. - q) * (1. - q)) * (1. + .14 * sin(x * 6.3 + z * 4.1) * sin(z * 8.7 - x * 2.9)); float h = min(dome, .5 * f) * smoothstep(0., .03, d) + .13 * exp(-((x - uXh) * (x - uXh) + (z - uZh) * (z - uZh)) / .03) * smoothstep(.02, .1, d) * uOn; return h * (1. + uWind * .09 * sin((x * .8 + z * .45) * 46. + sin(z * 9.) * 1.4)); }`;
  const VS = (shadow) => HG + `varying float vH; varying vec3 vN; varying vec3 vW; void main(){ float h = hgt(uv); vec2 e = vec2(1. / ${MW}., 1. / ${MH}.);
      float hx = (hgt(uv + vec2(e.x, 0.)) - hgt(uv - vec2(e.x, 0.))) / (2. * e.x * ${AW.toFixed(3)}), hz = -(hgt(uv + vec2(0., e.y)) - hgt(uv - vec2(0., e.y))) / (2. * e.y * ${AD.toFixed(3)});
      vN = normalize(vec3(-hx, 1., -hz)); vH = h; vW = vec3((uv.x - .5) * ${AW.toFixed(3)}, h, -(uv.y - .5) * ${AD.toFixed(3)});
      ${shadow ? `vec3 L = ${LD}; vW.xz -= L.xz / L.y * h; vW.y = .003;` : ""} gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
  const pg = new THREE.PlaneGeometry(1, 1, 900, 330);
  const shadow = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS(true), fragmentShader: "varying float vH; void main(){ if (vH < .004) discard; gl_FragColor = vec4(.03, .008, .02, .62); }", transparent: true, depthWrite: false })); shadow.frustumCulled = false; scene.add(shadow);
  const sand = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS(false), fragmentShader: `varying float vH; varying vec3 vN; varying vec3 vW; float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){ if (vH < .003) discard; vec3 n = normalize(vN), L = ${LD}; float df = max(dot(n, L), 0.), g1 = hs(floor(vW.xz * 260.)), g2 = hs(floor(vW.xz * 620.) + 7.);
        vec3 c = mix(vec3(.62, .40, .22), vec3(.98, .80, .50), smoothstep(0., .3, vH)) * (.84 + .3 * g1);
        c = c * (vec3(.20, .13, .16) + vec3(1.5, 1.05, .7) * df) * mix(.5, 1., smoothstep(0., .08, vH)) + vec3(1.6, 1.3, .9) * step(.972, g2) * df; gl_FragColor = vec4(c, 1.); }` })); sand.frustumCulled = false; sand.renderOrder = 1; scene.add(sand);
  // rideau de grains : chaque grain a été lâché quand la goulotte était plus à gauche (le rideau penche en arrière)
  const NG = 80000, Y0 = 1.35; U.uX0 = { value: X0 }; U.uV = { value: VX }; U.uT0 = { value: T0 };
  scene.add(gpuPoints(NG, { aS: [4, rnd(NG * 4, 1, 9)] }, U, `attribute vec4 aS; uniform float uT, uPx, uX0, uV, uT0; varying float vA; varying float vS;
    void main(){ float tf = .42, f = fract(aS.x + uT * (1.5 + .5 * aS.w)), tr = uT - f * tf, on = step(uT0, tr) * step(tr, uT0 + 3.6);
      float ja = aS.y * 6.2832, jr = sqrt(aS.z) * (.035 + .16 * f * f * f); vec3 p = vec3(uX0 + uV * (tr - uT0) + cos(ja) * jr, ${Y0} * (1. - f * f) + .02, .5 * sin(tr * 5.4) + sin(ja) * jr);
      vec4 mv = modelViewMatrix * vec4(p, 1.); vA = on; vS = aS.z; gl_PointSize = max(1.1, (.007 + .008 * aS.z) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; varying float vS; void main(){ if (vA < .5 || length(gl_PointCoord - .5) > .5) discard; gl_FragColor = vec4(vec3(.95, .72, .42) * (.5 + .55 * vS), 1.); }", { blending: THREE.NormalBlending }));
  // vent : des grains quittent les crêtes
  const NW = 40000, WP = maskPoints(mot(10, "DUNE"), NW, { font: "avenir", width: 6.6, res: 1200, pad: 0.05, seed: 6 });
  const aW = new Float32Array(NW * 3); for (let i = 0; i < NW; i++) { aW[i * 3] = WP[i * 3]; aW[i * 3 + 1] = -WP[i * 3 + 1]; aW[i * 3 + 2] = 0; }
  scene.add(gpuPoints(NW, { aW: [3, aW], aS: [3, rnd(NW * 3, 1, 4)] }, U, `attribute vec3 aW, aS; uniform float uT, uPx; varying float vA;
    void main(){ float tau = fract(aS.x + (uT - 4.2) * (.5 + .4 * aS.y)), go = sst(4.2, 4.9, uT - aS.x * .6);
      vec3 p = vec3(aW.x + tau * (1.2 + 2.2 * aS.z), .16 + .5 * tau * (1. - tau) * (1. + aS.y) + .08 * sin(tau * 20. + aS.x * 30.) * tau, aW.y + .5 * tau * (aS.y - .3));
      vec4 mv = modelViewMatrix * vec4(p, 1.); vA = go * (1. - tau) * (1. - tau) * .4 * (1. - sst(5.2, 5.8, uT)); gl_PointSize = max(1.2, .014 * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`,
    "varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(.9, .62, .34) * vA, 1.); }"));
  const bar = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0x17454a, metalness: 0.7, roughness: 0.35 }); { const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, AD * 0.95), steel); b.castShadow = true; bar.add(b); const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, AD * 0.95), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 2.2, 2.0) })); l.position.set(0, 0.19, 0); bar.add(l); } scene.add(bar); bar.visible = false;
  const hop = new THREE.Group(); { const pts = [[0.05, 0], [0.065, 0.3], [0.42, 0.8], [0.45, 0.83]].map(([x, y]) => new THREE.Vector2(x, y)); const fn = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: 0x17454a, metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide })); fn.castShadow = true; const rim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.024, 10, 56), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 2.0, 1.8) })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.83; hop.add(fn, rim); } scene.add(hop);
  const DF = fitDist(7.3, 30, 0.88);
  const AZ = pchip([[0, -64], [1.6, -44], [3.6, -18], [5, 0], [6, 4]]), EL = pchip([[0, 5], [1.8, 12], [3.6, 26], [5, 44], [6, 47]]), DK = pchip([[0, 0.3], [1.8, 0.4], [3.6, 0.62], [5, 1], [6, 0.97]]), TX = pchip([[0, -3.0], [1.8, -1.6], [3.6, 0.6], [5, 0], [6, 0]]);
  return { n: 10, title: "Sable qui s'écoule", style: "Bohème (désert au couchant)", font: "Montserrat ExtraBold (contours adoucis)", cam: "au ras du sol près du filet de sable, puis grue en plongée", geste: "un seul filet de 80 000 grains ; tas arrondis, puis le vent", scene, camera, accent: "#ffb45a", bloom: [0.2, 0.6, 1.05],
    render(t, K) {
      const xh = X0 + VX * clamp(t - T0, 0, 3.6), up = ss(4.1, 5.0, t); U.uXh.value = xh; U.uT.value = t; U.uPx.value = K.px(camera); U.uWind.value = ss(4.3, 5.4, t); const zh = 0.5 * Math.sin(t * 5.4); U.uZh.value = zh; U.uOn.value = ss(0.5, 0.8, t) * (1 - ss(3.9, 4.1, t)); hop.position.set(xh, 1.35 + up * 6, zh);
      orbit(camera, { az: AZ(t), el: EL(t), dist: DF * DK(t), target: [TX(t), 0.3 * (1 - ss(3.4, 5, t)) + 0.1, 0] });
    } };
}
