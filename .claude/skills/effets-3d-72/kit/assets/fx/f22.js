// 22 · Page qui tourne — collage manuscrit : un carnet feuilleté, 26 pages qui se courbent ; l'image avance de page en page
import { THREE, drawText, measure, canvasTex, inject, rig, pchip, makeCam, orbit, eio, clamp, mulberry, ss, matte , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.35; scene.background = new THREE.Color(0xb98d5a);
  rig(scene, { key: 2.4, pos: [-4, 9, 5], amb: 0.9, size: 8, color: 0xfff0d8, ground: 0xb98d5a });
  const r = mulberry(61), table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = "#c39a67"; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},${30 + r() * 30},${0.04 + r() * 0.07})`; g.fillRect(r() * w, r() * h, 2 + r() * 40, 1 + r() * 2); } }) })); table.rotation.x = -Math.PI / 2; table.position.y = -0.14; table.receiveShadow = true; scene.add(table);
  const PW = 3.0, PH = 4.0, NPG = 26, WORD = mot(22, "HISTOIRE"), pages = [], PAL = ["#e2351b", "#1d2a5c", "#111", "#f2c230"];
  const draw = (k) => (g, w, h) => { const f = k / (NPG - 1); g.fillStyle = k % 3 === 0 ? "#f3ead8" : k % 3 === 1 ? "#efe2c6" : "#f6efe2"; g.fillRect(0, 0, w, h); const q = mulberry(500 + k);
    for (let i = 0; i < 5; i++) { g.save(); g.translate(w * (0.2 + 0.6 * ((i * 0.37 + f * (0.4 + 0.2 * i)) % 1)), h * (0.16 + 0.13 * i + 0.05 * Math.sin(f * 6 + i))); g.rotate((i - 2) * 0.3 + f * (i % 2 ? 2.4 : -2.0)); g.fillStyle = PAL[i % 4]; g.globalAlpha = 0.92; const ww = 70 + 40 * i, hh = 46 + 18 * ((i * 7) % 3); g.beginPath(); g.moveTo(-ww / 2, -hh / 2); for (let s = 0; s <= 8; s++) g.lineTo(-ww / 2 + ww * s / 8, -hh / 2 + (q() - 0.5) * 9); g.lineTo(ww / 2, hh / 2); for (let s = 8; s >= 0; s--) g.lineTo(-ww / 2 + ww * s / 8, hh / 2 + (q() - 0.5) * 9); g.closePath(); g.fill(); g.restore(); }
    g.globalAlpha = 1; g.strokeStyle = "#e2351b"; g.lineWidth = 9; g.beginPath(); g.arc(w * 0.5, h * 0.44, 96, -1.57, -1.57 + 6.283 * Math.min(1, f * 1.15)); g.stroke();
    const nL = Math.min(WORD.length, Math.ceil(f * 1.12 * WORD.length)); if (nL > 0) drawText(g, WORD.slice(0, nL), { font: "brad", cap: Math.min(60, (w - 96) / measure(WORD, "brad", 1, 0.03)), x: 44, y: h * 0.78, align: "left", fill: "#151515", track: 0.03 });
    g.fillStyle = "#151515"; g.fillRect(44, h * 0.82, (w - 88) * Math.min(1, f * 1.1), 5); drawText(g, String(k + 1), { font: "typew", cap: 22, x: w - 44, y: h - 34, align: "right", fill: "#151515" });
    if (k === NPG - 1) drawText(g, "FIN", { font: "typew", cap: 30, x: 44, y: h * 0.9, align: "left", fill: "#e2351b", track: 0.3 });
    const sh = g.createLinearGradient(0, 0, 70, 0); sh.addColorStop(0, "rgba(60,40,20,0.35)"); sh.addColorStop(1, "rgba(60,40,20,0)"); g.fillStyle = sh; g.fillRect(0, 0, 70, h); };
  for (let k = 0; k < NPG; k++) { const geo = new THREE.PlaneGeometry(PW, PH, 48, 1); geo.translate(PW / 2, 0, 0); const U = { uTh: { value: 0 }, uBend: { value: 0 }, uY: { value: 0 } };
    const m = new THREE.Mesh(geo, inject(new THREE.MeshStandardMaterial({ map: canvasTex(480, 640, draw(k)), roughness: 0.85, side: THREE.DoubleSide }), U, { decl: "uniform float uTh, uBend, uY;",
      nrm: "float pd = position.x, pa = uTh + uBend * pow(pd / 3.0, 1.4); objectNormal = vec3(-sin(pa + uBend * .5), cos(pa + uBend * .5), 0.);",
      fcol: "if (!gl_FrontFacing) diffuseColor.rgb = vec3(.90, .85, .74);", pos: "float pm = uTh + uBend * .55 * pow(pd / 3.0, 1.4); transformed = vec3(pd * cos(pm), pd * sin(pm) + uY, -position.y);" })); m.frustumCulled = false; scene.add(m); pages.push({ m, U, k }); }
  const cover = new THREE.Mesh(new THREE.BoxGeometry(PW * 2 + 0.3, 0.1, PH + 0.3), matte(0x1d2a5c, { roughness: 0.6 })); cover.position.y = -0.08; cover.receiveShadow = true; cover.castShadow = true; scene.add(cover);
  const AZ = pchip([[0, -38], [2.6, -18], [4.8, 0], [6, 2]]), EL = pchip([[0, 14], [2.6, 34], [4.8, 62], [6, 66]]), DK = pchip([[0, 7.5], [2.6, 10.5], [4.8, 11.6], [6, 11.2]]), TX = pchip([[0, 0.4], [3, 0.6], [4.8, 1.5], [6, 1.5]]);
  return { n: 22, title: "Page qui tourne", style: "Collage et écriture manuscrite", font: "Caveat Bold", cam: "au ras des pages, puis grue jusqu'à la plongée", geste: "26 pages se courbent et tournent ; l'image avance de page en page", scene, camera, light: true, accent: "#e2351b", bloom: [0.05, 0.4, 1.4], vig: 0.3, tone: "neutral",
    render(t) {
      for (const p of pages) { const last = p.k === NPG - 1, u = last ? 0 : clamp((t - 0.45 - p.k * 0.158) / 0.62), e = eio(u); p.U.uTh.value = Math.PI * e; p.U.uBend.value = -1.25 * Math.sin(Math.PI * u) * (1 - 0.3 * u); p.U.uY.value = 0.004 * (e > 0.5 ? p.k : NPG - p.k) + 0.03 * Math.sin(Math.PI * u); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: DK(t), target: [TX(t), 0.1, 0.25 * ss(4, 6, t)] });
    } };
}
