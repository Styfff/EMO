// 12 · Mur de tuiles — pixel art : 2 000 tuiles se soulèvent et se retournent en onde, le couchant devient la nuit
import { THREE, drawText, matte, rig, pchip, makeCam, fitDist, orbit, eio, clamp, mulberry, bgRadial , mots } from "../kit.js";
const W2 = mots(12, ["JOUR", "NUIT"]).map((w) => w.slice(0, 5));
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 0.3; scene.background = bgRadial("#2b2440", "#15121f", "#08070c");
  rig(scene, { key: 2.6, pos: [-5, 6, 9], amb: 0.7, size: 6, map: 4096, soft: 3 });
  const NX = 40, NY = 50, S = 0.15, TD = 0.05, N = NX * NY, r = mulberry(17);
  const PA = ["#ffcd75", "#ef7d57", "#b13e53", "#1a1c2c"], PB = ["#1a1c2c", "#3b5dc9", "#41a6f6", "#f4f4f4"], BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const txt = (s) => { const c = document.createElement("canvas"); c.width = NX; c.height = NY; const g = c.getContext("2d"); drawText(g, s, { font: "menlo", cap: 9, x: NX / 2, y: 23, fill: "#fff", track: 0.12 }); const d = g.getImageData(0, 0, NX, NY).data; return (x, y) => d[(y * NX + x) * 4 + 3] > 110; };
  const tA = txt(W2[0]), tB = txt(W2[1]), dith = (v, x, y) => Math.floor(v + BAY[(y % 4) * 4 + (x % 4)] / 16), stars = new Set(); for (let i = 0; i < 46; i++) stars.add(((r() * 36) | 0) * NX + ((r() * NX) | 0));
  const imgA = (x, y) => { if (tA(x, y)) return 0; if (Math.hypot(x - 19.5, y - 35) < 7.2 && y < 39) return 0; if (y >= 39) { const refl = Math.abs(x - 19.5) < 8 - (y - 39) * 0.5 && (y % 2 === 0); return refl ? (y % 4 === 0 ? 0 : 1) : 3; } return clamp(3 - dith((y / 39) * 2.4, x, y), 1, 2 + (y < 8 ? 1 : 0)); };
  const imgB = (x, y) => { if (tB(x, y)) return 3; const dm = Math.hypot(x - 27, y - 32), dc = Math.hypot(x - 24.5, y - 30.5); if (dm < 5.5 && dc > 4.8) return 3; if (y >= 39) return Math.abs(x - 27) < 5 - (y - 39) * 0.4 && y % 2 === 0 ? 2 : (y % 3 === 0 && (x + y) % 5 < 2 ? 1 : 0); if (stars.has(y * NX + x)) return 3; return dith((y / 39) * 1.2, x, y) > 0 ? 1 : 0; };
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(S * 0.96, S * 0.96, TD), matte(0x0e0d14, { roughness: 0.6 }), N), mkF = () => new THREE.InstancedMesh(new THREE.PlaneGeometry(S * 0.96, S * 0.96), new THREE.MeshStandardMaterial({ roughness: 0.55, emissive: 0xffffff, emissiveIntensity: 0 }), N), front = mkF(), back = mkF();
  body.castShadow = true; body.receiveShadow = true; front.receiveShadow = true; back.receiveShadow = true; for (const m of [body, front, back]) { m.frustumCulled = false; scene.add(m); }
  const T = [], col = new THREE.Color(), OX = -1.6, OY = 2.2;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i, x = (i - (NX - 1) / 2) * S, y = ((NY - 1) / 2 - j) * S; T.push({ x, y, d: Math.hypot(x - OX, y - OY) * 0.3 + r() * 0.06, ax: r() < 0.5, h: 0.3 + r() * 0.6 }); front.setColorAt(k, col.set(PA[imgA(i, j)])); back.setColorAt(k, col.set(PB[imgB(i, j)])); }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(NX * S + 0.5, NY * S + 0.5), matte(0x08070c)); wall.position.z = -TD; wall.receiveShadow = true; scene.add(wall);
  const o = new THREE.Object3D(), M = new THREE.Matrix4(), TF = new THREE.Matrix4().makeTranslation(0, 0, TD / 2 + 0.002), TB = new THREE.Matrix4().makeRotationY(Math.PI).premultiply(new THREE.Matrix4().makeTranslation(0, 0, -TD / 2 - 0.002));
  const D0 = fitDist(NX * S + 0.3, 30, 0.9);
  const AZ = pchip([[0, -56], [2.4, -34], [4.6, 0], [6, 6]]), EL = pchip([[0, 18], [2.4, 10], [4.6, 0], [6, 0]]), DK = pchip([[0, 0.34], [2.4, 0.5], [4.7, 1], [6, 0.97]]), TX = pchip([[0, -1.5], [2.4, 0.3], [4.6, 0], [6, 0]]), TY = pchip([[0, 2.0], [2.4, 0.2], [4.6, -0.35], [6, -0.35]]);
  return { n: 12, title: "Mur de tuiles (raccord A → B)", style: "Pixel art", font: "JetBrains Mono ExtraBold", cam: "rasante sur le front de l'onde, puis recul de face", geste: "2 000 tuiles se soulèvent et se retournent : A devient B", scene, camera, accent: "#ef7d57", bloom: [0.15, 0.5, 1.1], tone: "neutral",
    render(t) {
      for (let k = 0; k < N; k++) { const q = T[k], u = clamp((t - 0.7 - q.d) / 0.95), e = eio(u), a = Math.PI * e, lift = Math.sin(Math.PI * u) * q.h;
        o.position.set(q.x, q.y, lift); o.rotation.set(q.ax ? a : 0, q.ax ? 0 : a, 0); o.updateMatrix(); body.setMatrixAt(k, o.matrix); front.setMatrixAt(k, M.multiplyMatrices(o.matrix, TF)); back.setMatrixAt(k, M.multiplyMatrices(o.matrix, TB)); }
      body.instanceMatrix.needsUpdate = front.instanceMatrix.needsUpdate = back.instanceMatrix.needsUpdate = true;
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [TX(t), TY(t), 0] });
    } };
}
