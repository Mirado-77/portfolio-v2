import type { Motif } from "../data";

/**
 * Point-cloud forms for the holographic core. Every generator fills exactly N
 * points (xyz), roughly inside a radius-3 sphere centred on the origin.
 * A seeded PRNG keeps each form identical between visits.
 */

type Gen = (n: number, r: () => number) => Float32Array;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;

/** Fills `out` with points produced by weighted sub-generators. */
function mix(n: number, r: () => number, parts: [number, (r: () => number, i: number, k: number) => [number, number, number]][]) {
  const out = new Float32Array(n * 3);
  const total = parts.reduce((a, [w]) => a + w, 0);
  let i = 0;
  parts.forEach(([w, fn], pi) => {
    const k = pi === parts.length - 1 ? n - i : Math.round((w / total) * n);
    for (let j = 0; j < k; j++, i++) {
      const [x, y, z] = fn(r, j, k);
      out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
    }
  });
  return out;
}

const sphere = (rad: number) => (r: () => number): [number, number, number] => {
  const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u);
  return [Math.cos(a) * s * rad, u * rad, Math.sin(a) * s * rad];
};
const fib = (rad: number) => (_r: () => number, i: number, k: number): [number, number, number] => {
  const y = 1 - (i / (k - 1)) * 2, s = Math.sqrt(1 - y * y), a = i * 2.39996323;
  return [Math.cos(a) * s * rad, y * rad, Math.sin(a) * s * rad];
};
const ring = (rad: number, tiltX: number, tiltZ: number, jitter = 0.02) => (r: () => number): [number, number, number] => {
  const a = r() * TAU;
  let x = Math.cos(a) * rad + (r() - 0.5) * jitter, y = (r() - 0.5) * jitter, z = Math.sin(a) * rad;
  // tilt around X then Z
  const cy = Math.cos(tiltX), sy = Math.sin(tiltX);
  [y, z] = [y * cy - z * sy, y * sy + z * cy];
  const cz = Math.cos(tiltZ), sz = Math.sin(tiltZ);
  [x, y] = [x * cz - y * sz, x * sz + y * cz];
  return [x, y, z];
};
const segment = (a: number[], b: number[], j = 0.01) => (r: () => number): [number, number, number] => {
  const t = r();
  return [a[0] + (b[0] - a[0]) * t + (r() - 0.5) * j, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * j, a[2] + (b[2] - a[2]) * t + (r() - 0.5) * j];
};
/** Points on the 12 edges of an axis-aligned box. */
const boxEdges = (c: number[], h: number[]) => (r: () => number): [number, number, number] => {
  const axis = Math.floor(r() * 3), sa = r() < 0.5 ? -1 : 1, sb = r() < 0.5 ? -1 : 1, t = r() * 2 - 1;
  const p = [0, 0, 0];
  p[axis] = t * h[axis];
  p[(axis + 1) % 3] = sa * h[(axis + 1) % 3];
  p[(axis + 2) % 3] = sb * h[(axis + 2) % 3];
  return [c[0] + p[0], c[1] + p[1], c[2] + p[2]];
};
const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];

const G: Record<Motif, Gen> = {
  core: (n, r) => mix(n, r, [
    [55, fib(1.9)],
    [12, ring(2.7, 1.2, 0.3)],
    [12, ring(3.1, -0.9, -0.4)],
    [10, ring(2.35, 0.2, 1.1)],
    [11, sphere(0.55)],
  ]),

  index: (n, r) => mix(n, r, Array.from({ length: 7 }, (_, i) => [1, (rr: () => number) => {
    const a = rr() * TAU, rad = 2.2 + Math.sin(i * 0.9) * 0.25;
    return [Math.cos(a) * rad, (i - 3) * 0.62 + (rr() - 0.5) * 0.03, Math.sin(a) * rad] as [number, number, number];
  }] as [number, (r: () => number) => [number, number, number]])),

  // a raycaster corridor: textured wall columns receding into the dark
  corridor: (n, r) => mix(n, r, [
    [70, (rr) => {
      const side = rr() < 0.5 ? -1 : 1, col = Math.floor(rr() * 40), z = 3 - col * 0.42;
      const h = 1.5 - (col % 5 === 0 ? 0 : 0.0);
      return [side * 1.5 + (rr() - 0.5) * 0.02, (rr() * 2 - 1) * h, z + (rr() - 0.5) * 0.18];
    }],
    [15, (rr) => [(rr() * 2 - 1) * 1.5, -1.5, 3 - rr() * 17]],
    [10, (rr) => [(rr() * 2 - 1) * 1.5, 1.5, 3 - rr() * 17]],
    [5, (rr) => { const p = sphere(0.35)(rr); return [p[0], p[1] - 0.2, p[2] - 5]; }],
  ]),

  // light paths: a lamp, a glass sphere, rays bouncing off the floor
  photon: (n, r) => {
    const L = [0, 2.6, 0];
    const rays = Array.from({ length: 46 }, () => {
      const a = r() * TAU, d = 0.5 + r() * 2.6;
      const hit = [Math.cos(a) * d, -1.4, Math.sin(a) * d];
      const b = r() * TAU;
      const out = [hit[0] + Math.cos(b) * 1.4, -1.4 + 0.6 + r() * 1.6, hit[2] + Math.sin(b) * 1.4];
      return [hit, out];
    });
    return mix(n, r, [
      [34, (rr) => { const [h] = pick(rr, rays); return segment(L, h, 0.015)(rr); }],
      [16, (rr) => { const [h, o] = pick(rr, rays); return segment(h, o, 0.015)(rr); }],
      [26, fib(1.0)],
      [14, (rr) => { const a = rr() * TAU, d = Math.sqrt(rr()) * 3.2; return [Math.cos(a) * d, -1.4, Math.sin(a) * d]; }],
      [10, (rr) => { const p = sphere(0.18)(rr); return [p[0], p[1] + 2.6, p[2]]; }],
    ]);
  },

  // a moon horizon, the descent trajectory and the lander
  orbit: (n, r) => mix(n, r, [
    [45, (rr) => { const p = fib(3.6)(rr, Math.floor(rr() * 4000), 4000); return p[1] > 1.2 ? [p[0], p[1] - 5.2, p[2]] : [p[0] * 0.98, 3.6 - 5.2 - rr() * 0.01, p[2] * 0.98]; }],
    [25, (rr) => { const t = rr(), a = t * TAU * 1.6; const rad = 3 * (1 - t) + 0.2; return [Math.cos(a) * rad, 2.2 - t * 3.6, Math.sin(a) * rad]; }],
    [15, boxEdges([0, 1.0, 0], [0.32, 0.22, 0.32])],
    [8, (rr) => { const s = rr() < 0.5 ? -1 : 1, t = rr(); return [s * (0.32 + t * 0.25), 0.78 - t * 0.38, (rr() - 0.5) * 0.05]; }],
    [7, (rr) => [(rr() * 2 - 1) * 0.6, -1.6, (rr() * 2 - 1) * 0.06]],
  ]),

  // snake on a phosphor grid
  pixel: (n, r) => {
    const path: number[][] = [];
    let x = -4, z = 2;
    const moves = [[1, 0], [1, 0], [1, 0], [0, -1], [0, -1], [1, 0], [1, 0], [1, 0], [0, 1], [1, 0], [1, 0], [0, -1], [0, -1], [0, -1]];
    path.push([x, z]);
    for (const [dx, dz] of moves) { x += dx; z += dz; path.push([x, z]); }
    const cell = 0.42;
    return mix(n, r, [
      [40, (rr) => { const [cx, cz] = pick(rr, path); return boxEdges([cx * cell, -0.6, cz * cell], [cell * 0.42, cell * 0.42, cell * 0.42])(rr); }],
      [12, (rr) => boxEdges([3 * cell, -0.6, -3 * cell], [cell * 0.32, cell * 0.32, cell * 0.32])(rr)],
      [48, (rr) => { const gx = Math.floor(rr() * 17) - 8, gz = Math.floor(rr() * 13) - 6; const t = rr() < 0.5; return [gx * cell + (t ? rr() * cell : 0), -1.05, gz * cell + (t ? 0 : rr() * cell)]; }],
    ]);
  },

  // the toroidal tile world
  torus: (n, r) => mix(n, r, [
    [85, (rr) => {
      const u = Math.floor(rr() * 40) / 40 * TAU + rr() * 0.04, v = rr() * TAU;
      const R = 2.1, rad = 0.85;
      return [(R + rad * Math.cos(v)) * Math.cos(u), rad * Math.sin(v), (R + rad * Math.cos(v)) * Math.sin(u)];
    }],
    [15, (rr) => { const u = rr() * TAU, v = Math.floor(rr() * 6) * (TAU / 6); const R = 2.1, rad = 0.87; return [(R + rad * Math.cos(v)) * Math.cos(u), rad * Math.sin(v), (R + rad * Math.cos(v)) * Math.sin(u)]; }],
  ]),

  // bento panels at different depths
  bento: (n, r) => {
    const tiles = [[-1.6, 0.9, 1.4, 1.0, 0], [0.9, 0.5, 1.6, 2.0, 0.4], [-1.6, -1.0, 1.4, 0.75, 0.2], [0.2, -1.5, 0.3, 0.5, -0.3], [-0.3, 1.6, 0.4, 0.35, 0.6]];
    return mix(n, r, [
      [70, (rr) => {
        const [cx, cy, w, h, z] = pick(rr, tiles);
        const t = rr() * 2 - 1;
        return rr() < 0.5 ? [cx + t * w, cy + (rr() < 0.5 ? -h : h), z] : [cx + (rr() < 0.5 ? -w : w), cy + t * h, z];
      }],
      [30, (rr) => {
        const [cx, cy, w, h, z] = pick(rr, tiles);
        const px = rr() * 2 - 1;
        return [cx + px * w * 0.8, cy - h * 0.6 + (Math.sin(px * 4 + cx) * 0.3 + 0.5) * h * 0.9, z];
      }],
    ]);
  },

  // a small network: layers of nodes and the edges between them
  neural: (n, r) => {
    const layers = [3, 5, 5, 2];
    const nodes: number[][] = [];
    layers.forEach((k, li) => { for (let i = 0; i < k; i++) nodes.push([(li - 1.5) * 1.6, (i - (k - 1) / 2) * 0.9, (r() - 0.5) * 0.8, li]); });
    const edges: number[][][] = [];
    nodes.forEach((a) => nodes.forEach((b) => { if (b[3] === a[3] + 1) edges.push([a, b]); }));
    return mix(n, r, [
      [40, (rr) => { const c = pick(rr, nodes); const p = sphere(0.16)(rr); return [c[0] + p[0], c[1] + p[1], c[2] + p[2]]; }],
      [60, (rr) => { const [a, b] = pick(rr, edges); return segment(a, b, 0.01)(rr); }],
    ]);
  },

  // a serverless pipeline: Chat → Lambda → Bedrock → Zoho
  relay: (n, r) => {
    const xs = [-2.6, -0.9, 0.9, 2.6];
    return mix(n, r, [
      [60, (rr) => { const x = pick(rr, xs); return boxEdges([x, 0, 0], [0.42, 0.42, 0.42])(rr); }],
      [25, (rr) => segment([-2.6, 0, 0], [2.6, 0, 0], 0.02)(rr)],
      [15, (rr) => { const a = rr() * TAU; return [0.9 + Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0]; }],
    ]);
  },

  // a chat bubble with three dots
  chat: (n, r) => mix(n, r, [
    [60, (rr) => {
      const w = 2.4, h = 1.3, rad = 0.4, t = rr();
      const per = 2 * (w - rad) * 2 + 2 * (h - rad) * 2 + TAU * rad;
      let d = t * per;
      const sides = [[-w + rad, h, w - rad, h], [w, h - rad, w, -h + rad], [w - rad, -h, -w + rad, -h], [-w, -h + rad, -w, h - rad]];
      const corners = [[w - rad, h - rad, 0], [w - rad, -h + rad, 1], [-w + rad, -h + rad, 2], [-w + rad, h - rad, 3]];
      for (let s = 0; s < 4; s++) {
        const [x0, y0, x1, y1] = sides[s];
        const len = Math.hypot(x1 - x0, y1 - y0);
        if (d < len) { const f = d / len; return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, (rr() - 0.5) * 0.04]; }
        d -= len;
        const arc = (TAU / 4) * rad;
        if (d < arc) { const [cx, cy, q] = corners[s]; const a = Math.PI / 2 - q * (Math.PI / 2) - (d / arc) * (Math.PI / 2); return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 0]; }
        d -= arc;
      }
      return [0, 0, 0];
    }],
    [12, (rr) => segment([-1.2, -1.3, 0], [-1.9, -2.2, 0])(rr)],
    [8, (rr) => segment([-0.5, -1.3, 0], [-1.9, -2.2, 0])(rr)],
    [20, (rr) => { const p = sphere(0.18)(rr); const cx = pick(rr, [-0.7, 0, 0.7]); return [cx + p[0], p[1], p[2]]; }],
  ]),

  lattice: (n, r) => mix(n, r, [
    [100, (rr) => {
      const g = 5, s = 0.8, axis = Math.floor(rr() * 3);
      const p = [Math.floor(rr() * g) - (g - 1) / 2, Math.floor(rr() * g) - (g - 1) / 2, Math.floor(rr() * g) - (g - 1) / 2].map((v) => v * s);
      p[axis] += (rr() - 0.5) * s;
      return p as [number, number, number];
    }],
  ]),

  helix: (n, r) => mix(n, r, [
    [40, (rr) => { const t = rr(), a = t * TAU * 2.5; return [Math.cos(a) * 1.2, (t - 0.5) * 6, Math.sin(a) * 1.2]; }],
    [40, (rr) => { const t = rr(), a = t * TAU * 2.5 + Math.PI; return [Math.cos(a) * 1.2, (t - 0.5) * 6, Math.sin(a) * 1.2]; }],
    [20, (rr) => { const t = Math.floor(rr() * 24) / 24, a = t * TAU * 2.5, f = rr() * 2 - 1; return [Math.cos(a) * 1.2 * f, (t - 0.5) * 6, Math.sin(a) * 1.2 * f]; }],
  ]),

  portal: (n, r) => mix(n, r, [
    [35, (rr) => { const a = rr() * TAU; const R = 2.4 + (rr() - 0.5) * 0.05; return [Math.cos(a) * R, Math.sin(a) * R, (rr() - 0.5) * 0.05]; }],
    [15, (rr) => { const a = rr() * TAU; return [Math.cos(a) * 2.8, Math.sin(a) * 2.8, 0]; }],
    [50, (rr) => { const t = rr(), a = t * TAU * 5; const R = t * 2.2; return [Math.cos(a) * R, Math.sin(a) * R, (1 - t) * -1.2]; }],
  ]),
};

const cache = new Map<string, Float32Array>();
export function shape(m: Motif, n: number): Float32Array {
  const key = `${m}:${n}`;
  let s = cache.get(key);
  if (!s) cache.set(key, (s = G[m](n, rng(m.length * 7919 + m.charCodeAt(0)))));
  return s;
}
