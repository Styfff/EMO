// Geometry for the foliot clock, built in code (units ≈ mm). Every wheel lies in the XY plane and is extruded along +Z.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const ss = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };

function fixNormals(g) {
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > .5)) n.setXYZ(i, 0, 0, 1);
  return g;
}
export function extrude(shape, depth, bevel = .35, curveSegments = 32) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(.01, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * .9,
    bevelSegments: 2, curveSegments,
  });
  g.translate(0, 0, bevel);
  return fixNormals(g);
}

// window paths between spokes: annular sectors with straight spoke edges of constant width
function spokeWindows(rIn, rHub, spokes, sw, phase = Math.PI / 4) {
  const holes = [];
  for (let i = 0; i < spokes; i++) {
    const a0 = phase + i * TAU / spokes, a1 = a0 + TAU / spokes;
    const dIn = Math.asin(Math.min(.9, sw / 2 / rIn)), dHub = Math.asin(Math.min(.9, sw / 2 / rHub));
    const p = new THREE.Path();
    const steps = 40;
    for (let k = 0; k <= steps; k++) { const a = a0 + dIn + (a1 - a0 - 2 * dIn) * k / steps; const v = [rIn * Math.cos(a), rIn * Math.sin(a)]; k ? p.lineTo(...v) : p.moveTo(...v); }
    for (let k = steps; k >= 0; k--) { const a = a0 + dHub + (a1 - a0 - 2 * dHub) * k / steps; p.lineTo(rHub * Math.cos(a), rHub * Math.sin(a)); }
    p.closePath(); holes.push(p);
  }
  return holes;
}
function circlePath(r, cx = 0, cy = 0, n = 32) {
  const p = new THREE.Path();
  for (let k = 0; k <= n; k++) { const a = -k / n * TAU; const v = [cx + r * Math.cos(a), cy + r * Math.sin(a)]; k ? p.lineTo(...v) : p.moveTo(...v); }
  return p;
}

// spur wheel with rounded (ogival, clock-style) teeth and a crossed skeleton
export function spurWheel(R, N, thick, { spokes = 4, rim = 5, hub = 7, sw = 4.2, axle = 2.2 } = {}) {
  const m = 2 * R / N, add = .95 * m, ded = 1.2 * m;
  const s = new THREE.Shape();
  const per = TAU / N, pts = [];
  for (let i = 0; i < N; i++) {
    const a = i * per;
    const tw = .46 * per;                      // tooth angular width at the pitch circle
    // root, flank, ogival tip, flank, root
    pts.push([R - ded, a - per * .5 + .0001]);
    pts.push([R - ded, a - tw * .62]);
    pts.push([R - .2 * m, a - tw * .52]);
    const tipN = 7;
    for (let k = 0; k <= tipN; k++) {
      const u = k / tipN, ang = a + (u - .5) * tw;
      const r = R + add * Math.sin(Math.PI * u) ** .55 * .95 + (u > 0 && u < 1 ? 0 : 0);
      pts.push([r, ang]);
    }
    pts.push([R - .2 * m, a + tw * .52]);
    pts.push([R - ded, a + tw * .62]);
  }
  pts.forEach(([r, a], i) => { const v = [r * Math.cos(a), r * Math.sin(a)]; i ? s.lineTo(...v) : s.moveTo(...v); });
  s.closePath();
  const rIn = R - ded - rim;
  if (spokes) s.holes.push(...spokeWindows(rIn, hub, spokes, sw));
  s.holes.push(circlePath(axle));
  return extrude(s, thick, .3, 12);
}

// lantern pinion: two flanges and N pins
export function lanternPinion(rp, N, len) {
  const flange = new THREE.CylinderGeometry(rp + 2.2, rp + 2.2, 1.3, 40); flange.rotateX(Math.PI / 2);
  const pin = new THREE.CylinderGeometry(.95, .95, len, 12); pin.rotateX(Math.PI / 2);
  return { flange, pin, rp, N, len };
}

// crown (contrate) wheel: a skeleton disc plus a band whose top edge carries N saw teeth pointing +Z
export function crownBand(rIn, rOut, base, toothH, N, seg = 24) {
  const M = N * seg, pos = [], nor = [];
  const h = a => {                              // height of the band's top edge at angle a
    let f = ((a / TAU) * N) % 1; if (f < 0) f += 1;
    if (f < .72) return base + toothH * (f / .72) ** 1.1;      // the long sloping back of the tooth
    if (f < .77) return base + toothH;                           // a narrow flat tip
    if (f < .82) return base + toothH * (1 - ss((f - .77) / .05)); // the steep face falling to the root
    return base;
  };
  const P = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];
  const tri = (a, b, c, n) => { pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) nor.push(...(n || [0, 0, 1])); };
  const faceN = (a, b, c) => { const u = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), v = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const n = u.cross(v).normalize(); return [n.x, n.y, n.z]; };
  for (let i = 0; i < M; i++) {
    const a0 = i / M * TAU, a1 = (i + 1) / M * TAU, z0 = h(a0), z1 = h(a1);
    const no0 = [Math.cos(a0), Math.sin(a0), 0], no1 = [Math.cos(a1), Math.sin(a1), 0];
    // outer wall
    const o00 = P(rOut, a0, 0), o01 = P(rOut, a1, 0), o10 = P(rOut, a0, z0), o11 = P(rOut, a1, z1);
    pos.push(...o00, ...o01, ...o11, ...o00, ...o11, ...o10); nor.push(...no0, ...no1, ...no1, ...no0, ...no1, ...no0);
    // inner wall
    const i00 = P(rIn, a0, 0), i01 = P(rIn, a1, 0), i10 = P(rIn, a0, z0), i11 = P(rIn, a1, z1);
    const ni0 = no0.map(v => -v), ni1 = no1.map(v => -v);
    pos.push(...i00, ...i11, ...i01, ...i00, ...i10, ...i11); nor.push(...ni0, ...ni1, ...ni1, ...ni0, ...ni0, ...ni1);
    // top
    const n = faceN(o10, o11, i11); tri(o10, o11, i11, n); tri(o10, i11, i10, n);
    // bottom
    tri(o00, i01, o01, [0, 0, -1]); tri(o00, i00, i01, [0, 0, -1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
export function skeletonDisc(R, thick, { spokes = 4, rimW = 6, hub = 8, sw = 5, axle = 2.2 } = {}) {
  const s = new THREE.Shape();
  s.absarc(0, 0, R, 0, TAU, false);
  s.holes.push(...spokeWindows(R - rimW, hub, spokes, sw));
  s.holes.push(circlePath(axle));
  return extrude(s, thick, .3, 64);
}

// a flat bar with round ends from (x0,y0) to (x1,y1), lying in XY, extruded along +Z
export function capsule(x0, y0, x1, y1, w, thick, holes = []) {
  const len = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0), r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(0, -r); s.lineTo(len, -r); s.absarc(len, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0, r); s.absarc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  for (const h of holes) s.holes.push(circlePath(h.r, h.d, 0));
  const g = extrude(s, thick, .35, 24);
  g.rotateZ(a); g.translate(x0, y0, 0);
  return g;
}
export function boss(r, thick, hole = 0) {
  const s = new THREE.Shape(); s.absarc(0, 0, r, 0, TAU, false);
  if (hole) s.holes.push(circlePath(hole));
  return extrude(s, thick, .4, 48);
}

// slotted screw head, sitting on z = 0, facing +Z
export function screwHead(r = 3.2, h = 1.8) {
  const pts = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector2(r * Math.cos(u * Math.PI / 2) ** .35, h * Math.sin(u * Math.PI / 2))); }
  pts.unshift(new THREE.Vector2(0, 0)); pts[1] = new THREE.Vector2(r, 0);
  const head = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(0.001, p.x), p.y)), 40);
  head.rotateX(Math.PI / 2);
  const slot = new THREE.BoxGeometry(r * 2.1, r * .26, h * .9); slot.translate(0, 0, h * .78);
  return { head, slot };
}

// jewel bearing: a gold chaton and a domed ruby with a dark pivot hole
export function jewel(r = 3.4) {
  const chaton = new THREE.CylinderGeometry(r * 1.75, r * 1.85, 1.3, 40); chaton.rotateX(Math.PI / 2); chaton.translate(0, 0, .65);
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push(new THREE.Vector2(Math.max(.001, r * Math.cos(u * Math.PI / 2)), .9 + .9 * Math.sin(u * Math.PI / 2))); }
  pts.unshift(new THREE.Vector2(r, 0));
  const ruby = new THREE.LatheGeometry(pts, 40); ruby.rotateX(Math.PI / 2);
  const hole = new THREE.CylinderGeometry(r * .28, r * .28, .2, 16); hole.rotateX(Math.PI / 2); hole.translate(0, 0, 1.82);
  return { chaton, ruby, hole };
}

// the hand: a slender blued-steel pointer with a spade tip, hub ring and counterweight tail, in XY pointing +Y
export function handShape(len = 62) {
  const s = new THREE.Shape();
  const pts = [
    [0, -18], [3.2, -16.5], [4.6, -13], [3.2, -9.5], [1.4, -8.2], [1.6, -5.5],
    [6.5, 0], [1.6, 5.5], [1.0, len * .62], [4.8, len * .74], [5.4, len * .80], [3.4, len * .86], [0, len],
  ];
  const all = [...pts, ...pts.slice(0, -1).reverse().map(([x, y]) => [-x, y])];
  all.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
  s.closePath();
  s.holes.push(circlePath(1.6));
  s.holes.push(circlePath(1.4, 0, -13));
  return extrude(s, 1.4, .25, 16);
}
