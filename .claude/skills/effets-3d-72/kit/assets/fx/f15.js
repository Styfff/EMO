// 15 · Écran d'épingles — Y2K chromé : 36 800 épingles ; ondes, une bille qui roule derrière, puis le mot en relief
import { THREE, textMask, gpuInst, matte, pchip, makeCam, fitDist, orbit, bgLinear , lignes } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.85; scene.background = bgLinear([[0, "#b9a8ff"], [0.5, "#f3c4ee"], [1, "#9fdcff"]]);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7ad8, 1.0)); const d1 = new THREE.DirectionalLight(0xffffff, 2.4); d1.position.set(-5, 7, 8); const d2 = new THREE.DirectionalLight(0xff7fd0, 1.6); d2.position.set(6, -3, 5); scene.add(d1, d2);
  const NX = 120, NY = 172, PITCH = 0.06, N = NX * NY, aP = new Float32Array(N * 2);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; aP[k * 2] = (i - NX / 2 + (j % 2) * 0.5) * PITCH; aP[k * 2 + 1] = (j - NY / 2) * PITCH * 0.866; }
  const m = textMask(lignes(15, ["20 640", "ÉPINGLES", "1 MOT"]), { font: "futc", width: 5.6, res: 1024, blur: 5, lineGap: 0.24 }), mt = new THREE.CanvasTexture(m.canvas), U = { uT: { value: 0 }, uMask: { value: mt }, uMW: { value: m.W }, uMH: { value: m.Hh } };
  const geo = new THREE.CylinderGeometry(PITCH * 0.45, PITCH * 0.45, 1, 8); geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.75, roughness: 0.3 });
  const pins = gpuInst(geo, mat, N, { aP: [2, aP] }, U, {
    decl: `attribute vec2 aP; uniform sampler2D uMask; uniform float uT, uMW, uMH; varying float vHt;
      float pinH(vec2 p){ float r = length(p - vec2(0., .2)), pulse = .45 * exp(-pow(r - 3.3 * (uT - .8), 2.) / .4) * step(.8, uT) * (1. - sst(2.5, 3.1, uT));
        float mk = texture2D(uMask, vec2(p.x / uMW + .5, .5 + (p.y + .3) / uMH)).a, wave = sst(0., 1., (uT - 2.7) * 2.2 - (3.9 - p.y) * .3);
        return pulse + mk * .9 * wave + .06 * sin(p.y * 5. - uT * 6.) * wave * (1. - wave) * 4. * (1. - mk); }`,
    pos: "float hh = pinH(aP); vHt = hh; transformed.xy += aP; transformed.z += hh - .5;",
    frag: (fs) => fs.replace("#include <common>", "#include <common>\nvarying float vHt;").replace("#include <color_fragment>", "#include <color_fragment>\n float hq = clamp(vHt / .85, 0., 1.); diffuseColor.rgb *= mix(mix(vec3(.62, .58, .92), vec3(1., .36, .74), smoothstep(.04, .5, hq)), vec3(1.), smoothstep(.5, 1., hq));") });
  scene.add(pins); const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), matte(0x1b1466)); back.position.z = -0.2; scene.add(back);
  const D0 = fitDist(NX * PITCH, 30, 0.98);
  const AZ = pchip([[0, -64], [2.6, -38], [4.8, 0], [6, 6]]), EL = pchip([[0, 30], [2.6, 18], [4.8, 3], [6, 0]]), DK = pchip([[0, 0.3], [2.6, 0.58], [4.8, 1], [6, 0.97]]);
  return { n: 15, title: "Écran d'épingles", style: "Y2K (chrome et dégradés)", font: "Bebas Neue", cam: "rasante, au plus près des épingles, puis de face", geste: "20 640 épingles : une onde les soulève, puis le mot sort en relief", scene, camera, accent: "#ff5fbf", bloom: [0.22, 0.6, 1.0], tone: "neutral",
    render(t) { U.uT.value = t; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, -0.3, 0.3] }); } };
}
