// 25 · Chaîne de dominos — Bauhaus : les dominos posés sur les contours du mot tombent en chaîne ; leur dos coloré dessine le mot vu d'en haut
import { THREE, wordContours, matte, paint, rig, pchip, makeCam, fitDist, orbit, clamp, ei , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), BG = 0xf1ede2; scene.environment = K.env; scene.environmentIntensity = 0.4; scene.background = new THREE.Color(BG);
  rig(scene, { key: 2.7, pos: [-5, 10, 6], amb: 0.85, size: 9, map: 4096, soft: 3, ground: BG });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), matte(BG, { roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const C = wordContours(mot(25, "DOMINO"), { font: "black", cap: 1.55, track: 0.1, step: 0.062 }), DW = 0.13, DH = 0.25, DTk = 0.02, T0 = 0.5, TFALL = 3.1, PAL = [0xe63329, 0x1c4fd6, 0xf7c400];
  const geo = new THREE.BoxGeometry(DW, DH, DTk); geo.translate(0, DH / 2, -DTk / 2); const ivory = paint(0xf7f2e4, { roughness: 0.35 }), D = [[], [], []];
  for (const c of C) { const n = c.pts.length; for (let k = 0; k < n; k++) { const a = c.pts[k], b = c.pts[(k + 1) % n]; D[c.li % 3].push({ x: a[0], z: -a[1], yaw: Math.atan2(b[0] - a[0], -(b[1] - a[1])), d: T0 + (k / n) * TFALL }); } }
  const meshes = D.map((arr, g) => { const im = new THREE.InstancedMesh(geo, [ivory, ivory, ivory, ivory, ivory, paint(PAL[g], { roughness: 0.3 })], arr.length); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); return im; });
  const total = D[0].length + D[1].length + D[2].length, o = new THREE.Object3D(); o.rotation.order = "YXZ";
  const DT = fitDist(C.width, 30, 0.9);
  const AZ = pchip([[0, -38], [2.4, -20], [4.4, 0], [6, 0]]), EL = pchip([[0, 13], [2.2, 24], [3.6, 56], [4.8, 86], [6, 87.5]]), DK = pchip([[0, 0.34], [2.2, 0.5], [3.6, 0.8], [4.8, 1], [6, 0.97]]), TX = pchip([[0, -2.6], [2.2, -1.2], [3.8, 0], [6, 0]]);
  return { n: 25, title: "Chaîne de dominos", style: "Bauhaus (couleurs primaires)", font: "Archivo Black", cam: "au ras des dominos, puis grue jusqu'à la plongée totale", geste: `${total.toLocaleString("fr-FR")} dominos tombent en chaîne ; leurs dos dessinent le mot`, scene, camera, light: true, accent: "#e63329", bloom: [0.06, 0.4, 1.4], vig: 0.14, tone: "neutral",
    render(t) {
      D.forEach((arr, g) => { arr.forEach((q, i) => { o.position.set(q.x, 0, q.z); o.rotation.set(1.26 * ei(clamp((t - q.d) / 0.26)) ** 0.9, q.yaw, 0); o.updateMatrix(); meshes[g].setMatrixAt(i, o.matrix); }); meshes[g].instanceMatrix.needsUpdate = true; });
      orbit(camera, { az: AZ(t), el: EL(t), dist: DT * DK(t), target: [TX(t), 0.1, 0] });
    } };
}
