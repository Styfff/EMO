// 17 · Rouleaux à lettres — machine à sous rétro : sept rouleaux flous qui s'arrêtent un par un, puis 2 400 pièces jaillissent
import { THREE, drawText, canvasTex, gpuInst, paint, chrome, rig, pchip, makeCam, fitDist, orbit, backOut, clamp, ss, mulberry, bgRadial, rnd , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.75; scene.background = bgRadial("#7a0f1e", "#3a0710", "#120205");
  rig(scene, { key: 2.4, pos: [-3, 7, 9], amb: 0.5, size: 7, color: 0xfff0d0 });
  const WORD = mot(17, "JACKPOT").replace(/ /g, ""), NS = 12, RR = 1.15, RW = 0.84, GAP = 0.9, ALPH = "AEKMNRSUVXZ7", r = mulberry(23), reels = [];
  for (let i = 0; i < WORD.length; i++) {
    const tx = canvasTex(NS * 200, 256, (g, w, h) => { g.fillStyle = "#fff6dc"; g.fillRect(0, 0, w, h); for (let k = 0; k < NS; k++) { const ch = k === 0 ? WORD[i] : ALPH[(k * 5 + i * 3) % ALPH.length]; g.save(); g.translate(k * 200 + (k === 0 ? 0 : 0), h / 2); g.rotate(Math.PI / 2);
        for (const off of k === 0 ? [0, NS * 200] : [0]) { g.save(); g.translate(0, -off); drawText(g, ch, { font: "typew", cap: 150, x: 0, y: 75, fill: k === 0 ? "#c8102e" : "#1a1a1a" }); g.restore(); } g.restore(); g.fillStyle = "#d8c9a0"; g.fillRect(k * 200 + 98, 0, 4, h); } });
    tx.wrapS = THREE.RepeatWrapping; const geo = new THREE.CylinderGeometry(RR, RR, RW, 96, 1, true); geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tx, roughness: 0.42 })); m.position.x = (i - (WORD.length - 1) / 2) * GAP; scene.add(m); reels.push({ m, d: 1.5 + i * 0.44, turns: 7 + i * 2 + Math.floor(r() * 3) });
  }
  const gold = new THREE.MeshStandardMaterial({ color: 0xf2bf3d, metalness: 1, roughness: 0.25 }), red = paint(0xb00d24, { roughness: 0.3 }), W7 = WORD.length * GAP + 0.3, box = (w, h, d, x, y, z, mt) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mt); b.position.set(x, y, z); scene.add(b); return b; };
  box(W7 + 1.0, 1.4, 2.6, 0, 1.2, 0, red); box(W7 + 1.0, 1.4, 2.6, 0, -1.2, 0, red); box(0.5, 3.8, 2.6, -W7 / 2 - 0.25, 0, 0, red); box(0.5, 3.8, 2.6, W7 / 2 + 0.25, 0, 0, red);
  box(W7 + 0.1, 0.06, 0.1, 0, 0.5, 1.3, gold); box(W7 + 0.1, 0.06, 0.1, 0, -0.5, 1.3, gold); for (let i = 0; i <= WORD.length; i++) box(0.05, 1.04, 0.1, (i - WORD.length / 2) * GAP, 0, 1.3, gold);
  const bulbs = []; for (let i = 0; i < 44; i++) { const u = i / 44, per = 2 * (W7 + 0.6) + 2 * 3.4; let d = u * per, x, y; if (d < W7 + 0.6) { x = -W7 / 2 - 0.3 + d; y = 1.7; } else if ((d -= W7 + 0.6) < 3.4) { x = W7 / 2 + 0.3; y = 1.7 - d; } else if ((d -= 3.4) < W7 + 0.6) { x = W7 / 2 + 0.3 - d; y = -1.7; } else { d -= W7 + 0.6; x = -W7 / 2 - 0.3; y = -1.7 + d; }
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff })); b.position.set(x, y, 1.33); scene.add(b); bulbs.push(b); }
  const NC = 2400, TJ = 4.75, aV = new Float32Array(NC * 3), aR = rnd(NC * 4, 1, 14); for (let i = 0; i < NC; i++) { const a = r() * 6.283, sp = 2 + r() * 7; aV.set([Math.cos(a) * sp * 0.7, 3 + r() * 4.8, 0.6 + r() * 3.2], i * 3); }
  const U = { uT: { value: 0 } }, cg = new THREE.CylinderGeometry(0.085, 0.085, 0.016, 18);
  scene.add(gpuInst(cg, gold, NC, { aV: [3, aV], aR: [4, aR] }, U, { decl: "attribute vec3 aV; attribute vec4 aR; uniform float uT; mat3 cR; float cT;",
    nrm: `cT = max(0., uT - ${TJ} - aR.x * .5); cR = rotAx(normalize(aR.yzw - .5), cT * (6. + 14. * aR.x)); objectNormal = cR * objectNormal;`,
    pos: "transformed = cR * transformed * step(.0001, cT) + vec3((aR.y - .5) * 5.8, -1.75, 1.5) + aV * cT + vec3(0., -9.5, 0.) * cT * cT;" }));
  const D0 = fitDist(W7 + 1.3, 30, 0.94), AZ = pchip([[0, -34], [3, -12], [4.8, 0], [6, 4]]), EL = pchip([[0, 9], [4.8, 2], [6, 0]]), DK = pchip([[0, 0.8], [3, 0.9], [4.8, 1], [6, 1.08]]);
  return { n: 17, title: "Rouleaux à lettres", style: "Rétro (machine à sous)", font: "Courier Prime Bold", cam: "trois quarts qui pousse, secousse au jackpot", geste: "sept rouleaux s'arrêtent un par un ; 2 400 pièces", scene, camera, accent: "#f2bf3d", bloom: [0.4, 0.6, 0.95],
    render(t) {
      U.uT.value = t; for (const q of reels) { const u = clamp((t - 0.35) / q.d); q.m.rotation.x = q.turns * 2 * Math.PI * (backOut(u, 0.55) - 1); }
      const jp = t > TJ; bulbs.forEach((b, i) => { const on = jp ? Math.sin(t * 26 + i * Math.PI) > 0 : (Math.floor(t * 9) + i) % 4 === 0; b.material.color.setRGB(on ? 3.2 : 0.35, on ? 2.4 : 0.22, on ? 0.9 : 0.08); });
      const sh = jp ? Math.exp(-(t - TJ) / 0.25) * Math.sin((t - TJ) * 60) * 0.05 : 0;
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, sh + 0.25 * ss(TJ, 6, t), 0] });
    } };
}
