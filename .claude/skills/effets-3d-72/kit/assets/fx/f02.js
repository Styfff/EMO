// 2 · Vague de bascule — tableau des départs à palettes : 126 cases qui défilent leurs lettres en vague diagonale
import { THREE, drawText, canvasTex, matte, rig, pchip, makeCam, fitDist, orbit, bgRadial, GLSL, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = bgRadial("#22242a", "#101114", "#060607");
  rig(scene, { key: 2.2, pos: [-5, 6, 8], amb: 0.4, size: 7 });
  const CH = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-+", AC = 8, AR = 5, TW = 128, TH = 176;
  const atlas = canvasTex(AC * TW, AR * TH, (g) => { [...CH].forEach((ch, i) => { const x = (i % AC) * TW, y = Math.floor(i / AC) * TH;
    g.fillStyle = "#17181b"; g.beginPath(); g.roundRect(x + 5, y + 5, TW - 10, TH - 10, 9); g.fill(); g.fillStyle = "#202226"; g.beginPath(); g.roundRect(x + 5, y + 5, TW - 10, TH / 2 - 7, [9, 9, 0, 0]); g.fill();
    if (ch !== " ") drawText(g, ch, { font: "din", cap: 112, x: x + TW / 2, y: y + TH / 2 + 56, fill: "#f2ead8" }); g.fillStyle = "#050506"; g.fillRect(x + 5, y + TH / 2 - 2, TW - 10, 4); }); });
  const COLS = 14, ROWS = 9, PX = 0.52, PY = 0.72, MSG = ["DEPARTS  10·11", "", "MOTION      01", "DESIGN      02", "CAMERA      03", "OBJETS 3D   04", "72 EFFETS   72", "", "A L HEURE   OK"]; MSG[6] = mot(2, "72 EFFETS   72").slice(0, 14);
  const n = COLS * ROWS, aC = new Float32Array(n * 2), aF = new Float32Array(n), aK = new Float32Array(n), aT = new Float32Array(n), aTint = new Float32Array(n * 3), r = mulberry(12);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const k = j * COLS + i, ch = (MSG[j] || "")[i] || " ", yel = j === 0 || j === 6;
    aC.set([(i - (COLS - 1) / 2) * PX, ((ROWS - 1) / 2 - j) * PY], k * 2); aF[k] = Math.max(0, CH.indexOf(ch)); aK[k] = 5 + Math.floor(r() * 6); aT[k] = 0.45 + (i + j * 0.9) * 0.085 + r() * 0.05; aTint.set(yel ? [1, 0.82, 0.1] : [1, 1, 1], k * 3); }
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(PX * 0.93, PY * 0.93)); geo.instanceCount = n;
  for (const [nm, a, s] of [["aC", aC, 2], ["aF", aF, 1], ["aK", aK, 1], ["aT", aT, 1], ["aTint", aTint, 3]]) geo.setAttribute(nm, new THREE.InstancedBufferAttribute(a, s));
  const U = { uT: { value: 0 }, uA: { value: atlas } };
  const flaps = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: GLSL + `attribute vec2 aC; attribute float aF, aK, aT; attribute vec3 aTint; uniform float uT; varying vec2 vUv; varying float vL; varying vec3 vTint;
      void main(){ float x = clamp((uT - aT) / (.11 * aK + .2), 0., 1.), e = x * x * (3. - 2. * x), th = 3.14159 * aK * e, nn = floor(th / 3.14159 + .5), ph = th - nn * 3.14159;
        float g = nn < .5 ? 0. : (nn >= aK - .5 ? aF : floor(h11(aC.x * 13.7 + aC.y * 71.3 + nn * 5.1) * 37.) + 1.);
        vec3 p = vec3(position.x, position.y * cos(ph), position.y * sin(ph) + .02); vL = .3 + .7 * cos(ph) + .5 * pow(max(0., cos(ph - .45)), 24.); vTint = aTint;
        float cx = mod(g, 8.), cy = floor(g / 8.); vUv = vec2((cx + uv.x) / 8., 1. - (cy + 1. - uv.y) / 5.);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(aC, 0.) + p, 1.); }`,
    fragmentShader: `uniform sampler2D uA; varying vec2 vUv; varying float vL; varying vec3 vTint; void main(){ vec3 c = texture2D(uA, vUv).rgb; float l = dot(c, vec3(.333)); c = mix(c, c * vTint, smoothstep(.2, .5, l)); gl_FragColor = vec4(c * vL * 1.15, 1.); }` }));
  flaps.frustumCulled = false; scene.add(flaps);
  const body = new THREE.Mesh(new THREE.BoxGeometry(COLS * PX + 0.5, ROWS * PY + 0.5, 0.5), matte(0x0b0c0e, { roughness: 0.5, metalness: 0.6 })); body.position.z = -0.27; scene.add(body);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(COLS * PX + 0.5, 0.07, 0.56), matte(0xf5c518, { roughness: 0.4 })); bar.position.set(0, ROWS * PY / 2 + 0.3, -0.27); scene.add(bar);
  const D0 = fitDist(COLS * PX + 0.6, 30, 0.9);
  const AZ = pchip([[0, -62], [2.2, -34], [4.3, 0], [6, 7]]), EL = pchip([[0, -8], [2.5, 5], [6, 2]]), DK = pchip([[0, 0.36], [2.2, 0.58], [4.4, 1], [6, 0.96]]), TX = pchip([[0, -2.6], [2.2, -0.5], [4.2, 0], [6, 0]]), TY = pchip([[0, 1.6], [2.4, 0.5], [4.4, -0.25], [6, -0.25]]);
  return { n: 2, title: "Vague de bascule", style: "Rétro (tableau à palettes)", font: "Barlow Condensed Bold", cam: "rasante le long du tableau, puis recul de face", geste: "126 palettes défilent leurs lettres en vague diagonale", scene, camera, accent: "#f5c518", bloom: [0.18, 0.5, 1.05],
    render(t) { U.uT.value = t; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [TX(t), TY(t), 0] }); } };
}
