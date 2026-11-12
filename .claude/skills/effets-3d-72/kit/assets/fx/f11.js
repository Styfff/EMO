// 11 · Torsion et courbure — art vectoriel : un ruban typographique noué en spirale, qui se tord puis se déroule en bannière
import { THREE, drawText, canvasTex, pchip, makeCam, orbit, eio, ss, measure , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(24); scene.background = new THREE.Color(0xf3ecdd);
  const LEN = 20, WID = 1.15, REP = 4, tex = canvasTex(2048, 400, (g, w, h) => { g.fillStyle = "#000"; g.fillRect(0, 0, w, h); const cap = Math.min(250, (w - 200) / measure(mot(11, "TORSION"), "futura", 1, 0.05)), tw = measure(mot(11, "TORSION"), "futura", cap, 0.05); drawText(g, mot(11, "TORSION"), { font: "futura", cap, x: w / 2, y: h / 2 + cap / 2, fill: "#fff", track: 0.05 }); g.fillStyle = "#fff"; g.beginPath(); g.arc(w - 60, h / 2, 34, 0, 7); g.fill(); g.beginPath(); g.arc(60, h / 2, 34, 0, 7); g.fill(); }, { srgb: false });
  tex.wrapS = THREE.RepeatWrapping;
  const U = { uT: { value: 0 }, uU: { value: 0 }, uTex: { value: tex }, uSh: { value: 0 } };
  const VS = `uniform float uT, uU, uSh; varying vec2 vUv; varying vec3 vP;
    vec3 coil(float s, float v){ float ph = s * 6.2832 * 1.75 + uT * .55, R = 2.05 + .35 * sin(ph * 2.); vec3 c = vec3(R * cos(ph), R * sin(ph) * .92, 1.1 * sin(ph * 1.5 + .6));
      vec3 tg = normalize(vec3(-sin(ph), cos(ph) * .92, .7 * cos(ph * 1.5 + .6))), nr = normalize(cross(tg, vec3(0., 0., 1.))), bn = cross(tg, nr); float tw = ph * 2.5 + uT * 1.6; return c + (cos(tw) * bn + sin(tw) * nr) * v; }
    void main(){ vUv = uv; float s = uv.x - .5, v = (uv.y - .5) * ${WID}; vec3 a = coil(s, v);
      float tw2 = (1. - uU) * 0. + sin(s * 14. - uT * 3.) * .0; vec3 b = vec3(s * ${LEN}., v + .1 * sin(s * 26. - uT * 4.) * (1. - abs(uv.y - .5)), .22 * sin(s * 26. - uT * 4. + 1.));
      float k = clamp(uU * 1.5 - abs(s) * 1.0 * (1. - uU), 0., 1.); k = k * k * (3. - 2. * k); vec3 p = mix(a, b, k); p += vec3(.16, -.16, -.5) * uSh; vP = (modelViewMatrix * vec4(p, 1.)).xyz; gl_Position = projectionMatrix * vec4(vP, 1.); }`;
  const FS = `uniform sampler2D uTex; uniform float uSh; varying vec2 vUv; varying vec3 vP;
    void main(){ if (uSh > .5) { gl_FragColor = vec4(.80, .74, .62, 1.); return; } vec3 n = normalize(cross(dFdx(vP), dFdy(vP))); float m = texture2D(uTex, vec2(vUv.x * ${REP}. + .5, vUv.y)).r, edge = step(.045, vUv.y) * step(vUv.y, .955);
      float l = abs(dot(n, normalize(vec3(.35, .5, .8)))), tone = l > .62 ? 1. : l > .3 ? .86 : .7;
      vec3 A = mix(vec3(1., .33, .27), vec3(.96, .93, .86), m), B = mix(vec3(.10, .15, .36), vec3(.98, .76, .22), m); vec3 c = gl_FrontFacing ? A : B; c = mix(gl_FrontFacing ? vec3(.10, .15, .36) : vec3(.98, .76, .22), c, edge); gl_FragColor = vec4(c * tone, 1.); }`;
  const geo = new THREE.PlaneGeometry(1, 1, 1400, 10), mk = (sh) => { const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...U, uSh: { value: sh } }, vertexShader: VS, fragmentShader: FS, side: THREE.DoubleSide })); m.frustumCulled = false; scene.add(m); return m; };
  const shadow = mk(1), ribbon = mk(0), sync = (m) => { m.material.uniforms.uT.value = U.uT.value; m.material.uniforms.uU.value = U.uU.value; };
  const AZ = pchip([[0, 46], [3.4, 14], [5.2, 0], [6, -3]]), EL = pchip([[0, 26], [3.4, 12], [5.2, 2], [6, 0]]), DK = pchip([[0, 17], [3.2, 16.4], [5.2, 15.6], [6, 15.3]]);
  return { n: 11, title: "Torsion et courbure", style: "Art vectoriel (aplats)", font: "Jost Bold", cam: "orbite autour du nœud, puis de face", geste: "le ruban se tord en spirale, puis se déroule en bannière", scene, camera, light: true, accent: "#ff5445", bloom: [0, 0.4, 2], vig: 0.1, tone: "neutral",
    render(t) { U.uT.value = t; U.uU.value = eio((t - 2.9) / 2.2); sync(shadow); sync(ribbon); orbit(camera, { az: AZ(t), el: EL(t), dist: DK(t), target: [0, 0, 0] }); } };
}
