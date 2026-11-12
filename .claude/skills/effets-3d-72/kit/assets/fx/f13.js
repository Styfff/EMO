// 13 · Tranches glissantes — éditorial : le mot coupé en 7 bandes horizontales qui glissent, sections rouges ; puis tout se recale
import { THREE, scanRuns, paint, matte, rig, shadowFloor, pchip, makeCam, fitDist, orbit, eio , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(28); scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = new THREE.Color(0xe9e1d2);
  rig(scene, { key: 2.6, pos: [-5, 8, 8], amb: 0.9, size: 8, map: 4096, soft: 4, ground: 0xe9e1d2 });
  const R = scanRuns(mot(13, "COUPE"), { font: "bodoni", width: 6.2, rows: 84, res: 2400 }), DEPTH = 0.7, N = R.runs.length, NB = 7, AMP = [1.0, -0.75, 1.3, -1.1, 0.8, -1.25, 0.9];
  const ink = paint(0x121212, { roughness: 0.32 }), red = matte(0xe2351b, { roughness: 0.5 }), im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), [ink, ink, red, red, ink, ink], N); im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
  shadowFloor(scene, -R.height / 2 - 0.02, 0.3);
  const o = new THREE.Object3D(), D0 = fitDist(6.2, 28, 0.8);
  const AZ = pchip([[0, -30], [3, -14], [5.3, 0], [6, 2]]), EL = pchip([[0, 22], [3, 18], [5.4, 6], [6, 4]]), DK = pchip([[0, 1.28], [3, 1.3], [5.4, 1.02], [6, 0.98]]);
  return { n: 13, title: "Tranches glissantes", style: "Éditorial", font: "Bodoni Moda ExtraBold", cam: "arc latéral en plongée, puis de face", geste: "sept bandes horizontales glissent, sections rouges, puis se recalent", scene, camera, light: true, accent: "#e2351b", bloom: [0.06, 0.4, 1.4], vig: 0.14, tone: "neutral",
    render(t) {
      const dx = []; for (let b = 0; b < NB; b++) dx.push(AMP[b] * (eio((t - 0.8 - b * 0.1) / 0.9) - 1.6 * eio((t - 2.7 - b * 0.08) / 0.9) + 0.6 * eio((t - 4.2 - b * 0.08) / 0.8)));
      for (let i = 0; i < N; i++) { const q = R.runs[i], fr = (q.r + 0.5) / R.rows, b = Math.min(NB - 1, Math.floor(fr * NB));
        o.position.set((q.x0 + q.x1) / 2 + dx[b], (fr - 0.5) * R.height, 0); o.scale.set(q.x1 - q.x0, R.rowH * 1.002, DEPTH); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
      im.instanceMatrix.needsUpdate = true; orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0, 0] });
    } };
}
