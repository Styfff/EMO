// 7 · Prisme à mots — panneau trivision : 30 prismes verticaux pivotent en vague et changent toute l'affiche, trois fois
import { THREE, drawText, canvasTex, matte, rig, pchip, makeCam, fitDist, orbit, eio, clamp, bgLinear , mots , measure } from "../kit.js";
const W3 = mots(7, ["PENSER", "CRÉER", "LIVRER"]);
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32); scene.environment = K.env; scene.environmentIntensity = 0.35; scene.background = bgLinear([[0, "#120b2e"], [0.5, "#4a1d5e"], [0.82, "#ff6a3d"], [1, "#ffc46b"]]);
  rig(scene, { key: 1.6, pos: [-3, 5, 9], amb: 0.5, size: 7, color: 0xffd9b0 });
  const BW = 6.4, BH = 4.3, NP = 30, PW = BW / NP, AP = PW / (2 * Math.tan(Math.PI / 3)), TW = 1536, TH = Math.round(1536 * BH / BW);
  const posters = [
    (g, w, h) => { g.fillStyle = "#0a2bd6"; g.fillRect(0, 0, w, h); g.strokeStyle = "#fff"; g.lineWidth = 5; for (let i = 1; i < 9; i++) { g.beginPath(); g.arc(w * 0.82, h * 0.2, i * 62, 0, 7); g.stroke(); } drawText(g, W3[0], { font: "impact", cap: Math.min(330, (w - 140) / measure(W3[0], "impact", 1, 0.04)), x: w / 2, y: h * 0.74, fill: "#fff" }); drawText(g, "01 · UNE IDEE", { font: "impact", cap: 54, x: 90, y: 140, align: "left", fill: "#ffd400", track: 0.12 }); },
    (g, w, h) => { g.fillStyle = "#ff2e88"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; for (let y = 0; y < h; y += 46) for (let x = (y / 46 % 2) * 23; x < w; x += 46) { g.beginPath(); g.arc(x, y, 3 + 11 * (x / w), 0, 7); g.fill(); } drawText(g, W3[1], { font: "impact", cap: Math.min(380, (w - 140) / measure(W3[1], "impact", 1, 0.04)), x: w / 2, y: h * 0.76, fill: "#ffe600", stroke: "#111", lw: 14 }); drawText(g, "02 · UNE FORME", { font: "impact", cap: 54, x: 90, y: 140, align: "left", fill: "#111", track: 0.12 }); },
    (g, w, h) => { g.fillStyle = "#c8ff2e"; g.fillRect(0, 0, w, h); g.fillStyle = "#111"; for (let i = -6; i < 30; i++) { g.save(); g.translate(i * 110, h); g.rotate(-0.9); g.fillRect(0, 0, 40, 420); g.restore(); } g.fillStyle = "#c8ff2e"; g.fillRect(0, h * 0.2, w, h * 0.62); drawText(g, W3[2], { font: "impact", cap: Math.min(340, (w - 140) / measure(W3[2], "impact", 1, 0.04)), x: w / 2, y: h * 0.74, fill: "#111" }); drawText(g, "03 · UN FILM", { font: "impact", cap: 54, x: 90, y: h * 0.2 + 100, align: "left", fill: "#111", track: 0.12 }); },
  ].map((d) => canvasTex(TW, TH, d)), mats = posters.map((tx) => new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.34 }));
  const prisms = [];
  for (let i = 0; i < NP; i++) { const p = new THREE.Group(); p.position.x = (i + 0.5) * PW - BW / 2;
    for (let f = 0; f < 3; f++) { const g = new THREE.PlaneGeometry(PW * 0.985, BH), uv = g.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / NP); const h = new THREE.Group(); h.rotation.y = f * 2 * Math.PI / 3; const m = new THREE.Mesh(g, mats[f]); m.position.z = AP; h.add(m); p.add(h); }
    scene.add(p); prisms.push(p); }
  const steel = matte(0x15161a, { roughness: 0.45, metalness: 0.7 }), box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), steel); m.position.set(x, y, z); m.castShadow = true; scene.add(m); };
  box(BW + 0.36, 0.18, 0.5, 0, BH / 2 + 0.09, 0); box(BW + 0.36, 0.18, 0.5, 0, -BH / 2 - 0.09, 0); box(0.18, BH + 0.36, 0.5, -BW / 2 - 0.09, 0, 0); box(0.18, BH + 0.36, 0.5, BW / 2 + 0.09, 0, 0); box(0.3, 9, 0.3, -1.8, -BH / 2 - 4.6, -0.2); box(0.3, 9, 0.3, 1.8, -BH / 2 - 4.6, -0.2);
  for (let i = 0; i < 5; i++) { box(0.05, 0.05, 0.9, (i - 2) * 1.4, BH / 2 + 0.25, 0.5); const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5, 3.5) })); l.position.set((i - 2) * 1.4, BH / 2 + 0.2, 0.95); scene.add(l); }
  const D0 = fitDist(BW + 0.5, 32, 0.9), T1 = 1.5, T2 = 3.7, S = (x) => { x = clamp(x); return eio(x) + 0.07 * Math.sin(Math.PI * x) * Math.sin(Math.PI * 2 * x); };
  const AZ = pchip([[0, -50], [3, -14], [6, 8]]), EL = pchip([[0, -16], [3, -7], [6, -2]]), DK = pchip([[0, 0.78], [3, 0.95], [6, 1]]);
  return { n: 7, title: "Prisme à mots", style: "Maximalisme (panneau trivision)", font: "Anton", cam: "contre-plongée au pied du panneau, qui revient de face", geste: "30 prismes pivotent en vague : toute l'affiche change", scene, camera, accent: "#ffe600", bloom: [0.22, 0.6, 1.1], tone: "neutral",
    render(t) {
      prisms.forEach((p, i) => { p.rotation.y = -(2 * Math.PI / 3) * (S((t - T1 - i * 0.034) / 0.75) + S((t - T2 - (NP - 1 - i) * 0.034) / 0.75)); });
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.15, 0] });
    } };
}
