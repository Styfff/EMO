// 39 · Phyllotaxie — tournesol : 22 000 graines en spirale d'or poussent du centre vers le bord ; celles du mot se soulèvent et dorent
import { THREE, textMask, gpuInst, pchip, makeCam, fitDist, orbit, ss, clamp, bgRadial, paint , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = bgRadial("#2f7a3a", "#17401f", "#08180b");
  scene.add(new THREE.HemisphereLight(0xfff6d0, 0x17401f, 0.9)); const sun = new THREE.DirectionalLight(0xfff0c8, 2.6); sun.position.set(-5, 9, 6); scene.add(sun);
  const N = 14000, RM = 3.7, cc = RM / Math.sqrt(N), aN = new Float32Array(N); for (let i = 0; i < N; i++) aN[i] = i;
  const m = textMask(mot(39, "SOLEIL"), { font: "cochin", width: 5.5, res: 1024, pad: 0.04, blur: 1.5 }), mt = new THREE.CanvasTexture(m.canvas), U = { uT: { value: 0 }, uG: { value: 0 }, uW: { value: 0 }, uMask: { value: mt } };
  const seeds = gpuInst(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05 }), N, { aN: [1, aN] }, U, {
    decl: `attribute float aN; uniform float uG, uW; uniform sampler2D uMask; varying float vMk; varying float vArm; vec2 sdP; float sdS;`,
    nrm: `float rr = ${cc.toFixed(5)} * sqrt(aN + .5), th = aN * 2.39996323; sdP = vec2(cos(th), sin(th)) * rr; float mk = texture2D(uMask, vec2(sdP.x / ${m.W.toFixed(3)} + .5, -sdP.y / ${m.Hh.toFixed(3)} + .5)).a; vMk = mk * sst(0., 1., (uW - rr / ${RM.toFixed(1)}) * 3.); vArm = step(10.5, mod(aN, 21.)); sdS = sst(0., 1., (uG * ${N}. - aN) / 900.);`,
    pos: `float sz = (.024 + .012 * sqrt(aN / ${N}.)) * sdS * (1. + .35 * vMk); transformed = transformed * vec3(sz, sz * .75, sz) + vec3(sdP.x, .02 + .16 * vMk, sdP.y);`,
    frag: (fs) => fs.replace("#include <common>", "#include <common>\nvarying float vMk; varying float vArm;").replace("#include <color_fragment>", "#include <color_fragment>\n diffuseColor.rgb = mix(mix(vec3(.13, .07, .03), vec3(.50, .29, .10), vArm), vec3(1., .74, .08), vMk);") }); scene.add(seeds);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(RM + 0.1, 96), new THREE.MeshStandardMaterial({ color: 0x24140a, roughness: 0.9 })); disc.rotation.x = -Math.PI / 2; scene.add(disc);
  const NPt = 34, ps = new THREE.Shape(); ps.moveTo(0, 0); ps.bezierCurveTo(0.42, 0.5, 0.36, 1.5, 0, 2.0); ps.bezierCurveTo(-0.36, 1.5, -0.42, 0.5, 0, 0); const pg = new THREE.ShapeGeometry(ps, 16); pg.rotateX(-Math.PI / 2); const petals = [], pmat = paint(0xf7b500, { roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < NPt * 2; i++) { const g = new THREE.Group(), a = (i / NPt) * Math.PI * 2 + (i >= NPt ? Math.PI / NPt : 0), mm = new THREE.Mesh(pg, pmat); g.rotation.y = a; mm.position.z = -(RM - 0.05); mm.position.y = i >= NPt ? -0.03 : -0.01; g.add(mm); scene.add(g); petals.push({ mm, i }); }
  const D0 = fitDist(2 * RM + 3.4, 30, 0.98), AZ = pchip([[0, 46], [3.4, 12], [6, 0]]), EL = pchip([[0, 80], [3.4, 82], [5.2, 66], [6, 62]]), DK = pchip([[0, 0.62], [3.2, 0.96], [6, 1]]);
  return { n: 39, title: "Phyllotaxie", style: "Botanique (tournesol)", font: "Cormorant Garamond Bold", cam: "plongée qui tourne et recule, puis s'incline", geste: "14 000 graines en spirale d'or ; celles du mot se soulèvent et dorent", scene, camera, accent: "#f7b500", bloom: [0.2, 0.5, 1.1],
    render(t) { U.uT.value = t; U.uG.value = ss(0.3, 3.3, t) * 1.05; U.uW.value = clamp((t - 3.1) / 1.3) * 1.4; for (const p of petals) { const s = ss(3.0 + (p.i % NPt) * 0.02, 4.2 + (p.i % NPt) * 0.02, t); p.mm.scale.set(s, 1, s * (p.i >= NPt ? 0.86 : 1)); p.mm.visible = s > 0.01; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0, 0] }); } };
}
