// 37 · Accordéon — risographie : une bande de neuf panneaux pliée en zigzag se déplie et s'aligne, une lettre par panneau
import { THREE, drawText, canvasTex, matte, rig, pchip, makeCam, fitDist, orbit, backOut, clamp, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), BG = 0xf2e9d6; scene.environment = K.env; scene.environmentIntensity = 0.35; scene.background = new THREE.Color(BG);
  rig(scene, { key: 2.6, pos: [-5, 8, 7], amb: 0.9, size: 9, map: 4096, soft: 4, ground: BG });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), matte(BG, { roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const TXT = mot(37, "ACCORDÉON"), NPN = TXT.length, PWd = 0.8, PHt = 2.0, INK = ["#ff48b0", "#0078bf", "#ffe800"], r = mulberry(37), grp = new THREE.Group(), panels = []; scene.add(grp);
  const back = matte(0xe9dfc8, { roughness: 0.9 });
  [...TXT].forEach((ch, k) => { const bgc = INK[k % 3], fc = INK[(k + 1) % 3], gh = INK[(k + 2) % 3];
    const tx = canvasTex(256, 640, (g, w, h) => { g.fillStyle = "#f4ecd9"; g.fillRect(0, 0, w, h); g.globalCompositeOperation = "multiply"; g.fillStyle = bgc; g.fillRect(10, 10, w - 20, h - 20); drawText(g, ch, { font: "phos", cap: 250, x: w / 2 + 7, y: h / 2 + 131, fill: gh }); drawText(g, ch, { font: "phos", cap: 250, x: w / 2, y: h / 2 + 125, fill: fc });
      g.globalCompositeOperation = "source-over"; for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(244,236,217,${0.15 + r() * 0.4})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); } g.fillStyle = "#171512"; g.fillRect(w / 2 - 14, h - 44, 28, 4); });
    const front = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85 }), m = new THREE.Mesh(new THREE.BoxGeometry(PWd, PHt, 0.018), [back, back, back, back, front, back]); m.castShadow = true; m.receiveShadow = true; grp.add(m); panels.push(m); });
  const D0 = fitDist(NPN * PWd, 30, 0.92), AZ = pchip([[0, 62], [2.4, 38], [4.4, 4], [6, -3]]), EL = pchip([[0, 16], [3, 12], [6, 4]]), DK = pchip([[0, 0.62], [2.6, 0.84], [4.6, 1], [6, 0.97]]);
  return { n: 37, title: "Accordéon", style: "Risographie (trois encres)", font: "Bungee", cam: "de profil sur les plis, puis de face", geste: "neuf panneaux pliés en zigzag se déplient et s'alignent", scene, camera, light: true, accent: "#ff48b0", bloom: [0.06, 0.4, 1.4], vig: 0.14, tone: "neutral",
    render(t) {
      const phi = 1.43 * (1 - backOut(clamp((t - 0.9) / 3.0), 0.9)); let x = 0, z = 0, sx = 0, sz = 0; const pos = [];
      for (let k = 0; k < NPN; k++) { const a = (k % 2 ? -1 : 1) * phi, dx = Math.cos(a) * PWd, dz = Math.sin(a) * PWd; pos.push([x + dx / 2, z + dz / 2, a]); sx += x + dx / 2; sz += z + dz / 2; x += dx; z += dz; }
      pos.forEach((p, k) => { panels[k].position.set(p[0] - sx / NPN, PHt / 2 + 0.005, p[1] - sz / NPN); panels[k].rotation.y = -p[2]; });
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, PHt / 2, 0] });
    } };
}
