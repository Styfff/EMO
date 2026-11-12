// 63 · Casse au billard — club : la blanche casse le triangle ; les 7 boules roulent (vraie rotation de roulement) et s'alignent, lettre vers le haut
import { THREE, drawText, measure, canvasTex, paint, matte, pchip, makeCam, fitDist, orbit, clamp, eo, mulberry , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(32); scene.environment = K.env; scene.environmentIntensity = 0.6; scene.background = new THREE.Color(0x0a0806);
  scene.add(new THREE.HemisphereLight(0xfff1d8, 0x0a0806, 0.5)); const lamp = new THREE.SpotLight(0xfff0d0, 260, 30, 0.75, 0.6, 1.4); lamp.position.set(0, 7, 0); lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); scene.add(lamp, lamp.target);
  const r = mulberry(63), felt = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#0f6a3c"; g.fillRect(0, 0, w, h); for (let i = 0; i < 20000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "0,30,10" : "60,140,90"},${r() * 0.12})`; g.fillRect(r() * w, r() * h, 1, 1); } }); felt.wrapS = felt.wrapT = THREE.RepeatWrapping; felt.repeat.set(6, 6);
  const TW = 10, TD = 6, table = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), new THREE.MeshStandardMaterial({ map: felt, roughness: 0.95 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  const wood = paint(0x4a2412, { roughness: 0.4 }); for (const [x, z, w, d] of [[0, -TD / 2 - 0.25, TW + 1, 0.5], [0, TD / 2 + 0.25, TW + 1, 0.5], [-TW / 2 - 0.25, 0, 0.5, TD], [TW / 2 + 0.25, 0, 0.5, TD]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.32, d), wood); m.position.set(x, 0.12, z); m.castShadow = true; scene.add(m); }
  const R = 0.36, TXT = mot(63, "BILLARD").padEnd(7).slice(0, 7), COL = [0xf2c200, 0x1f3fb8, 0xd21f2a, 0x5a2a9a, 0xf07a1a, 0x1b7a3a, 0x7a1414], sg = new THREE.SphereGeometry(R, 48, 32), capT = 0.78, B = [];
  [...TXT].forEach((ch, i) => { const g = new THREE.Group(), ball = new THREE.Mesh(sg, paint(COL[i % COL.length], { roughness: 0.12, clearcoat: 1 })); ball.castShadow = true; g.add(ball);
    const cg = new THREE.SphereGeometry(R * 1.004, 40, 12, 0, Math.PI * 2, 0, capT), p = cg.attributes.position, uv = cg.attributes.uv, rs = R * Math.sin(capT) * 1.004; for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / (2 * rs) + 0.5, 0.5 - p.getZ(k) / (2 * rs));
    const tx = canvasTex(256, 256, (c, w, h) => { c.fillStyle = "#f7f2e6"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.4, 0, 7); c.fill(); const cap = Math.min(120, 140 / measure(ch, "din", 1, 0)); drawText(c, ch, { font: "din", cap, x: w / 2, y: h / 2 + cap / 2, fill: "#141414" }); c.globalCompositeOperation = "destination-over"; c.fillStyle = "#" + new THREE.Color(COL[i]).getHexString(); c.fillRect(0, 0, w, h); });
    g.add(new THREE.Mesh(cg, new THREE.MeshPhysicalMaterial({ map: tx, roughness: 0.12, clearcoat: 1 }))); scene.add(g);
    const row = [0, 1, 1, 2, 2, 2, 3][i], col = [0, -0.5, 0.5, -1, 0, 1, 0][i] + (i === 6 ? 0 : 0), p0 = new THREE.Vector3(1.6 + row * R * 1.75, R, col * R * 2.02 + (i === 6 ? 0 : 0)); if (i === 6) p0.set(1.6 + 3 * R * 1.75, R, R * 3.03);
    const end = new THREE.Vector3((i - 3) * R * 2.35, R, 0.9), mid = new THREE.Vector3(p0.x + 2.5 + r() * 2, R, (r() - 0.5) * 4.5);
    B.push({ g, p0, mid, end, q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)), d: 0.03 * i }); });
  const cue = new THREE.Mesh(sg, paint(0xf7f2e6, { roughness: 0.1, clearcoat: 1 })); cue.castShadow = true; scene.add(cue);
  const bez = (a, m, b, u) => new THREE.Vector3().copy(a).multiplyScalar((1 - u) * (1 - u)).addScaledVector(m, 2 * u * (1 - u)).addScaledVector(b, u * u), TH = 0.9, ax = new THREE.Vector3(), q = new THREE.Quaternion(), I = new THREE.Quaternion();
  const D0 = fitDist(TXT.length * R * 2.35, 32, 0.8), AZ = pchip([[0, 70], [1.6, 50], [4.4, 0], [6, 0]]), EL = pchip([[0, 22], [1.6, 30], [4.6, 82], [6, 86]]), DK = pchip([[0, 2.1], [1.6, 1.8], [4.6, 1.02], [6, 0.97]]), TX = pchip([[0, 0.6], [1.6, 1.2], [4.6, 0], [6, 0]]);
  return { n: 63, title: "Casse au billard", style: "Club de billard (feutre et laque)", font: "Barlow Condensed Bold", cam: "trois quarts sur la casse, puis plongée totale", geste: "la blanche casse le triangle ; les boules roulent et s'alignent, lettre en haut", scene, camera, accent: "#f2c200", bloom: [0.15, 0.45, 1.2],
    render(t) {
      const uc = clamp(t / TH); cue.position.set(-4 + (1.6 - 2 * R - -4) * uc * uc, R, 0.02); if (t > TH) cue.position.set(1.6 - 2 * R - 0.8 * eo(clamp((t - TH) / 1.2)), R, -0.6 * eo(clamp((t - TH) / 1.2)));
      for (const b of B) { const u = eo(clamp((t - TH - b.d) / 3.4)), pos = bez(b.p0, b.mid, b.end, u), du = 0.002, nx = bez(b.p0, b.mid, b.end, Math.min(1, u + du)); b.g.position.copy(pos);
        const dist = (u * (b.p0.distanceTo(b.mid) + b.mid.distanceTo(b.end))) * 0.8, dir = nx.sub(pos); ax.set(dir.z, 0, -dir.x); if (ax.lengthSq() < 1e-10) ax.set(1, 0, 0); ax.normalize();
        q.setFromAxisAngle(ax, dist / R).multiply(b.q0); const fin = clamp((u - 0.82) / 0.18); b.g.quaternion.slerpQuaternions(q, I, fin * fin * (3 - 2 * fin)); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [TX(t), 0.1, 0.6] });
    } };
}
