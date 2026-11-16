import { useRef, useState } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { fitCanvas, useAnimationFrame, useKeys } from "../hooks";

/*
 * Mirrors arcade's architecture: the game module only produces entities, and
 * an interchangeable display module draws them. F2 swaps the display at runtime
 * without touching the game state — like dlclose/dlopen on arcade_*.so.
 */

// ---------- IEntity / IGameModule ----------
type Entity = { kind: "head" | "body" | "tail" | "food" | "wall"; x: number; y: number; dir?: number; color: string };
type Pt = { x: number; y: number };
const COLS = 24, ROWS = 16;
const DIRS: Pt[] = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];

class SnakeModule {
  snake: Pt[] = [];
  dir = 0;
  queued: number[] = [];
  food: Pt = { x: 0, y: 0 };
  score = 0;
  best = 0;
  over = false;
  constructor() { this.reset(); }
  reset() {
    this.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
    this.dir = 0; this.queued = []; this.score = 0; this.over = false;
    this.placeFood();
  }
  placeFood() {
    do this.food = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
    while (this.snake.some((s) => s.x === this.food.x && s.y === this.food.y));
  }
  turn(d: number) {
    const last = this.queued.length ? this.queued[this.queued.length - 1] : this.dir;
    if (d !== last && (d + 2) % 4 !== last && this.queued.length < 3) this.queued.push(d);
  }
  blocked(p: Pt) {
    return p.x <= 0 || p.y <= 0 || p.x >= COLS - 1 || p.y >= ROWS - 1 || this.snake.slice(0, -1).some((s) => s.x === p.x && s.y === p.y);
  }
  /** Attract-mode AI: BFS toward the food, otherwise any safe move. */
  autopilot() {
    const head = this.snake[0];
    const key = (p: Pt) => p.y * COLS + p.x;
    const prev = new Map<number, number>();
    const q: Pt[] = [head];
    prev.set(key(head), -1);
    while (q.length) {
      const c = q.shift()!;
      if (c.x === this.food.x && c.y === this.food.y) {
        let k = key(c);
        while (prev.get(k) !== key(head)) k = prev.get(k)!;
        const fx = k % COLS, fy = Math.floor(k / COLS);
        const d = DIRS.findIndex((dd) => head.x + dd.x === fx && head.y + dd.y === fy);
        if (d >= 0) { this.queued = [d]; return; }
        break;
      }
      for (const d of DIRS) {
        const n = { x: c.x + d.x, y: c.y + d.y };
        if (!prev.has(key(n)) && !this.blocked(n)) { prev.set(key(n), key(c)); q.push(n); }
      }
    }
    for (const d of [this.dir, (this.dir + 1) % 4, (this.dir + 3) % 4]) {
      if (!this.blocked({ x: head.x + DIRS[d].x, y: head.y + DIRS[d].y })) { this.queued = [d]; return; }
    }
  }
  tick() {
    if (this.over) return;
    if (this.queued.length) this.dir = this.queued.shift()!;
    const h = this.snake[0];
    const n = { x: h.x + DIRS[this.dir].x, y: h.y + DIRS[this.dir].y };
    if (this.blocked(n)) { this.over = true; this.best = Math.max(this.best, this.score); return; }
    this.snake.unshift(n);
    if (n.x === this.food.x && n.y === this.food.y) { this.score += 10; this.placeFood(); } else this.snake.pop();
  }
  entities(): Entity[] {
    const out: Entity[] = [];
    for (let x = 0; x < COLS; x++) for (const y of [0, ROWS - 1]) out.push({ kind: "wall", x, y, color: "#334155" });
    for (let y = 1; y < ROWS - 1; y++) for (const x of [0, COLS - 1]) out.push({ kind: "wall", x, y, color: "#334155" });
    out.push({ kind: "food", ...this.food, color: "#f87171" });
    this.snake.forEach((s, i) => out.push({ kind: i === 0 ? "head" : i === this.snake.length - 1 ? "tail" : "body", ...s, dir: this.dir, color: "#4ade80" }));
    return out;
  }
}

// ---------- IDisplayModule implementations ----------
type Display = { name: string; draw(ctx: CanvasRenderingContext2D, w: number, h: number, ents: Entity[], hud: string[], t: number): void };

const ncurses: Display = {
  name: "arcade_ncurses.so",
  draw(ctx, w, h, ents, hud) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    const cw = Math.min(w / (COLS + 1), (h - 30) / (ROWS * 1.6));
    const ch = cw * 1.6;
    const fs = Math.floor(cw * 1.55);
    ctx.font = `${fs}px 'JetBrains Mono', monospace`;
    ctx.textBaseline = "top";
    const ox = Math.floor((w - COLS * cw) / 2), oy = Math.floor((h - ROWS * ch) / 2) + 8;
    const glyph = (e: Entity) => {
      if (e.kind === "wall") {
        const top = e.y === 0 || e.y === ROWS - 1, side = e.x === 0 || e.x === COLS - 1;
        if (top && side) return e.y === 0 ? (e.x === 0 ? "┌" : "┐") : e.x === 0 ? "└" : "┘";
        return top ? "─" : "│";
      }
      if (e.kind === "food") return "*";
      if (e.kind === "head") return [">", "v", "<", "^"][e.dir ?? 0];
      return e.kind === "tail" ? "." : "o";
    };
    for (const e of ents) {
      ctx.fillStyle = e.kind === "wall" ? "#a3a3a3" : e.kind === "food" ? "#ff5555" : e.kind === "head" ? "#ffff55" : "#55ff55";
      ctx.fillText(glyph(e), ox + e.x * cw, oy + e.y * ch);
    }
    ctx.fillStyle = "#c0c0c0";
    ctx.font = `${Math.max(10, fs - 2)}px 'JetBrains Mono', monospace`;
    ctx.fillText(hud.join("   "), ox, oy - ch - 2);
  },
};

const sfml: Display = {
  name: "arcade_sfml.so",
  draw(ctx, w, h, ents, hud, t) {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#0b1f14"); bg.addColorStop(1, "#04100a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const cs = Math.floor(Math.min(w / COLS, (h - 24) / ROWS));
    const ox = Math.floor((w - COLS * cs) / 2), oy = Math.floor((h - ROWS * cs) / 2) + 10;
    // checker board
    for (let y = 1; y < ROWS - 1; y++) for (let x = 1; x < COLS - 1; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#123222" : "#0f2b1d";
      ctx.fillRect(ox + x * cs, oy + y * cs, cs, cs);
    }
    for (const e of ents) {
      const px = ox + e.x * cs, py = oy + e.y * cs;
      if (e.kind === "wall") { ctx.fillStyle = "#3f5c4c"; ctx.fillRect(px, py, cs, cs); ctx.fillStyle = "#4d6e5b"; ctx.fillRect(px, py, cs, 3); continue; }
      if (e.kind === "food") {
        const r = cs * 0.36 + Math.sin(t * 6) * 1.2;
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(px + cs / 2, py + cs / 2 + 1, r, 0, 7); ctx.fill();
        ctx.fillStyle = "#fca5a5"; ctx.beginPath(); ctx.arc(px + cs / 2 - r / 3, py + cs / 2 - r / 3, r / 4, 0, 7); ctx.fill();
        ctx.fillStyle = "#16a34a"; ctx.fillRect(px + cs / 2, py + 2, 2, cs * 0.25);
        continue;
      }
      const pad = e.kind === "tail" ? cs * 0.22 : e.kind === "body" ? cs * 0.1 : 1;
      const g = ctx.createLinearGradient(px, py, px + cs, py + cs);
      g.addColorStop(0, e.kind === "head" ? "#86efac" : "#4ade80"); g.addColorStop(1, "#15803d");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(px + pad, py + pad, cs - 2 * pad, cs - 2 * pad, cs * 0.3); ctx.fill();
      if (e.kind === "head") {
        const d = DIRS[e.dir ?? 0];
        for (const s of [-1, 1]) {
          const ex = px + cs / 2 + d.x * cs * 0.15 + -d.y * s * cs * 0.2, ey = py + cs / 2 + d.y * cs * 0.15 + d.x * s * cs * 0.2;
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, ey, cs * 0.13, 0, 7); ctx.fill();
          ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(ex + d.x * 1.5, ey + d.y * 1.5, cs * 0.06, 0, 7); ctx.fill();
        }
      }
    }
    ctx.font = "600 12px Inter, sans-serif"; ctx.fillStyle = "#d1fae5"; ctx.textBaseline = "top";
    ctx.fillText(hud.join("   ·   "), ox, oy - 18);
  },
};

const DISPLAYS = [ncurses, sfml];

export default function Arcade({ running, accent }: DemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [lib, setLib] = useState(1);
  const [log, setLog] = useState<string[]>(["[core] dlopen(\"./lib/arcade_sfml.so\")", "[core] dlopen(\"./lib/arcade_snake.so\")"]);
  const [focused, setFocused] = useState(false);
  const game = useRef(new SnakeModule());
  const libRef = useRef(lib); libRef.current = lib;
  const timer = useRef({ acc: 0, t: 0, overT: 0 });

  const swap = () => {
    const next = (libRef.current + 1) % DISPLAYS.length;
    setLog((l) => [...l.slice(-3), `[core] dlclose(${DISPLAYS[libRef.current].name})`, `[core] dlopen("./lib/${DISPLAYS[next].name}") → IDisplayModule`]);
    setLib(next);
  };

  useKeys(wrapRef, (k) => {
    const g = game.current;
    if (k === "F2") swap();
    if (k === "F4" || (g.over && k === "Enter")) g.reset();
    const d = { ArrowRight: 0, ArrowDown: 1, ArrowLeft: 2, ArrowUp: 3, d: 0, s: 1, q: 2, a: 2, z: 3, w: 3 }[k];
    if (d !== undefined) g.turn(d);
  });

  useAnimationFrame((dt) => {
    const g = game.current, tm = timer.current, c = canvasRef.current!;
    const [w, h] = fitCanvas(c);
    tm.t += dt; tm.acc += dt;
    const speed = Math.max(0.06, 0.12 - g.snake.length * 0.0015);
    while (tm.acc > speed) {
      tm.acc -= speed;
      if (!focused) g.autopilot();
      g.tick();
    }
    if (g.over) { tm.overT += dt; if (!focused && tm.overT > 1.2) { g.reset(); tm.overT = 0; } } else tm.overT = 0;
    const hud = [`SCORE ${String(g.score).padStart(4, "0")}`, `BEST ${String(g.best).padStart(4, "0")}`, focused ? "PLAYER" : "DEMO"];
    if (g.over) hud.push("GAME OVER — Enter");
    DISPLAYS[libRef.current].draw(c.getContext("2d")!, w, h, g.entities(), hud, tm.t);
  }, running);

  return (
    <div ref={wrapRef} tabIndex={0} role="application" aria-label="Snake game. Arrow keys to steer, F2 to swap the display library, Enter to restart." onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} className="relative h-full w-full outline-none">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-2 left-2 max-w-[65%] rounded bg-black/70 px-2 py-1 font-mono text-[12px] leading-snug text-emerald-300/90 sm:text-[12px]">
        {log.slice(-2).map((l, i) => <div key={i} className="truncate">{l}</div>)}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); swap(); wrapRef.current?.focus(); }}
        className="absolute right-2 bottom-2 rounded px-2 py-1 font-mono text-[12px] text-white"
        style={{ background: `${accent}55`, border: `1px solid ${accent}88` }}
      >
        F2 · swap to {DISPLAYS[(lib + 1) % 2].name.replace("arcade_", "").replace(".so", "")}
      </button>
    </div>
  );
}
