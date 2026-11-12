// 53 · Kaléidoscope — psychédélique : formes et lettres tournent dans 6 secteurs en miroir ; les miroirs s'effacent et les lettres se rangent en mot
import { THREE, word, paint, pchip, clamp, eio, ss, mulberry , mot } from "../kit.js";
export function make(K) {
  const W = K.W, H = K.H, rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }), cs = new THREE.Scene(), cc = new THREE.PerspectiveCamera(30, W / H, 0.1, 100); cs.background = new THREE.Color(0x2b0f4c); cs.environment = K.env; cs.environmentIntensity = 0.6;
  cs.add(new THREE.HemisphereLight(0xffffff, 0x2b0f4c, 1.0)); const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(-3, 4, 8); cs.add(dl); cc.position.set(0, 0, 14); cc.lookAt(0, 0, 0);
  const PAL = [0xff3ea5, 0xff9f1c, 0x2ec4b6, 0xfff1d0], r = mulberry(53), shapes = [];
  const geos = [new THREE.TorusGeometry(0.35, 0.12, 16, 40), new THREE.OctahedronGeometry(0.42), new THREE.TetrahedronGeometry(0.45), new THREE.SphereGeometry(0.3, 24, 16), new THREE.TorusKnotGeometry(0.26, 0.08, 64, 10)];
  for (let i = 0; i < 46; i++) { const m = new THREE.Mesh(geos[i % geos.length], paint(PAL[i % 4], { roughness: 0.3 })); cs.add(m); shapes.push({ m, R: 0.6 + r() * 4.4, a: r() * 6.283, w: (0.2 + r() * 0.6) * (r() < 0.5 ? -1 : 1), s: 0.5 + r() * 1.1, sp: new THREE.Vector3(r(), r(), r()) }); }
  const w = word(mot(53, "OPTIQUE"), { font: "copper", cap: 0.45, depth: 0.25, bevel: 0.02, track: 0.08 }), L = w.letters.map((l, i) => { const m = new THREE.Mesh(l.geo, paint(PAL[(i + 1) % 4], { roughness: 0.25 })); cs.add(m); return { m, x: l.x, i, R: 1.2 + (i % 3) * 1.1, a: (i / 7) * 6.283 }; });
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), U = { uTex: { value: rt.texture }, uK: { value: 1 }, uRot: { value: 0 }, uA: { value: W / H } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, depthTest: false, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: `uniform sampler2D uTex; uniform float uK, uRot, uA; varying vec2 vUv; void main(){ vec2 p = (vUv - .5) * vec2(uA, 1.); float r = length(p), a = atan(p.y, p.x) + uRot, sg = 1.0471976, b = mod(a, 2. * sg); b = b > sg ? 2. * sg - b : b; b -= uRot;
      float a2 = mix(atan(p.y, p.x), b, uK); vec2 q = vec2(cos(a2), sin(a2)) * r / vec2(uA, 1.) + .5; vec3 c = texture2D(uTex, q).rgb; float edge = uK * (1. - smoothstep(.0, .006, abs(mod(a, sg) - sg * .5) - sg * .5 + .006)) * .0; gl_FragColor = vec4(c + edge, 1.); }` })); quad.frustumCulled = false; scene.add(quad);
  return { n: 53, title: "Kaléidoscope", style: "Psychédélique (années 70)", font: "Cinzel Black", cam: "fixe dans l'axe du tube, le motif tourne", geste: "six miroirs, puis les reflets s'effacent et les lettres se rangent en mot", scene, camera, accent: "#ff3ea5", bloom: [0.15, 0.5, 1.2], tone: "neutral", vig: 0.4,
    render(t, K) {
      const open = eio((t - 3.6) / 1.4), settle = eio((t - 3.3) / 1.7); U.uK.value = 1 - open; U.uRot.value = t * 0.35;
      for (const s of shapes) { const a = s.a + s.w * t; s.m.position.set(Math.cos(a) * s.R * (1 + open * 1.6), Math.sin(a) * s.R * (1 + open * 1.6), -1 - s.R * 0.3); s.m.rotation.set(t * s.sp.x * 2, t * s.sp.y * 2, t * s.sp.z * 2); s.m.scale.setScalar(s.s * (1 - 0.7 * open)); }
      for (const q of L) { const a = q.a + t * 0.6 * (q.i % 2 ? 1 : -1), px = Math.cos(a) * q.R, py = Math.sin(a) * q.R * 0.8; q.m.position.set(px + (q.x - px) * settle, py * (1 - settle), 0.5 * settle); q.m.rotation.set(0, (1 - settle) * t * 1.5, (1 - settle) * (a + 1.2)); }
      K.renderer.setRenderTarget(rt); K.renderer.render(cs, cc); K.renderer.setRenderTarget(null);
    } };
}
