// 40 · Ville qui pousse — la nuit tombe : 13 000 immeubles poussent en onde ; vue du ciel, les toits du mot s'allument
import { THREE, textMask, gpuInst, pchip, makeCam, fitDist, orbit, ss, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), DAY = new THREE.Color(0xf0b184), NIGHT = new THREE.Color(0x090a26); scene.environment = K.env; scene.environmentIntensity = 0.25; scene.background = DAY.clone(); scene.fog = new THREE.Fog(0xf0b184, 22, 62);
  const hemi = new THREE.HemisphereLight(0xfff0dc, 0x4a3a50, 1.0), sun = new THREE.DirectionalLight(0xffd8a8, 2.8); sun.position.set(-8, 6, 5); scene.add(hemi, sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x26222e, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);
  const NX = 100, NZ = 130, S = 0.13, N = NX * NZ, m = textMask(mot(40, "VILLE"), { font: "helv", width: 11, res: 1400, pad: 0.02 }), r = mulberry(40), aC = new Float32Array(N * 2), aD = new Float32Array(N * 3);
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i, x = (i - (NX - 1) / 2) * S, z = (j - (NZ - 1) / 2) * S, px = Math.round(x / m.scale + m.w / 2), py = Math.round(z / m.scale + m.h / 2), inW = px >= 0 && py >= 0 && px < m.w && py < m.h && m.at(px, py) > 128 ? 1 : 0;
    aC.set([x, z], k * 2); aD.set([inW ? 1.5 + r() * 0.8 : 0.16 + r() * r() * 0.85, inW, r()], k * 3); }
  const U = { uT: { value: 0 }, uN: { value: 0 } };
  scene.add(gpuInst(new THREE.BoxGeometry(S * 0.88, 1, S * 0.88), new THREE.MeshStandardMaterial({ roughness: 0.6 }), N, { aC: [2, aC], aD: [3, aD] }, U, {
    decl: "attribute vec2 aC; attribute vec3 aD; uniform float uT; varying vec3 vL; varying vec3 vNo; varying vec3 vD;",
    pos: "float gr = sst(0., 1., (uT - .15 - length(aC) * .16 - aD.z * .25) / .9), hh = .015 + aD.x * gr, yy = (position.y + .5) * hh; vNo = normal; vL = vec3(position.x, yy, position.z); vD = vec3(hh, aD.y, aD.z); transformed = vec3(position.x + aC.x, yy, position.z + aC.y);",
    frag: (fs) => fs.replace("#include <common>", "#include <common>\nuniform float uN; varying vec3 vL; varying vec3 vNo; varying vec3 vD;")
      .replace("#include <color_fragment>", "#include <color_fragment>\n float sideF = step(abs(vNo.y), .5); diffuseColor.rgb = mix(vec3(.62, .58, .55), vec3(.93, .24, .30), vD.y) * mix(1., .4 + .6 * smoothstep(0., .5, vL.y), sideF);")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float uu = abs(vNo.x) > .5 ? vL.z : vL.x; vec2 wc = vec2(uu * 46., vL.y * 26.), cl = floor(wc), fw = fract(wc); float wn = step(.2, fw.x) * step(fw.x, .8) * step(.25, fw.y) * step(fw.y, .75), lit = step(.52, fract(sin(dot(cl + vD.z * 37., vec2(12.9898, 78.233))) * 43758.5453));
        totalEmissiveRadiance += sideF * wn * lit * uN * mix(vec3(1.5, .95, .38), vec3(2.2, .4, 1.3), vD.y) + (1. - sideF) * vD.y * uN * vec3(3., .4, 1.5);`) }));
  const DT = fitDist(13, 30, 1.06), AZ = pchip([[0, -36], [3, -14], [4.6, 0], [6, 0]]), EL = pchip([[0, 14], [2, 26], [3.8, 66], [4.9, 88.5], [6, 89.2]]), DS = pchip([[0, 13], [2, 17], [3.8, 24], [4.9, DT], [6, DT * 0.98]]), fc = new THREE.Color();
  return { n: 40, title: "Ville qui pousse", style: "Isométrique (du jour à la nuit)", font: "Oswald Bold", cam: "survol bas, grue jusqu'à la plongée totale", geste: "13 000 immeubles poussent, la nuit tombe, les toits du mot s'allument", scene, camera, accent: "#ff4fa0", bloom: [0.4, 0.6, 0.95],
    render(t) { const n = ss(2.3, 4.2, t); U.uT.value = t; U.uN.value = n; scene.background.lerpColors(DAY, NIGHT, n); scene.fog.color.lerpColors(DAY, NIGHT, n); hemi.intensity = 1.0 - 0.9 * n; scene.environmentIntensity = 0.25 * (1 - 0.92 * n); sun.intensity = 2.8 * (1 - n * 0.93); orbit(camera, { az: AZ(t), el: EL(t), dist: DS(t), target: [0, 0.5, 0] }); } };
}
