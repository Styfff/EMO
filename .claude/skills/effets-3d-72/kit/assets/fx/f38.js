// 38 · Rebonds qui posent les lettres — Memphis : une balle rebondit ; chaque lettre jaillit du sol juste avant qu'elle s'y pose, confettis à l'impact
import { THREE, word, paint, matte, rig, gpuInst, pchip, makeCam, fitDist, orbit, clamp, backOut, mulberry, cast, bg , mot , at } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.45;
  const r = mulberry(38); scene.background = bg((g, w, h) => { g.fillStyle = "#ffd7e2"; g.fillRect(0, 0, w, h); const C = ["#111", "#18b7a6", "#ffd23f", "#ff5c8d"];
    for (let i = 0; i < 46; i++) { const x = r() * w, y = r() * h * 0.62, k = i % 4; g.save(); g.translate(x, y); g.rotate(r() * 6); g.fillStyle = g.strokeStyle = C[k]; g.lineWidth = 5; if (k === 0) { g.beginPath(); for (let s = 0; s < 5; s++) g.lineTo(s * 14, s % 2 ? 12 : 0); g.stroke(); } else if (k === 1) { g.beginPath(); g.moveTo(0, -16); g.lineTo(16, 12); g.lineTo(-16, 12); g.closePath(); g.fill(); } else if (k === 2) { g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill(); } else g.fillRect(-18, -4, 36, 8); g.restore(); } }, 864, 1080);
  rig(scene, { key: 2.6, pos: [-4, 9, 7], amb: 1.0, size: 9, soft: 6, ground: 0xffb3c6 }); const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), matte(0xff9db5, { roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const TXT = mot(38, "SAUTER"), CAP = 1.25, w = word(TXT, { font: "avenir", cap: CAP, depth: 0.5, bevel: 0.04, pivot: "base" }), COL = [0x18b7a6, 0xffd23f, 0x161616, 0xff5c8d, 0x18b7a6, 0xffd23f], HOP = 0.56, T1 = 0.9, RB = 0.24, L = [];
  for (const l of w.letters) { const m = cast(new THREE.Mesh(l.geo, paint(COL[l.i % COL.length], { roughness: 0.3 }))); m.position.x = l.x; scene.add(m); L.push({ m, x: l.x, ti: T1 + l.i * HOP }); }
  const ball = cast(new THREE.Mesh(new THREE.SphereGeometry(RB, 32, 20), paint(0xff2d3f, { roughness: 0.2 }))); scene.add(ball);
  const XS = [at(L, 0).x - 2.6, ...L.map((q) => q.x), L[L.length - 1].x + 2.2, L[L.length - 1].x + 3.6], TS = [T1 - HOP, ...L.map((q) => q.ti), T1 + L.length * HOP, T1 + (L.length + 0.7) * HOP], YS = [CAP + RB + 0.9, ...L.map(() => CAP + RB), RB, RB];
  const NCF = 1800, aC = new Float32Array(NCF * 4), aV = new Float32Array(NCF * 3), U = { uT: { value: 0 } }, col = new THREE.Color(), PALC = [0x18b7a6, 0xffd23f, 0x161616, 0xff5c8d, 0xffffff];
  const cf = gpuInst(new THREE.BoxGeometry(0.07, 0.07, 0.008), new THREE.MeshStandardMaterial({ roughness: 0.6 }), NCF, { aC: [4, aC], aV: [3, aV] }, U, { decl: "attribute vec4 aC; attribute vec3 aV; uniform float uT; mat3 cfR; float cfT;",
    nrm: "cfT = max(0., uT - aC.w); cfR = rotAx(normalize(aV + .01), cfT * 9.); objectNormal = cfR * objectNormal;", pos: "transformed = cfR * transformed * step(.0001, cfT) * (1. - sst(.9, 1.4, cfT)) + aC.xyz + aV * cfT + vec3(0., -7., 0.) * cfT * cfT;" });
  for (let i = 0; i < NCF; i++) { const q = L[i % L.length], a = r() * 6.283, sp = 0.8 + r() * 2.6; aC.set([q.x + (r() - 0.5) * 0.4, CAP + 0.05, (r() - 0.5) * 0.3, q.ti], i * 4); aV.set([Math.cos(a) * sp, 1.6 + r() * 3.2, Math.sin(a) * sp * 0.7], i * 3); cf.setColorAt(i, col.setHex(PALC[i % 5])); } scene.add(cf);
  const D0 = fitDist(w.width, 30, 0.84), TX = pchip([[0, at(L, 0).x - 0.8], [T1, at(L, 0).x], [T1 + 2 * HOP, at(L, 2).x], [T1 + 4 * HOP, at(L, 4).x - 0.4], [T1 + 6 * HOP, 0.6], [6, 0]]), DK = pchip([[0, 0.62], [T1 + 3 * HOP, 0.72], [T1 + 6.2 * HOP, 1], [6, 0.97]]), AZ = pchip([[0, -16], [6, 6]]);
  return { n: 38, title: "Rebonds qui posent les lettres", style: "Memphis (années 80)", font: "Montserrat ExtraBold", cam: "suit la balle, puis recule sur le mot", geste: "chaque lettre jaillit du sol juste avant que la balle s'y pose", scene, camera, light: true, accent: "#e0245e", bloom: [0.08, 0.4, 1.3], vig: 0.14, tone: "neutral",
    render(t) {
      U.uT.value = t; let k = 0; while (k < TS.length - 2 && t > TS[k + 1]) k++; const u = clamp((t - TS[k]) / (TS[k + 1] - TS[k])), roll = k >= TS.length - 2;
      const x = XS[k] + (XS[k + 1] - XS[k]) * u, base = YS[k] + (YS[k + 1] - YS[k]) * u, y = t < TS[0] ? YS[0] : roll ? RB : base + (k === TS.length - 3 ? 1.2 : 1.35) * 4 * u * (1 - u), near = Math.min(u * (TS[k + 1] - TS[k]), (1 - u) * (TS[k + 1] - TS[k])), sq = roll || t < TS[0] ? 1 : 1 - 0.3 * Math.exp(-near / 0.035);
      ball.position.set(x, y - RB * (1 - sq), 0.02); ball.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      for (const q of L) { const up = backOut(clamp((t - q.ti + 0.3) / 0.3), 1.6), hit = t > q.ti ? 1 - 0.16 * Math.exp(-(t - q.ti) / 0.07) * Math.cos((t - q.ti) * 30) : 1; q.m.scale.set(1, Math.max(0.001, up) * hit, 1); q.m.visible = up > 0.002; }
      orbit(camera, { az: AZ(t), el: 6, dist: D0 * DK(t), target: [TX(t), 0.95, 0] });
    } };
}
