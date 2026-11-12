// 36 · Fonte et coulure — glace : le mot fond (étirement inégal, coulures effilées, flaque), puis se reforme en marche arrière
import { THREE, GLSL, textMask, measure, pchip, makeCam, orbit, ss , mot } from "../kit.js";
export function make(K) {
  const scene = new THREE.Scene(), camera = makeCam(30); scene.background = new THREE.Color(0xbfeedd);
  const m = textMask(mot(36, "GLACE"), { font: "round", width: 6.0, res: 1400, pad: 0.1, blur: 9 }), tex = new THREE.CanvasTexture(m.canvas); tex.minFilter = tex.magFilter = THREE.LinearFilter;
  const YC = 0.9, CAPH = 6.0 / measure(mot(36, "GLACE"), "round", 1, 0.04), YT = YC + CAPH / 2, YB = YC - CAPH / 2, YF = -2.6, U = { uT: { value: 0 }, uM: { value: 0 }, uF: { value: tex } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.ShaderMaterial({ uniforms: U, vertexShader: "varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }",
    fragmentShader: GLSL + `uniform float uT, uM; uniform sampler2D uF; varying vec2 vP;
      float nx(float x){ return .5 + .5 * sin(x * 2.9 + 1.2) * sin(x * 6.7 - .4) + .22 * sin(x * 13.1); }
      float fld(vec2 p){ float D = uM * (.35 + 1.75 * clamp(nx(p.x), 0., 1.)), yt = ${YT.toFixed(3)} - .22 * uM * nx(p.x * .6 + 2.), sy = yt - (yt - p.y) / (1. + D);
        vec2 uv = vec2(p.x / ${m.W.toFixed(3)} + .5, (sy - ${YC.toFixed(3)}) / ${m.Hh.toFixed(3)} + .5); float a = (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) ? 0. : texture2D(uF, uv).a;
        float below = clamp((${YB.toFixed(3)} - p.y) / ${(YB - YF).toFixed(3)}, 0., 1.); a -= .30 * uM * below * (1. - .5 * nx(p.x * 3.)); if (p.y < ${YF.toFixed(2)}) a = 0.;
        float wdt = 3.2 * sst(.15, 1., uM) * (.8 + .2 * nx(p.x * .7)), pud = (1. - sst(.0, .13 + .3 * uM, p.y - (${YF.toFixed(2)}))) * step(${YF.toFixed(2)} - .02, p.y) * (1. - sst(wdt - .5, wdt, abs(p.x + .2 * sin(p.y * 9.)))) * sst(.12, .4, uM);
        return max(a, pud * .9); }
      void main(){ vec2 p = vP; float e = .012, a = fld(p), ax = fld(p + vec2(e, 0.)) - fld(p - vec2(e, 0.)), ay = fld(p + vec2(0., e)) - fld(p - vec2(0., e));
        vec3 bg = mix(vec3(.75, .93, .87), vec3(.62, .86, .80), sst(-1., 6., length(p - vec2(0., .5)))); float sh = fld(p + vec2(-.12, .16)); bg *= 1. - .22 * sst(.35, .6, sh);
        float mk = sst(.47, .53, a); vec3 n = normalize(vec3(-ax, -ay, .16 + .5 * sst(.5, .95, a))), L = normalize(vec3(-.4, .55, .72)); float df = max(dot(n, L), 0.), sp = pow(max(dot(reflect(-L, n), vec3(0., 0., 1.)), 0.), 38.);
        float swirl = .5 + .5 * sin(p.y * 5.5 + p.x * 1.4 + 2.5 * sin(p.x * 1.9)); vec3 ice = mix(vec3(1., .40, .56), vec3(1., .93, .74), sst(.55, .8, swirl)); ice = ice * (.5 + .62 * df) + vec3(1.) * sp * .7;
        gl_FragColor = vec4(mix(bg, ice, mk), 1.); }` })); scene.add(quad);
  const AZ = pchip([[0, -5], [3, 4], [6, -2]]);
  return { n: 36, title: "Fonte et coulure", style: "Glace (pastel gourmand)", font: "Nunito Black", cam: "de face, léger balancement", geste: "le mot fond, coule et fait flaque, puis se reforme en marche arrière", scene, camera, light: true, accent: "#e0306a", bloom: [0.08, 0.4, 1.3], vig: 0.14, tone: "neutral",
    render(t) { U.uT.value = t; U.uM.value = ss(0.8, 3.4, t) * (1 - ss(4.2, 5.5, t)); orbit(camera, { az: AZ(t), el: 0, dist: 16, target: [0, 0.05, 0] }); } };
}
