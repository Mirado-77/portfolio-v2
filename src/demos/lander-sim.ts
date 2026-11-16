/*
 * Small LunarLander-like environment: same action space (0 noop, 1 left engine,
 * 2 main engine, 3 right engine), same 8-dim observation layout and the same
 * reward shaping idea as Gymnasium's LunarLander-v3, with simpler rigid-body physics.
 */

export const WORLD_W = 20; // x in [-10, 10]
export const PAD = 2; // helipad half-width, centred on x = 0
export const DT = 1 / 50;

const G = 1.62 * 1.4;
const MAIN = 6.2;
const SIDE_TORQUE = 2.6;
const SIDE_PUSH = 0.6;
const LEG_Y = 0.55; // distance from centre to feet
const LEG_X = 0.55;

export type LanderState = {
  x: number; y: number; vx: number; vy: number; a: number; w: number;
  legs: [boolean, boolean];
  done: boolean; outcome: "flying" | "landed" | "crashed" | "away";
  ret: number; steps: number; prevShaping: number | null; rest: number;
  wind: number;
};

export function reset(rand = Math.random, wind = false): LanderState {
  return {
    x: (rand() - 0.5) * 6, y: 11, vx: (rand() - 0.5) * 4, vy: -rand() * 1.5,
    a: (rand() - 0.5) * 0.4, w: (rand() - 0.5) * 0.6,
    legs: [false, false], done: false, outcome: "flying",
    ret: 0, steps: 0, prevShaping: null, rest: 0,
    wind: wind ? (rand() - 0.5) * 2 : 0,
  };
}

/** Observation in the Gymnasium layout, roughly normalised. */
export function observe(s: LanderState) {
  return [s.x / 10, s.y / 6.6, s.vx / 5, s.vy / 5, s.a, s.w / 2.5, s.legs[0] ? 1 : 0, s.legs[1] ? 1 : 0];
}

export function step(s: LanderState, action: number, t = 0): number {
  if (s.done) return 0;
  const sin = Math.sin(s.a), cos = Math.cos(s.a);
  let ax = 0, ay = -G, aw = 0;
  if (action === 2) { ax += -sin * MAIN; ay += cos * MAIN; }
  if (action === 1) { aw += SIDE_TORQUE; ax += cos * SIDE_PUSH; ay += sin * SIDE_PUSH; }
  if (action === 3) { aw -= SIDE_TORQUE; ax -= cos * SIDE_PUSH; ay -= sin * SIDE_PUSH; }
  if (s.wind) ax += s.wind * Math.sin(t * 0.7) * 0.8;

  const onGround = s.legs[0] || s.legs[1];
  s.vx += ax * DT; s.vy += ay * DT; s.w += aw * DT;
  s.w *= onGround ? 0.85 : 0.995;
  s.x += s.vx * DT; s.y += s.vy * DT; s.a += s.w * DT;

  // ground contact: feet are at the rotated leg positions
  const feet = [-1, 1].map((side) => s.y - LEG_Y * cos + side * LEG_X * sin);
  const body = s.y - 0.25;
  s.legs = [feet[0] <= 0, feet[1] <= 0];
  let reward = 0;
  if (body <= 0 || ((s.legs[0] || s.legs[1]) && (s.vy < -2.4 || Math.abs(s.a) > 0.6 || Math.abs(s.vx) > 2.2))) {
    s.done = true; s.outcome = "crashed"; reward -= 100;
  } else if (s.legs[0] || s.legs[1]) {
    // resolve penetration, apply friction and a righting torque on the legs
    const pen = Math.max(-feet[0], -feet[1]);
    s.y += pen; if (s.vy < 0) s.vy = 0;
    s.vx *= 0.9;
    // the hull settles onto both legs
    s.w *= 0.5;
    s.a *= 0.92;
    if (Math.abs(s.a) < 0.04) s.legs = [true, true];
  }
  if (Math.abs(s.x) > WORLD_W / 2 || s.y > 18) { s.done = true; s.outcome = "away"; reward -= 100; }

  const o = observe(s);
  const shaping = -100 * Math.hypot(o[0], o[1]) - 100 * Math.hypot(o[2], o[3]) - 100 * Math.abs(o[4]) + 10 * o[6] + 10 * o[7];
  if (s.prevShaping !== null) reward += shaping - s.prevShaping;
  s.prevShaping = shaping;
  reward -= action === 2 ? 0.3 : action === 1 || action === 3 ? 0.03 : 0;

  if (!s.done && s.legs[0] && s.legs[1] && Math.abs(s.vx) < 0.05 && Math.abs(s.vy) < 0.05 && Math.abs(s.w) < 0.05) {
    s.rest += DT;
    if (s.rest > 0.4) { s.done = true; s.outcome = "landed"; reward += 100; }
  } else s.rest = 0;
  s.steps++;
  if (s.steps > 1500 && !s.done) { s.done = true; s.outcome = "away"; }
  s.ret += reward;
  return reward;
}

/** PD controller, same structure as Gymnasium's `heuristic()` baseline. */
export function heuristic(s: LanderState): number {
  let angleTarg = s.x * 0.05 + s.vx * 0.22;
  angleTarg = Math.max(-0.4, Math.min(0.4, angleTarg));
  const hoverTarg = 0.55 * Math.abs(s.x);
  let angleTodo = (angleTarg - s.a) * 0.5 - s.w * 0.4;
  let hoverTodo = (hoverTarg - s.y) * 0.25 - s.vy * 0.7;
  if (s.legs[0] || s.legs[1]) { angleTodo = 0; hoverTodo = -s.vy * 0.5; }
  if (hoverTodo > Math.abs(angleTodo) && hoverTodo > 0.05) return 2;
  if (angleTodo < -0.05) return 3;
  if (angleTodo > 0.05) return 1;
  return 0;
}
