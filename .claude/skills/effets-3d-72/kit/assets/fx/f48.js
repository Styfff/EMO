// 48 · Cube N × N × N — jouet : N = nombre de lettres ; le cube 4 × 4 × 4 se résout en 13 mouvements et sa face avant écrit CUBE
import { THREE, drawText, measure, canvasTex, paint, rig, pchip, makeCam, orbit, eio, clamp, mulberry, bgLinear , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.6; scene.background = bgLinear([[0, "#ffe9b0"], [1, "#f5b979"]]);
  rig(scene, { key: 2.6, pos: [-4, 8, 7], amb: 0.85, size: 6, soft: 5, ground: 0xf5b979 });
  const TXT = mot(48, "CUBE").replace(/ /g, "").slice(0, 6), N = TXT.length, H = (N - 1) / 2, r = mulberry(48), FACE = { px: 0x1b998b, nx: 0x2e4ba8, py: 0xff5c3a, ny: 0xf7f2e6, nz: 0x8a4fff }, FRONT = "#ffd23f";
  const front = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = FRONT; g.fillRect(0, 0, w, h); const cw = w / N; [...TXT].forEach((ch, i) => { const cap = Math.min(cw * 1.25 * 0.82, (cw * 0.8) / measure(ch, "din", 1, 0)); drawText(g, ch, { font: "din", cap, x: (i + 0.5) * cw, y: h / 2 + cap / 2, fill: "#141414" }); }); });
  const body = paint(0x141414, { roughness: 0.4 }), stG = new THREE.PlaneGeometry(0.86, 0.86), cub = [], faces = [["px", [1, 0, 0]], ["nx", [-1, 0, 0]], ["py", [0, 1, 0]], ["ny", [0, -1, 0]], ["pz", [0, 0, 1]], ["nz", [0, 0, -1]]];
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) { const p = new THREE.Vector3(x - H, y - H, z - H); if (Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)) < H - 0.1) continue;
    const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.98, 0.98), body));
    for (const [nm, n] of faces) { const v = new THREE.Vector3(...n); if (Math.abs(p.dot(v) - H) > 0.1) continue; let m; if (nm === "pz") { const sg = stG.clone(), uv = sg.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, (x + uv.getX(k) * 0.86 + 0.07) / N, (y + uv.getY(k) * 0.86 + 0.07) / N); m = new THREE.Mesh(sg, new THREE.MeshPhysicalMaterial({ map: front, roughness: 0.25, clearcoat: 1 })); } else m = new THREE.Mesh(stG, paint(FACE[nm], { roughness: 0.25 }));
      m.position.copy(v).multiplyScalar(0.495); m.lookAt(v.clone().multiplyScalar(2)); g.add(m); }
    scene.add(g); cub.push({ g, p0: p }); }
  const AX = ["x", "y", "z"], moves = []; for (let i = 0; i < 9 + N; i++) { let mv; do { mv = { ax: AX[(r() * 3) | 0], L: Math.floor(r() * N) - H, d: r() < 0.5 ? 1 : -1 }; } while (moves.length && moves[moves.length - 1].ax === mv.ax && moves[moves.length - 1].L === mv.L); moves.push(mv); }
  const sol = moves.slice().reverse().map((m) => ({ ...m, d: -m.d })), VEC = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }, q = new THREE.Quaternion();
  const apply = (st, mv, ang) => { q.setFromAxisAngle(VEC[mv.ax], ang * mv.d); for (const s of st) if (Math.abs(s.p[mv.ax] - mv.L) < 0.1) { s.p.applyQuaternion(q); s.q.premultiply(q); } };
  const T0 = 0.5, MD = 0.27;
  const AZ = pchip([[0, 38], [2.4, 26], [4.4, 3], [6, 0]]), EL = pchip([[0, 30], [2.4, 24], [4.6, 4], [6, 2]]), DS = pchip([[0, 3.9 * N], [3, 3.5 * N], [6, 3.15 * N]]);
  return { n: 48, title: "Cube N × N × N", style: "Jouet (couleurs vives)", font: "Barlow Condensed Bold", cam: "trois quarts, puis de face", geste: "N = 4 lettres : le cube 4 × 4 × 4 se résout et sa face avant écrit le mot", scene, camera, light: true, accent: "#ff5c3a", bloom: [0.08, 0.4, 1.3], vig: 0.18, tone: "neutral",
    render(t) {
      const st = cub.map((c) => ({ c, p: c.p0.clone(), q: new THREE.Quaternion() })); for (const mv of moves) apply(st, mv, Math.PI / 2);
      const u = (t - T0) / MD; for (let i = 0; i < sol.length; i++) { const f = clamp(u - i); if (f <= 0) break; apply(st, sol[i], (Math.PI / 2) * eio(f)); }
      for (const s of st) { s.p.x = Math.round(s.p.x * 2) / 2 + (s.p.x - Math.round(s.p.x * 2) / 2); s.c.g.position.copy(s.p); s.c.g.quaternion.copy(s.q); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: DS(t), target: [0, 0, 0] });
    } };
}
