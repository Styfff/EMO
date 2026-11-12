// 51 · Remplissage — bar tiki : un filet de sirop tombe dans chaque lettre de verre, qui se remplit d'un liquide à vagues ; 20 000 bulles
import { THREE, word, maskPoints, gpuPoints, inject, pchip, makeCam, fitDist, orbit, clamp, eio, ss, rnd, bgRadial, matte , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.environment = K.env; scene.environmentIntensity = 1.0; scene.background = bgRadial("#3b1460", "#1e0a35", "#0a0414");
  scene.add(new THREE.HemisphereLight(0xffd0f0, 0x0a0410, 0.7)); const key = new THREE.DirectionalLight(0xfff0e0, 1.8); key.position.set(-4, 7, 7); scene.add(key);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshLambertMaterial({ color: 0x1a0828 })); bar.rotation.x = -Math.PI / 2; scene.add(bar);
  const CAP = 1.6, w = word(mot(51, "SIROP"), { font: "gill", cap: CAP, depth: 0.55, bevel: 0.03, pivot: "base", curve: 14 }), T0 = 0.5, DT = 0.48, FD = 2.3, L = [];
  for (const l of w.letters) {
    const lv = { value: -1 }, Ul = { uLv: lv, uT: { value: 0 } };
    const liq = new THREE.Mesh(l.geo, inject(new THREE.MeshStandardMaterial({ color: 0xff3d8a, roughness: 0.2, emissive: 0x3a0614 }), Ul, { decl: "varying vec3 vWp;", pos: "vWp = (modelMatrix * vec4(transformed, 1.)).xyz;", fdecl: "uniform float uLv, uT; varying vec3 vWp;", fcol: "if (vWp.y > uLv + .03 * sin(vWp.x * 9. + uT * 6.) * sin(vWp.z * 13. - uT * 4.)) discard; diffuseColor.rgb = mix(vec3(1., .55, .12), vec3(1., .16, .5), smoothstep(0., " + CAP.toFixed(1) + ", vWp.y));" }));
    const top = new THREE.Mesh(l.geo, inject(new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 0.75, 0.3), side: THREE.BackSide }), Ul, { decl: "varying vec3 vWp;", pos: "vWp = (modelMatrix * vec4(transformed, 1.)).xyz;", fdecl: "uniform float uLv, uT; varying vec3 vWp;", fcol: "if (vWp.y > uLv + .03 * sin(vWp.x * 9. + uT * 6.) * sin(vWp.z * 13. - uT * 4.)) discard;" }));
    liq.scale.set(0.965, 0.98, 0.9); top.scale.copy(liq.scale); liq.position.x = top.position.x = l.x;
    const glass = new THREE.Mesh(l.geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transmission: 0.0, transparent: true, opacity: 0.09, clearcoat: 1, envMapIntensity: 2.0, depthWrite: false })); glass.position.x = l.x;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 1, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 0.4, 0.7) })); st.position.x = l.x; scene.add(liq, top, glass, st);
    L.push({ Ul, lv, st, x: l.x, t0: T0 + l.i * DT });
  }
  const NB = 20000, BP = maskPoints(mot(51, "SIROP"), NB, { font: "gill", width: w.width, depth: 0.4, seed: 51, res: 1300 }), aB = new Float32Array(NB * 4); for (let i = 0; i < NB; i++) { let k = 0, bd = 1e9; L.forEach((q, j) => { const d = Math.abs(BP[i * 3] - q.x); if (d < bd) { bd = d; k = j; } }); aB.set([BP[i * 3], BP[i * 3 + 1] + CAP / 2, BP[i * 3 + 2], L[k].t0], i * 4); }
  const U = { uT: { value: 0 }, uPx: { value: 1 } }; scene.add(gpuPoints(NB, { aB: [4, aB], aS: [3, rnd(NB * 3, 1, 52)] }, U, `attribute vec4 aB; attribute vec3 aS; uniform float uT, uPx; varying float vA;
    void main(){ float lvl = ${CAP.toFixed(2)} * .86 * clamp((uT - aB.w) / ${FD.toFixed(1)}, 0., 1.), ph = fract(aS.x + uT * (.25 + .35 * aS.y)), y = ph * lvl; vec3 p = vec3(aB.x + .02 * sin(uT * 5. + aS.z * 30.), y, aB.z); vA = step(.02, lvl) * step(y, aB.y) * .35;
      vec4 mv = modelViewMatrix * vec4(p, 1.); gl_PointSize = max(1.2, (.012 + .016 * aS.z) * uPx / -mv.z); gl_Position = projectionMatrix * mv; }`, "varying float vA; void main(){ float d = length(gl_PointCoord - .5); gl_FragColor = vec4(vec3(1.4, 1.2, 1.) * vA * smoothstep(.5, .35, d) * (.3 + .7 * smoothstep(.2, .45, d)), 1.); }"));
  const D0 = fitDist(w.width, 30, 0.84), AZ = pchip([[0, -22], [3, -6], [6, 8]]), EL = pchip([[0, 16], [6, 9]]), DK = pchip([[0, 1.06], [6, 0.98]]);
  return { n: 51, title: "Remplissage", style: "Bar tiki (sirop et verre)", font: "Rubik Black", cam: "trois quarts, plongée légère qui s'abaisse", geste: "un filet tombe dans chaque lettre de verre, qui se remplit ; 20 000 bulles", scene, camera, accent: "#ff3d8a", bloom: [0.3, 0.55, 1.0],
    render(t, K) { U.uT.value = t; U.uPx.value = K.px(camera); for (const q of L) { const f = clamp((t - q.t0) / FD), lev = CAP * 0.86 * f; q.lv.value = f <= 0 ? -1 : lev; q.Ul.uT.value = t; const pour = ss(q.t0 - 0.25, q.t0, t) * (1 - ss(q.t0 + FD - 0.2, q.t0 + FD, t)), top = 4.2, bot = Math.max(lev, 0.02); q.st.visible = pour > 0.01; q.st.scale.set(pour, top - bot, pour); q.st.position.set(q.x, (top + bot) / 2, 0); }
      orbit(camera, { az: AZ(t), el: EL(t), dist: D0 * DK(t), target: [0, 0.95, 0] }); } };
}
