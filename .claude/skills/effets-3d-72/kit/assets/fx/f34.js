// 34 · Miroirs infinis — salle aux miroirs : le mot et ses lanternes se répètent, de plus en plus sombres ; chaque lettre fait un tour, tous ses reflets avec
import { THREE, word, pchip, makeCam, fitDist, orbit, eio, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(40); scene.background = new THREE.Color(0x020203); scene.fog = new THREE.Fog(0x020203, 9, 46);
  const CX = 9.6, CY = 4.4, CZ = 7.5, cells = []; for (let k = -5; k <= 0; k++) for (let j = -1; j <= 1; j++) for (let i = -3; i <= 3; i++) cells.push([i * CX, j * CY, k * CZ, Math.pow(0.6, Math.abs(i) + Math.abs(j) * 1.3 + Math.abs(k))]);
  const NC = cells.length, w = word(mot(34, "INFINI"), { font: "copper", cap: 0.92, depth: 0.16, bevel: 0.012, track: 0.1 }), o = new THREE.Object3D(), L = [], col = new THREE.Color();
  for (const l of w.letters) { const im = new THREE.InstancedMesh(l.geo, new THREE.MeshBasicMaterial({ color: 0xffffff }), NC); im.frustumCulled = false; cells.forEach((c, n) => im.setColorAt(n, col.setRGB(1.25 * c[3], 1.05 * c[3], 0.72 * c[3]))); scene.add(im); L.push({ im, x: l.x, i: l.i }); }
  const r = mulberry(34), PAL = [[1.5, 0.8, 0.2], [1.4, 0.2, 0.85], [0.2, 1.1, 1.4], [1.1, 1.1, 1.1]], NL = 18, sg = new THREE.SphereGeometry(1, 14, 10), lan = PAL.map(() => { const im = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ color: 0xffffff }), Math.ceil(NL / 4) * NC); im.frustumCulled = false; scene.add(im); return im; }), cnt = [0, 0, 0, 0];
  for (let q = 0; q < NL; q++) { let x, y, z; do { x = (r() - 0.5) * CX; y = (r() - 0.5) * CY; z = (r() - 0.5) * CZ; } while (Math.abs(y) < 1.0 && Math.abs(x) < 3.6 && Math.abs(z) < 1.6); const s = 0.04 + r() * r() * 0.09, g = q % 4; for (const c of cells) { o.position.set(x + c[0], y + c[1], z + c[2]); o.rotation.set(0, 0, 0); o.scale.setScalar(s); o.updateMatrix(); lan[g].setMatrixAt(cnt[g], o.matrix); lan[g].setColorAt(cnt[g]++, col.setRGB(PAL[g][0] * c[3], PAL[g][1] * c[3], PAL[g][2] * c[3])); } }
  lan.forEach((im, g) => { im.count = cnt[g]; });
  const D0 = fitDist(w.width, 40, 0.84), AZ = pchip([[0, -22], [3, 13], [6, -3]]), EL = pchip([[0, 5], [3, -3], [6, 2]]), DK = pchip([[0, 1.22], [3, 1.1], [6, 0.98]]);
  return { n: 34, title: "Miroirs infinis", style: "Installation (salle aux miroirs)", font: "Cinzel Black", cam: "au centre de la salle, panoramique lent", geste: `le mot et ses ${NC - 1} reflets ; chaque lettre fait un tour, tous ses reflets avec`, scene, camera, accent: "#ffcf7a", bloom: [0.32, 0.6, 1.0],
    render(t) {
      for (const q of L) { const a = eio((t - 1.3 - q.i * 0.24) / 1.5) * Math.PI * 2; cells.forEach((c, n) => { o.position.set(q.x + c[0], c[1], c[2]); o.rotation.set(0, a, 0); o.scale.setScalar(1); o.updateMatrix(); q.im.setMatrixAt(n, o.matrix); }); q.im.instanceMatrix.needsUpdate = true; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0, 0] });
    } };
}
