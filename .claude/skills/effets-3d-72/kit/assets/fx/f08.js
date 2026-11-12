// 8 · Extrusion qui pousse — minimalisme : rien de face, puis les lettres partent comme des pistons sur 8 unités ; retour dans l'axe = typo extrudée en perspective
import { THREE, word, matte, rig, pchip, makeCam, fitDist, cast, orbit, backOut, lerp, ss , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(40), WALL = 0xeeebe4; scene.environment = K.env; scene.environmentIntensity = 0.3; scene.background = new THREE.Color(WALL);
  const Lg = rig(scene, { key: 3.2, pos: [-12, 5, 8], amb: 0.78, size: 17, soft: 3, map: 4096 }); Lg.key.target.position.set(0, 0, 4); Lg.key.shadow.camera.far = 90;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), matte(WALL, { roughness: 0.95 })); wall.receiveShadow = true; scene.add(wall);
  const w = word(mot(8, "ÉMERGE"), { font: "gill", cap: 1, depth: 1, bevel: 0, back: true, curve: 16 }), capM = matte(WALL, { roughness: 0.9 }), sideM = matte(0x0f2fd0, { roughness: 0.55 }), DEP = [8.6, 8.6, 8.6, 8.6, 8.6, 8.6], L = [];
  for (const l of w.letters) { const m = cast(new THREE.Mesh(l.geo, [capM, sideM])); m.position.set(l.x, 0, 0); scene.add(m); L.push(m); }
  const cW = new THREE.Color(WALL), cO = new THREE.Color(0xff4a1c), D0 = fitDist(w.width, 40, 0.8), dep = (i, t) => lerp(0.002, 1, backOut((t - 0.7 - i * 0.13) / 1.2, 1.1)) + (DEP[i % DEP.length] - 1) * backOut((t - 2.5 - i * 0.14) / 0.75, 0.55);
  const AZ = pchip([[0, 0], [0.8, 0], [2.3, 58], [3.6, 24], [4.6, 10], [6, 5]]), EL = pchip([[0, 0], [0.8, 0], [2.3, 10], [4.6, 6], [6, 4]]), DK = pchip([[0, 1.2], [2.3, 1.3], [4.4, 1.14], [6, 1.06]]), LX = pchip([[0, -13], [6, -5]]), LY = pchip([[0, 4], [6, 9]]), LZ = pchip([[0, 5], [6, 15]]);
  return { n: 8, title: "Extrusion qui pousse", style: "Minimalisme", font: "Rubik Black", cam: "de face (rien ne se voit), arc de 58°, puis retour dans l'axe", geste: "les lettres sortent du mur, puis partent comme des pistons", scene, camera, light: true, accent: "#0f2fd0", bloom: [0.05, 0.4, 1.4], vig: 0.14, tone: "neutral",
    render(t) {
      let dm = 0; L.forEach((m, i) => { const d = dep(i, t); m.scale.z = d; dm += d / 6; }); capM.color.lerpColors(cW, cO, ss(2.5, 3.3, t));
      Lg.key.position.set(LX(t), LY(t), LZ(t)); const a = AZ(t);
      orbit(camera, { az: a, el: EL(t), dist: D0 * DK(t), target: [0.2 * (a / 58), 0.05, dm * 0.93] });
    } };
}
