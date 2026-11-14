import * as THREE from 'three';
import { clamp } from './math';
import { grid, type Q4 } from './geom';
import { patchMaterial } from './shader';
import type { Ctx } from './ctx';

/**
 * Eyes: a gaze-driven globe (procedural iris fibres, pupillary ring, dark limbus, round pupil)
 * under a clear glossy cornea, seated in an orbit whose rim is made of the body skin itself,
 * so the head pattern flows seamlessly into the eye socket.
 */
export function buildEyes(ctx: Ctx) {
  const { sp, model, L, u, addMesh } = ctx;
  const e = sp.eye;
  if (e.d <= 0) return;
  const r = (e.d / 2) * L;
  const sides: { side: 1 | -1; s: number; y: number }[] = [];
  if (sp.plan === 'flatR' || sp.plan === 'flatL') {
    const sd = sp.plan === 'flatR' ? 1 : -1;
    sides.push({ side: sd, s: e.s, y: e.y }, { side: sd, s: e.s + e.d * 0.9, y: e.y - 0.38 });
  } else sides.push({ side: 1, s: e.s, y: e.y }, { side: -1, s: e.s, y: e.y });

  const iris = new THREE.Color(e.iris);
  const iris2 = e.iris2 ? new THREE.Color(e.iris2) : iris.clone().lerp(new THREE.Color('#fff0c0'), 0.45);
  const globe = new THREE.Color(e.ring ?? sp.color.top).multiplyScalar(0.42);
  const eyeMat = patchMaterial(
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.3, metalness: 0.2, clearcoat: 0.25 }),
    u, undefined, { eye: { iris, iris2, pupil: new THREE.Color('#020305'), globe } },
  );
  const corneaMat = patchMaterial(
    new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.02, transparent: true, opacity: 0.1, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, envMapIntensity: 1.8 }),
    u,
  );
  ctx.track(eyeMat); ctx.track(corneaMat);
  const bulge = clamp(e.bulge ?? 0.35, 0, 1);

  for (const { side, s, y } of sides) {
    const at = model.attach(s, y, side);
    const fr = model.frame(s);
    const ez = at.n.clone();
    const fwd = fr.T.clone().negate();
    const ex = fwd.clone().addScaledVector(ez, -fwd.dot(ez)).normalize();
    const ey = new THREE.Vector3().crossVectors(ez, ex);
    if (ey.dot(fr.N) < 0) ey.negate();
    const handed = new THREE.Vector3().crossVectors(ex, ey).dot(ez) > 0;
    const depth = r * (0.5 - 0.28 * bulge);
    const ctr = at.p.clone().addScaledVector(ez, -depth);
    const pl = model.plasticAt(s, at.phi, false);
    const eyePl: Q4 = [pl[0] * 0.3, pl[1] * 0.5, 0, 0];
    const P = (lx: number, ly: number, lz: number, rad: number, zs = 1) =>
      ctr.clone().addScaledVector(ex, lx * rad).addScaledVector(ey, ly * rad).addScaledVector(ez, lz * rad * zs);

    // globe – local coords feed the iris/pupil shader so the gaze can rotate freely
    addMesh(grid(56, 30, (uu, vv) => {
      const th = vv * Math.PI * 0.6, ph = uu * Math.PI * 2;
      const lx = Math.sin(th) * Math.cos(ph), ly = Math.sin(th) * Math.sin(ph), lz = Math.cos(th);
      return { p: P(lx, ly, lz, r, 0.96), plastic: eyePl, eye: [lx, ly, lz, side] };
    }, handed), eyeMat, 2, true);

    // cornea – clear, slightly flattened dome over the whole exposed eye
    const thC = Math.acos(clamp(depth / (r * 1.03), -0.95, 0.95)) + 0.06;
    addMesh(grid(48, 12, (uu, vv) => {
      const th = vv * thC, ph = uu * Math.PI * 2;
      return { p: P(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th), r * 1.03, 0.97), plastic: eyePl };
    }, handed), corneaMat, 3, true);

    // orbit rim: skin fold tucked onto the globe, soft raised margin, fading into the head surface
    const rows: [number, number][] = [[0, 0], [0.97, 0.075], [1.1, 0.05], [1.25, 0.016], [1.45, 0]];
    const thIn = Math.acos(clamp((depth + 0.03 * r) / (r * 0.96), -0.9, 0.95));
    addMesh(grid(64, rows.length - 1, (uu, vv) => {
      const k = Math.round(vv * (rows.length - 1));
      const al = uu * Math.PI * 2, ca = Math.cos(al), sa = Math.sin(al);
      let p: THREE.Vector3;
      if (k === 0) p = P(Math.sin(thIn) * ca, Math.sin(thIn) * sa, Math.cos(thIn), r, 0.96);
      else {
        const [rho, lift] = rows[k];
        const pr = model.project(at.p.clone().addScaledVector(ex, ca * rho * r).addScaledVector(ey, sa * rho * r));
        p = model.surface(pr.s, pr.phi).addScaledVector(model.normalAt(pr.s, pr.phi), lift * r);
      }
      const pr = model.project(p);
      return { p, uv: [pr.s, pr.phi / (2 * Math.PI)], plastic: eyePl };
    }, handed), ctx.bodyMat, 1, true);
  }
}
