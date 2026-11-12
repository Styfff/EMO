// 32 · Défroissage — presse : une boule de papier journal roule, rebondit, se déplie en une page aux plis encore visibles, puis lisse
import { THREE, GLSL, drawText, measure, canvasTex, matte, pchip, makeCam, orbit, clamp, eio, ss, mulberry, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = bgRadial("#2c4a44", "#162a26", "#07100e");
  const PW = 4.3, PH = 5.5, r = mulberry(8), tex = canvasTex(1024, 1310, (g, w, h) => { g.fillStyle = "#f1ead9"; g.fillRect(0, 0, w, h); const ink = "#171512";
    drawText(g, "LE QUOTIDIEN", { font: "didot", cap: 62, x: w / 2, y: 118, fill: ink, track: 0.1 }); g.fillStyle = ink; g.fillRect(60, 150, w - 120, 6); g.fillRect(60, 164, w - 120, 2);
    drawText(g, "N° 32 · ÉDITION DU MATIN".replace("°", "").replace("N ", "N "), { font: "typew", cap: 17, x: 62, y: 200, align: "left", fill: ink, track: 0.12 }); drawText(g, "1,20 €".replace("€", "").trim(), { font: "typew", cap: 17, x: w - 62, y: 200, align: "right", fill: ink });
    drawText(g, mot(32, "DÉPLIÉ"), { font: "didot", cap: (w - 130) / measure(mot(32, "DÉPLIÉ"), "didot", 1, 0.02), x: w / 2, y: 500, fill: ink, track: 0.02 }); g.fillStyle = "#c8281c"; g.fillRect(60, 548, w - 120, 12);
    g.fillStyle = "#c8281c"; g.fillRect(60, 600, 420, 300); g.fillStyle = "#f1ead9"; for (let y = 612; y < 892; y += 13) for (let x = 70 + ((y / 13) % 2) * 6.5; x < 472; x += 13) { g.beginPath(); g.arc(x, y, 1 + 4.6 * (1 - Math.hypot(x - 270, y - 750) / 300), 0, 7); g.fill(); }
    g.fillStyle = "rgba(23,21,18,0.62)"; const col = (x0, y0, wd, n) => { for (let i = 0; i < n; i++) g.fillRect(x0, y0 + i * 17, wd * (i === n - 1 ? 0.5 : 0.86 + r() * 0.14), 7); }; col(520, 606, 440, 18); col(60, 940, 290, 19); col(372, 940, 290, 19); col(684, 940, 280, 19); });
  const U = { uT: { value: 0 }, uU: { value: 0 }, uRoll: { value: 0 }, uC: { value: new THREE.Vector3() }, uTex: { value: tex } };
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH, 170, 210), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
    vertexShader: GLSL + `uniform float uT, uU, uRoll; uniform vec3 uC; varying vec2 vUv; varying vec3 vP;
      float cr(vec2 p, vec2 d, float f, float ph){ return abs(fract(dot(p, d) * f + ph) - .5) * 2.; }
      void main(){ vUv = uv; vec2 p = position.xy;
        float th = p.x * 1.85 + 1.3 * sin(p.y * 2.1 + .5), ph = p.y * 1.45 + 1.1 * sin(p.x * 2.7), R = .78 + .2 * sin(p.x * 5.1 + p.y * 3.3) + .13 * sin(p.x * 11. - p.y * 7.);
        vec3 b = normalize(vec3(sin(th) * cos(ph * .7), sin(ph), cos(th) * cos(ph * .7))) * R; float c = cos(uRoll), s = sin(uRoll); b = vec3(b.x * c - b.y * s, b.x * s + b.y * c, b.z);
        float fold = (cr(p, vec2(.8, .6), .9, .1) - .5) * .5 + (cr(p, vec2(-.5, .86), 1.3, .4) - .5) * .34 + (cr(p, vec2(.97, -.2), 2.1, .7) - .5) * .2 + (cr(p, vec2(.3, .95), 3.4, .2) - .5) * .11;
        float e = uU * uU * (3. - 2. * uU), amp = 2.3 * e * pow(1. - e, 1.25) + .05 * (1. - sst(.86, 1., uU)) * e;
        vec3 plat = vec3(p.x * (1. - .12 * (1. - e)), p.y * (1. - .12 * (1. - e)) + ${(PH / 2 + 0.15).toFixed(2)}, fold * amp);
        vec3 q = mix(b + uC, plat, e); vP = (modelViewMatrix * vec4(q, 1.)).xyz; gl_Position = projectionMatrix * vec4(vP, 1.); }`,
    fragmentShader: `uniform sampler2D uTex; varying vec2 vUv; varying vec3 vP; void main(){ vec3 n = normalize(cross(dFdx(vP), dFdy(vP))); if (!gl_FrontFacing) n = -n; float l = max(dot(n, normalize(vec3(-.45, .5, .75))), 0.);
        vec3 c = gl_FrontFacing ? texture2D(uTex, vUv).rgb : vec3(.86, .82, .72); gl_FragColor = vec4(c * (.36 + .78 * l), 1.); }` })); paper.frustumCulled = false; scene.add(paper);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), matte(0x1d3530, { roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; scene.add(floor); scene.add(new THREE.HemisphereLight(0xffffff, 0x1d3530, 1.4));
  const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }) })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; scene.add(sh);
  const BX = pchip([[0, -5.2], [1.5, -0.2], [2.0, 0]]), AZ = pchip([[0, -16], [3, -6], [6, 4]]), EL = pchip([[0, 9], [3, 6], [6, 2]]), DS = pchip([[0, 10], [2, 11.5], [4.6, 14.2], [6, 13.6]]), TY = pchip([[0, 1.0], [2, 1.2], [4.4, PH / 2 + 0.15], [6, PH / 2 + 0.15]]), TX = pchip([[0, -2.6], [1.8, 0], [6, 0]]);
  return { n: 32, title: "Défroissage", style: "Presse (journal du matin)", font: "Playfair Display Black", cam: "suit la boule, puis recule avec la page", geste: "la boule de papier roule, se déplie, garde ses plis, puis se lisse", scene, camera, accent: "#e04a3a", bloom: [0.06, 0.4, 1.4], tone: "neutral",
    render(t) {
      const x = BX(t), hop = Math.abs(Math.sin(Math.min(t, 1.9) * 4.2)) * 0.5 * Math.exp(-t * 0.9), u = eio((t - 1.7) / 2.9); U.uT.value = t; U.uU.value = u; U.uRoll.value = -x / 0.85; U.uC.value.set(x, 0.92 + hop, 0);
      sh.position.x = x * (1 - u); sh.scale.set(1.1 + 1.6 * u, 0.9 - 0.5 * u, 1); sh.material.opacity = 1 - 0.5 * u;
      orbit(camera, { az: AZ(t), el: EL(t), dist: DS(t), target: [TX(t), TY(t), 0] });
    } };
}
