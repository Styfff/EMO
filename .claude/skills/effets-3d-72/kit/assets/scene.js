// Maître v3 : N effets × 6 s. Chaque image = SUB sous-images (flou de mouvement + anticrénelage par décalage sous-pixel), puis halo et sortie.
import { run, fonts } from "./cmdlib.js";
import { THREE, studioEnv, rad } from "./kit.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { TexturePass } from "three/addons/postprocessing/TexturePass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ALL } from "./fx/index.js";
import { CONFIG } from "./config.js";
const LIST = CONFIG.effets.map((n) => { if (!ALL[n]) throw new Error("effet inconnu : " + n); return ALL[n]; });
if (CONFIG.entete === false) document.getElementById("root").classList.add("nohead");
const D = 6, DUR = D * LIST.length, W = 1080, H = 1350, SUB = 8, FPS = 30;
await fonts(['700 44px "Inter"', '400 21px "JetBrains Mono"']);
const canvas = document.getElementById("scene"), renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;
const rtScene = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: true }), rtAcc = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
const accMat = new THREE.ShaderMaterial({ uniforms: { tD: { value: rtScene.texture }, uW: { value: 1 / SUB } }, depthTest: false, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: "uniform sampler2D tD; uniform float uW; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tD, vUv).rgb * uW, 1.); }" });
const accScene = new THREE.Scene(), accCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), accMat); q.frustumCulled = false; accScene.add(q); }
const composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new TexturePass(rtAcc.texture)); const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.6, 1.0); composer.addPass(bloom);
const fin = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uV: { value: 0.35 }, uCA: { value: 0 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
  fragmentShader: "uniform sampler2D tDiffuse; uniform float uV, uCA; varying vec2 vUv; void main(){ vec2 d = vUv - .5; float r2 = dot(d, d); vec3 c = vec3(texture2D(tDiffuse, vUv - d * uCA * r2).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv + d * uCA * r2).b); c *= 1. - uV * smoothstep(.12, .62, r2); gl_FragColor = vec4(c, 1.); }" }); composer.addPass(fin);
composer.addPass(new OutputPass());
const K = { renderer, env: studioEnv(renderer), D, W, H, px: (cam) => (H * 0.5) / Math.tan(rad(cam.fov) / 2), studioEnv: (o) => studioEnv(renderer, o) };
// chaque effet est construit quand il passe à l'écran, et le précédent est libéré (mémoire graphique)
const FX = LIST.map(() => null);
const free = (sc) => sc.traverse((o) => { if (o.geometry) o.geometry.dispose(); const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u && u.value && u.value.isTexture) u.value.dispose(); m.dispose(); } });
const get = (i) => { if (!FX[i]) { FX.forEach((f, j) => { if (f && j !== i) { free(f.scene); FX[j] = null; } }); FX[i] = LIST[i](K); } return FX[i]; };
const root = document.getElementById("root"), $ = (id) => document.getElementById(id), J = [[0.5, 0.33], [0.25, 0.67], [0.75, 0.11], [0.125, 0.44], [0.625, 0.78], [0.375, 0.22], [0.875, 0.56], [0.0625, 0.89]];
let cur = -1;
function render(t) {
  const i = Math.min(FX.length - 1, Math.floor(t / D)), f = get(i), tl = Math.min(D, t - i * D);
  if (i !== cur) { cur = i; $("hn").textContent = String(f.n).padStart(2, "0") + " / 72"; $("ht").textContent = f.title; $("hs").textContent = f.style + " · " + f.font; $("hc").textContent = "caméra · " + f.cam; $("hg").textContent = "geste · " + f.geste;
    root.classList.toggle("light", !!f.light); root.style.setProperty("--accent", f.accent || "#ff6a1a"); renderer.toneMappingExposure = f.exposure ?? 1; renderer.toneMapping = f.tone === "neutral" ? THREE.NeutralToneMapping : f.tone === "agx" ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;
    const b = f.bloom || [0.25, 0.6, 1.0]; bloom.strength = b[0]; bloom.radius = b[1]; bloom.threshold = b[2]; fin.uniforms.uV.value = f.vig ?? 0.35; fin.uniforms.uCA.value = f.ca ?? 0; }
  $("barf").style.width = ((tl / D) * 100).toFixed(2) + "%";
  const sh = (typeof f.shutter === "function" ? f.shutter(tl) : f.shutter ?? 0.5) / FPS;
  for (let s = 0; s < SUB; s++) {
    f.render(Math.min(D, tl + (s / SUB) * sh), K);
    f.camera.setViewOffset(W, H, J[s][0] - 0.5, J[s][1] - 0.5, W, H);
    renderer.setRenderTarget(rtScene); renderer.autoClear = true; renderer.render(f.scene, f.camera);
    renderer.setRenderTarget(rtAcc); if (s === 0) { renderer.setClearColor(0x000000, 1); renderer.clear(); } renderer.autoClear = false; renderer.render(accScene, accCam); renderer.autoClear = true;
  }
  renderer.setRenderTarget(null); composer.render();
}
export const tl = run(DUR, render);
