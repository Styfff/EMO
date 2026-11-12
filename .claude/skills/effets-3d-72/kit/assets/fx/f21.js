// 21 · Impression couche par couche — plan technique : atelier quadrillé, cotes, compteur de couches ; la buse dépose 56 couches en accéléré
import { THREE, scanRuns, drawText, canvasTex, matte, chrome, rig, pchip, makeCam, fitDist, orbit, clamp, ss, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30), BLUE = 0x0b3f9c; scene.environment = K.env; scene.environmentIntensity = 0.5; scene.background = bgLinear([[0, "#06225e"], [0.6, "#0b3f9c"], [1, "#0a3484"]]); scene.fog = new THREE.Fog(0x08307c, 16, 46);
  rig(scene, { key: 2.4, pos: [-5, 8, 7], amb: 0.7, size: 7, sky: 0xcfe0ff, ground: 0x0b2a6a });
  const grid = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#0b3f9c"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,0.20)"; g.lineWidth = 1.5; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }); grid.wrapS = grid.wrapT = THREE.RepeatWrapping; grid.repeat.set(30, 30);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ map: grid, roughness: 0.6, metalness: 0.2 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -1.6; floor.receiveShadow = true; scene.add(floor);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshBasicMaterial({ map: grid })); back.position.set(0, 20, -14); scene.add(back);
  const ROWS = 22, R = scanRuns(mot(21, "COUCHE"), { font: "optima", width: 6.1, rows: ROWS, res: 2200 }), DEPTH = 0.7, N = R.runs.length, XMIN = -3.3, XMAX = 3.3, Y0 = 0.06, HT = R.height;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25 }), N), hot = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 0.7, 0.16) }), 64);
  { const c = new THREE.Color(), a = new THREE.Color(0xff5a12), b = new THREE.Color(0xffb02e); R.runs.forEach((q, i) => body.setColorAt(i, c.lerpColors(a, b, q.r / (ROWS - 1)))); }
  body.castShadow = true; body.receiveShadow = true; body.frustumCulled = false; hot.frustumCulled = false; scene.add(body, hot);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.12, 3.2), new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.4, map: canvasTex(1024, 400, (g, w, h) => { g.fillStyle = "#e9eef6"; g.fillRect(0, 0, w, h); g.strokeStyle = "#9db4d6"; g.lineWidth = 2; for (let i = 0; i <= w; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let i = 0; i <= h; i += 32) { g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }) })); bed.receiveShadow = true; bed.castShadow = true; scene.add(bed);
  const dark = matte(0x12203f, { roughness: 0.5, metalness: 0.5 }), steel = chrome({ roughness: 0.25 }), base = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.5, 3.8), dark); base.position.y = -0.82; base.castShadow = true; base.receiveShadow = true; scene.add(base);
  const gantry = new THREE.Group(), head = new THREE.Group(); scene.add(gantry); gantry.add(new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.16, 0.16), steel));
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 9, 0.2), dark); p.position.set(s * 4.7, 2.9, 0); scene.add(p); }
  const blk = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.46, 0.5), dark); blk.position.y = -0.15; const noz = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0xd8a03a, metalness: 1, roughness: 0.25 })); noz.rotation.x = Math.PI; noz.position.y = -0.53;
  const glow = new THREE.PointLight(0xff8a30, 0, 5); head.add(blk, noz); scene.add(glow); gantry.add(head);
  const spool = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.22, 16, 48), new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: 0.45 })); spool.position.set(-4.7, 7.0, -0.4); scene.add(spool);
  // cotes et compteur (dessin technique en volume)
  const white = new THREE.MeshBasicMaterial({ color: 0xffffff }), line = (w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), white); m.position.set(x, y, z); scene.add(m); return m; };
  line(6.1, 0.014, 0, -0.35, 1.75); line(0.014, 0.22, -3.05, -0.35, 1.75); line(0.014, 0.22, 3.05, -0.35, 1.75); const vdim = line(0.014, 1, 3.75, Y0 + 0.5, 0.36), vt1 = line(0.22, 0.014, 3.75, Y0, 0.36), vt2 = line(0.22, 0.014, 3.75, Y0 + 1, 0.36);
  const label = (txt, cap, x, y, z, wd) => { const tx = canvasTex(512, 96, (g, w, h) => { drawText(g, txt, { font: "menlo", cap: 46, x: w / 2, y: 70, fill: "#fff", track: 0.06 }); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, wd * 96 / 512), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); m.position.set(x, y, z); scene.add(m); return m; };
  label("LARGEUR 61 MM", 0, 0, -0.6, 1.75, 2.4);
  const pc = document.createElement("canvas"); pc.width = 640; pc.height = 256; const pg = pc.getContext("2d"), ptx = new THREE.CanvasTexture(pc); ptx.colorSpace = THREE.SRGBColorSpace; let shown = -1;
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.2), new THREE.MeshBasicMaterial({ map: ptx, transparent: true })); panel.position.set(-2.3, 3.3, -0.8); scene.add(panel);
  const drawPanel = (lay, done) => { pg.clearRect(0, 0, 640, 256); pg.strokeStyle = "#fff"; pg.lineWidth = 4; pg.strokeRect(4, 4, 632, 248); drawText(pg, mot(21, "COUCHE"), { font: "menlo", cap: 34, x: 34, y: 70, align: "left", fill: "#fff", track: 0.1 });
    drawText(pg, String(lay).padStart(2, "0") + " / " + ROWS, { font: "menlo", cap: 84, x: 34, y: 186, align: "left", fill: done ? "#ffb02e" : "#fff" }); pg.fillStyle = "rgba(255,255,255,0.25)"; pg.fillRect(34, 212, 572, 14); pg.fillStyle = "#ff8a3c"; pg.fillRect(34, 212, 572 * lay / ROWS, 14); ptx.needsUpdate = true; };
  const o = new THREE.Object3D(), TP = 4.7, D0 = fitDist(6.6, 30, 0.84);
  const AZ = pchip([[0, -52], [2.4, -28], [4.4, -8], [6, 2]]), EL = pchip([[0, 7], [2.4, 17], [4.6, 9], [6, 5]]), DK = pchip([[0, 0.42], [2.4, 0.8], [4.6, 1.02], [6, 0.97]]), TYc = pchip([[0, 0.25], [2.4, 0.9], [4.6, 1.2], [6, 1.15]]);
  return { n: 21, title: "Impression couche par couche", style: "Plan technique (bleu)", font: "Alegreya Sans Black", cam: "macro sur la buse, orbite basse, puis de face", geste: "22 couches déposées une à une ; cotes et compteur à jour", scene, camera, accent: "#ff8a3c", bloom: [0.3, 0.5, 1.05],
    render(t) {
      const P = ROWS * clamp((t - 0.35) / TP), lay = Math.min(ROWS - 1, Math.floor(P)), fr = P - lay, dir = lay % 2 === 0, done = P >= ROWS, nx = done ? XMAX : dir ? XMIN + (XMAX - XMIN) * fr : XMAX - (XMAX - XMIN) * fr; let h = 0;
      for (let i = 0; i < N; i++) { const q = R.runs[i]; let x0 = q.x0, x1 = q.x1, vis = q.r < lay || done;
        if (q.r === lay && !done) { if (dir) x1 = Math.min(x1, nx); else x0 = Math.max(x0, nx); vis = x1 - x0 > 0.004; }
        if (vis) { o.position.set((x0 + x1) / 2, Y0 + (q.r + 0.5) * R.rowH, 0); o.scale.set(x1 - x0, R.rowH * 0.93, DEPTH); } else { o.position.set(0, -50, 0); o.scale.setScalar(0.0001); }
        o.updateMatrix(); body.setMatrixAt(i, o.matrix); if (vis && q.r === lay && !done && h < 64) { o.scale.multiplyScalar(1.012); o.updateMatrix(); hot.setMatrixAt(h++, o.matrix); } }
      o.position.set(0, -50, 0); o.scale.setScalar(0.0001); o.updateMatrix(); for (; h < 64; h++) hot.setMatrixAt(h, o.matrix);
      body.instanceMatrix.needsUpdate = hot.instanceMatrix.needsUpdate = true;
      const hNow = (Math.min(P, ROWS)) * R.rowH, lift = ss(TP + 0.3, TP + 1.2, t) * 7; gantry.position.y = Y0 + hNow + 0.4 * R.rowH + 0.72 + lift; head.position.x = nx; glow.position.set(0, Y0 + hNow + 0.5, 0.9); glow.intensity = 9 * (1 - ss(TP + 0.3, TP + 0.9, t)); spool.rotation.z = -t * 5 * (done ? 0 : 1) - (done ? TP * 5 : 0);
      vdim.scale.y = Math.max(0.02, hNow); vdim.position.y = Y0 + hNow / 2; vt2.position.y = Y0 + hNow;
      const li = done ? ROWS : lay; if (li !== shown) { shown = li; drawPanel(li, done); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0.7 * (1 - ss(1.6, 4.2, t)) * (nx / 3.3), TYc(t), 0] });
    } };
}
