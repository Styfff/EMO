// 47 · Éventail de cartes — salon de jeu : dix cartes s'ouvrent en éventail, se retournent en vague, puis se rangent en ligne : INCROYABLE
import { THREE, drawText, measure, canvasTex, pchip, makeCam, fitDist, orbit, eio, clamp, mulberry, bgRadial , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.55; scene.background = bgRadial("#1f6a46", "#0f3d28", "#05170f");
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0f3d28, 0.9)); const key = new THREE.DirectionalLight(0xfff1d8, 1.6); key.position.set(-3, 5, 8); scene.add(key);
  const TXT = mot(47, "INCROYABLE"), NC = TXT.length, CW = 0.76, CH = 1.1, r = mulberry(47), RED = "#b3122e", GOLD = "#d9b252", INK = "#141414", SUITS = ["♠", "♥", "♦", "♣"];
  const rr = (g, w, h, rad) => { g.beginPath(); g.moveTo(rad, 0); g.arcTo(w, 0, w, h, rad); g.arcTo(w, h, 0, h, rad); g.arcTo(0, h, 0, 0, rad); g.arcTo(0, 0, w, 0, rad); g.closePath(); };
  const backT = canvasTex(320, 460, (g, w, h) => { rr(g, w, h, 26); g.fillStyle = "#f6efe0"; g.fill(); g.save(); rr(g, w, h, 26); g.clip(); g.fillStyle = RED; g.fillRect(14, 14, w - 28, h - 28); g.strokeStyle = GOLD; g.lineWidth = 2; for (let x = -h; x < w + h; x += 22) { g.beginPath(); g.moveTo(x, 14); g.lineTo(x + h, h); g.stroke(); g.beginPath(); g.moveTo(x + h, 14); g.lineTo(x, h); g.stroke(); } g.strokeStyle = GOLD; g.lineWidth = 5; g.strokeRect(26, 26, w - 52, h - 52); g.restore(); });
  const mats = [...TXT].map((ch, i) => { const red = i % 2 === 1, col = red ? RED : INK, tx = canvasTex(320, 460, (g, w, h) => { rr(g, w, h, 26); g.fillStyle = "#f8f2e4"; g.fill(); const cap = Math.min(250, 230 / measure(ch, "bodoni", 1, 0)); drawText(g, ch, { font: "bodoni", cap, x: w / 2, y: h / 2 + cap / 2, fill: col });
      drawText(g, ch, { font: "bodoni", cap: 40, x: 34, y: 66, fill: col }); g.save(); g.translate(w - 34, h - 66); g.rotate(Math.PI); drawText(g, ch, { font: "bodoni", cap: 40, x: 0, y: 0, fill: col }); g.restore(); g.strokeStyle = GOLD; g.lineWidth = 3; rr(g, w, h, 26); g.stroke(); });
    return new THREE.MeshStandardMaterial({ map: tx, roughness: 0.42, alphaTest: 0.5 }); });
  const backM = new THREE.MeshStandardMaterial({ map: backT, roughness: 0.42, alphaTest: 0.5 }), edge = new THREE.MeshBasicMaterial({ color: 0xf2ead8, transparent: true, opacity: 0 }), geo = new THREE.BoxGeometry(CW, CH, 0.006), cards = [];
  for (let i = 0; i < NC; i++) { const piv = new THREE.Group(), card = new THREE.Mesh(geo, [edge, edge, edge, edge, mats[i], backM]); piv.add(card); scene.add(piv); cards.push({ piv, card, i }); }
  const RAD = 2.4, PIV = new THREE.Vector3(0, -2.1, 0), D0 = fitDist(NC * (CW + 0.04), 30, 0.92), AZ = pchip([[0, -10], [6, 4]]), EL = pchip([[0, 4], [6, 2]]), DK = pchip([[0, 0.92], [3, 0.85], [6, 1.0]]);
  return { n: 47, title: "Éventail de cartes", style: "Salon de jeu (rouge, or, tapis vert)", font: "Bodoni Moda ExtraBold", cam: "de face, proche, puis recul", geste: "l'éventail s'ouvre, les cartes se retournent en vague, puis se rangent en ligne", scene, camera, accent: "#d9b252", bloom: [0.08, 0.4, 1.3], tone: "neutral",
    render(t) {
      const open = eio((t - 0.3) / 1.1), line = eio((t - 3.9) / 1.3);
      for (const c of cards) { const a = (-52 + (104 * c.i) / (NC - 1)) * (Math.PI / 180) * open, fanX = PIV.x + Math.sin(a) * RAD, fanY = PIV.y + Math.cos(a) * RAD, rowX = (c.i - (NC - 1) / 2) * (CW + 0.04), rowY = 0.15;
        c.piv.position.set(fanX + (rowX - fanX) * line, fanY + (rowY - fanY) * line, c.i * 0.004 * (1 - line)); c.piv.rotation.z = -a * (1 - line); const f = eio((t - 1.9 - c.i * 0.15) / 0.55); c.card.rotation.y = Math.PI * (1 - f) + Math.sin(Math.PI * f) * 0; c.card.position.z = Math.sin(Math.PI * f) * 0.25; }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.15, 0] });
    } };
}
