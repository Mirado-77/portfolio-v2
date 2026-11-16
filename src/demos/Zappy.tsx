import { useEffect, useRef, useState } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { fitCanvas, useAnimationFrame } from "../hooks";

/*
 * A client-side simulation of a Zappy match as seen from the GUI: a toroidal tile
 * world, resource spawning, drones that forage, broadcast to teammates, gather on
 * a tile and run incantations using the real elevation requirements.
 */

const W = 16, H = 10;
const RES = ["food", "linemate", "deraumere", "sibur", "mendiane", "phiras", "thystame"] as const;
const RES_COLORS = ["#a3e635", "#e5e7eb", "#60a5fa", "#f472b6", "#fb923c", "#c084fc", "#facc15"];
const DENSITY = [0.5, 0.3, 0.15, 0.1, 0.1, 0.08, 0.05];
// players needed, then stones linemate..thystame, per level
const ELEV: number[][] = [
  [1, 1, 0, 0, 0, 0, 0],
  [2, 1, 1, 1, 0, 0, 0],
  [2, 2, 0, 1, 0, 2, 0],
  [4, 1, 1, 2, 0, 1, 0],
  [4, 1, 2, 1, 3, 0, 0],
  [6, 1, 2, 3, 0, 1, 0],
  [6, 2, 2, 2, 2, 2, 1],
];
const TEAMS = [
  { name: "alpha", color: "#facc15" },
  { name: "beta", color: "#38bdf8" },
  { name: "gamma", color: "#f472b6" },
];

type Drone = {
  id: number; team: number; x: number; y: number; px: number; py: number; dir: number;
  level: number; inv: number[]; food: number; incant: number; target: { x: number; y: number } | null; waiting: number;
};
type Fx = { kind: "wave" | "incant" | "death" | "egg"; x: number; y: number; t: number; color: string };

const wrap = (v: number, m: number) => ((v % m) + m) % m;
const tdist = (a: number, b: number, m: number) => { const d = wrap(b - a, m); return d > m / 2 ? d - m : d; };

function createWorld() {
  const tiles = Array.from({ length: W * H }, () => RES.map(() => 0));
  const spawn = () => {
    RES.forEach((_, r) => {
      const want = Math.floor(W * H * DENSITY[r]);
      const have = tiles.reduce((n, t) => n + t[r], 0);
      for (let i = have; i < want; i++) tiles[Math.floor(Math.random() * W * H)][r]++;
    });
  };
  spawn();
  let nextId = 0;
  const drones: Drone[] = [];
  const addDrone = (team: number, x?: number, y?: number) => {
    const dx = x ?? Math.floor(Math.random() * W), dy = y ?? Math.floor(Math.random() * H);
    drones.push({ id: nextId++, team, x: dx, y: dy, px: dx, py: dy, dir: Math.floor(Math.random() * 4), level: 1, inv: RES.map(() => 0), food: 10, incant: 0, target: null, waiting: 0 });
  };
  TEAMS.forEach((_, t) => { for (let i = 0; i < 3; i++) addDrone(t); });
  return { tiles, drones, spawn, addDrone, fx: [] as Fx[], log: [] as string[], tick: 0, broadcasts: [] as { team: number; level: number; x: number; y: number; ttl: number }[] };
}

function ZappySim({ running, accent }: DemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const world = useRef(createWorld());
  const clock = useRef({ acc: 0 });
  const [freq, setFreq] = useState(1);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [, force] = useState(0);
  const freqRef = useRef(freq); freqRef.current = freq;
  const geom = useRef({ ox: 0, oy: 0, cs: 1 });

  const simTick = () => {
    const wd = world.current;
    wd.tick++;
    if (wd.tick % 20 === 0) wd.spawn();
    wd.broadcasts = wd.broadcasts.filter((b) => --b.ttl > 0);
    const log = (s: string) => { wd.log = [...wd.log.slice(-3), s]; };

    for (const d of [...wd.drones]) {
      d.px = d.x; d.py = d.y;
      if (wd.tick % 6 === 0) d.food -= 1;
      const tile = wd.tiles[d.y * W + d.x];
      // eat
      if (d.food < 12 && tile[0] > 0) { tile[0]--; d.food += 6; continue; }
      if (d.food <= 0) {
        wd.drones.splice(wd.drones.indexOf(d), 1);
        wd.fx.push({ kind: "death", x: d.x, y: d.y, t: 0, color: TEAMS[d.team].color });
        log(`${TEAMS[d.team].name}: drone #${d.id} starved`);
        continue;
      }
      if (d.incant > 0) { d.incant--; continue; }
      const req = ELEV[d.level - 1];
      if (!req) continue;
      // pick up needed stones on this tile
      let picked = false;
      for (let r = 1; r < RES.length; r++) if (tile[r] > 0 && d.inv[r] < req[r] * 2) { tile[r]--; d.inv[r]++; picked = true; break; }
      if (picked) continue;

      const hasStones = req.slice(1).every((n, i) => d.inv[i + 1] >= n);
      if (hasStones) {
        const mates = wd.drones.filter((o) => o.team === d.team && o.level === d.level && o.x === d.x && o.y === d.y && o.incant === 0);
        if (mates.length >= req[0]) {
          // incantation: consume stones, everybody on the tile rises a level after a delay
          req.slice(1).forEach((n, i) => (d.inv[i + 1] -= n));
          mates.forEach((m) => { m.incant = 8; m.level++; m.waiting = 0; });
          wd.fx.push({ kind: "incant", x: d.x, y: d.y, t: 0, color: TEAMS[d.team].color });
          log(`${TEAMS[d.team].name}: incantation → level ${d.level} (${mates.length} drone${mates.length > 1 ? "s" : ""})`);
          continue;
        }
        // call teammates
        if (wd.tick % 4 === d.id % 4) {
          wd.broadcasts.push({ team: d.team, level: d.level, x: d.x, y: d.y, ttl: 6 });
          wd.fx.push({ kind: "wave", x: d.x, y: d.y, t: 0, color: TEAMS[d.team].color });
        }
        d.waiting++;
        if (d.waiting < 40) continue; // stay and wait
        d.waiting = 0;
      }
      // choose a target: food if hungry, a broadcast from a teammate, else the nearest useful stone
      let target: { x: number; y: number } | null = null;
      const call = wd.broadcasts.find((b) => b.team === d.team && b.level === d.level && (b.x !== d.x || b.y !== d.y));
      if (d.food < 8) target = nearest(d, (t) => t[0] > 0);
      else if (call && !hasStones) target = call;
      else target = nearest(d, (t) => t.some((n, r) => r > 0 && n > 0 && d.inv[r] < req[r]));
      d.target = target;
      // move one tile (the Forward / Left / Right commands)
      if (target) {
        const dx = tdist(d.x, target.x, W), dy = tdist(d.y, target.y, H);
        if (dx !== 0 && (Math.abs(dx) >= Math.abs(dy) || dy === 0)) d.dir = dx > 0 ? 0 : 2;
        else if (dy !== 0) d.dir = dy > 0 ? 1 : 3;
      } else if (Math.random() < 0.3) d.dir = (d.dir + (Math.random() < 0.5 ? 1 : 3)) % 4;
      if (!target || target.x !== d.x || target.y !== d.y) {
        d.x = wrap(d.x + [1, 0, -1, 0][d.dir], W);
        d.y = wrap(d.y + [0, 1, 0, -1][d.dir], H);
      }
    }
    // fork: teams with few drones lay an egg
    TEAMS.forEach((tm, t) => {
      const alive = wd.drones.filter((d) => d.team === t);
      if (alive.length < 6 && Math.random() < 0.02) {
        const parent = alive[Math.floor(Math.random() * alive.length)];
        wd.addDrone(t, parent?.x, parent?.y);
        wd.fx.push({ kind: "egg", x: parent?.x ?? 0, y: parent?.y ?? 0, t: 0, color: tm.color });
      }
    });
    force((n) => n + 1);

    function nearest(d: Drone, ok: (t: number[]) => boolean) {
      let best: { x: number; y: number } | null = null, bd = 1e9;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!ok(wd.tiles[y * W + x])) continue;
        const dist = Math.abs(tdist(d.x, x, W)) + Math.abs(tdist(d.y, y, H));
        if (dist < bd) { bd = dist; best = { x, y }; }
      }
      return best;
    }
  };

  useAnimationFrame((dt) => {
    const c = canvasRef.current!;
    const [w, h] = fitCanvas(c);
    const ctx = c.getContext("2d")!;
    const wd = world.current;
    const period = 0.28 / freqRef.current;
    clock.current.acc += dt;
    while (clock.current.acc > period) { clock.current.acc -= period; simTick(); }
    const k = clock.current.acc / period;

    const panel = w > 520 ? 150 : 0;
    const cs = Math.floor(Math.min((w - panel - 16) / W, (h - 16) / H));
    const ox = Math.floor((w - panel - cs * W) / 2), oy = Math.floor((h - cs * H) / 2);
    geom.current = { ox, oy, cs };
    ctx.fillStyle = "#0a0906"; ctx.fillRect(0, 0, w, h);
    // tiles + resources
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = ox + x * cs, py = oy + y * cs;
      ctx.fillStyle = (x + y) % 2 ? "#17160f" : "#1b1a12";
      if (hover && hover.x === x && hover.y === y) ctx.fillStyle = "#2a2818";
      ctx.fillRect(px, py, cs - 1, cs - 1);
      const t = wd.tiles[y * W + x];
      let i = 0;
      t.forEach((n, r) => {
        for (let j = 0; j < Math.min(n, 3); j++, i++) {
          const a = i * 2.39996, rr = cs * 0.12 + (i % 3) * cs * 0.1;
          ctx.fillStyle = RES_COLORS[r];
          ctx.globalAlpha = r === 0 ? 0.55 : 0.9;
          ctx.beginPath();
          ctx.arc(px + cs / 2 + Math.cos(a) * rr, py + cs / 2 + Math.sin(a) * rr, Math.max(1.2, cs * (r === 0 ? 0.05 : 0.065)), 0, 7);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    }
    // effects
    wd.fx = wd.fx.filter((f) => (f.t += dt) < 1.4);
    for (const f of wd.fx) {
      const cx = ox + (f.x + 0.5) * cs, cy = oy + (f.y + 0.5) * cs, p = f.t / 1.4;
      ctx.strokeStyle = f.color; ctx.globalAlpha = 1 - p;
      if (f.kind === "wave") { ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, cs * (0.4 + p * 3), 0, 7); ctx.stroke(); }
      if (f.kind === "incant") {
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, cs * (0.3 + p * 0.6), 0, 7); ctx.stroke();
        for (let i = 0; i < 6; i++) { const a = i * 1.047 + p * 4; ctx.fillStyle = f.color; ctx.fillRect(cx + Math.cos(a) * cs * 0.6 - 1, cy + Math.sin(a) * cs * 0.6 - 1 - p * cs, 2, 2); }
      }
      if (f.kind === "death") { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 5, cy + 5); ctx.moveTo(cx + 5, cy - 5); ctx.lineTo(cx - 5, cy + 5); ctx.stroke(); }
      if (f.kind === "egg") { ctx.fillStyle = f.color; ctx.beginPath(); ctx.ellipse(cx, cy - p * 6, 3, 4, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // drones
    for (const d of wd.drones) {
      let ix = d.px + tdist(d.px, d.x, W) * Math.min(1, k * 1.6);
      let iy = d.py + tdist(d.py, d.y, H) * Math.min(1, k * 1.6);
      ix = wrap(ix, W); iy = wrap(iy, H);
      const sameTile = wd.drones.filter((o) => o.x === d.x && o.y === d.y);
      const idx = sameTile.indexOf(d);
      const off = sameTile.length > 1 ? (idx - (sameTile.length - 1) / 2) * cs * 0.18 : 0;
      const cx = ox + (ix + 0.5) * cs + off, cy = oy + (iy + 0.5) * cs + off * 0.5;
      const r = cs * (0.2 + d.level * 0.02);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(d.dir * Math.PI / 2);
      ctx.fillStyle = TEAMS[d.team].color;
      ctx.beginPath(); ctx.moveTo(r, 0); ctx.lineTo(-r * 0.7, -r * 0.75); ctx.lineTo(-r * 0.35, 0); ctx.lineTo(-r * 0.7, r * 0.75); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (d.incant > 0) { ctx.strokeStyle = "#fff"; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
      if (cs > 22) { ctx.font = `600 ${Math.max(8, cs * 0.22)}px 'JetBrains Mono', monospace`; ctx.fillStyle = "#fff"; ctx.fillText(String(d.level), cx + r * 0.6, cy - r * 0.6); }
    }
    // side panel
    if (panel) {
      const px = w - panel;
      ctx.fillStyle = "#0f0e09"; ctx.fillRect(px, 0, panel, h);
      ctx.font = "600 10px 'JetBrains Mono', monospace"; ctx.fillStyle = "#a8a29e";
      ctx.fillText(`tick ${wd.tick} · f=${Math.round(100 * freqRef.current)}`, px + 10, 44);
      TEAMS.forEach((tm, t) => {
        const ds = wd.drones.filter((d) => d.team === t);
        const max = ds.reduce((m, d) => Math.max(m, d.level), 0);
        const y = 66 + t * 42;
        ctx.fillStyle = tm.color; ctx.fillRect(px + 10, y - 8, 8, 8);
        ctx.fillStyle = "#e7e5e4"; ctx.fillText(tm.name, px + 24, y);
        ctx.fillStyle = "#a8a29e"; ctx.fillText(`${ds.length} drones · lvl ${max}`, px + 10, y + 14);
        for (let l = 0; l < 8; l++) { ctx.fillStyle = l < max ? tm.color : "#292524"; ctx.fillRect(px + 10 + l * 15, y + 20, 12, 3); }
      });
      ctx.font = "9px 'JetBrains Mono', monospace";
      RES.forEach((r, i) => { const y = 206 + i * 13; if (y > h - 10) return; ctx.fillStyle = RES_COLORS[i]; ctx.beginPath(); ctx.arc(px + 14, y - 3, 3, 0, 7); ctx.fill(); ctx.fillStyle = "#a8a29e"; ctx.fillText(r, px + 24, y); });
    }
    // hovered tile details
    if (hover) {
      const t = wd.tiles[hover.y * W + hover.x];
      const here = wd.drones.filter((d) => d.x === hover.x && d.y === hover.y);
      const lines = [`bct ${hover.x} ${hover.y} ${t.join(" ")}`, ...here.slice(0, 3).map((d) => `#${d.id} ${TEAMS[d.team].name} L${d.level} food ${d.food}`)];
      ctx.font = "10px 'JetBrains Mono', monospace";
      const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12;
      ctx.fillStyle = "rgba(0,0,0,.8)"; ctx.fillRect(8, h - 10 - lines.length * 13, bw, lines.length * 13 + 4);
      lines.forEach((l, i) => { ctx.fillStyle = i ? "#e7e5e4" : accent; ctx.fillText(l, 14, h - 10 - (lines.length - 1 - i) * 13 - 1); });
    }
  }, running);

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const { ox, oy, cs } = geom.current;
    const x = Math.floor((e.clientX - r.left - ox) / cs), y = Math.floor((e.clientY - r.top - oy) / cs);
    setHover(x >= 0 && y >= 0 && x < W && y < H ? { x, y } : null);
  };

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} role="img" aria-label="2D simulation of a Zappy match: drones forage, broadcast and gather for incantations" className="h-full w-full" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      <div className="pointer-events-none absolute top-2 left-2 max-w-[70%] font-mono text-[12px] leading-snug text-stone-300">
        {world.current.log.slice(-2).map((l, i) => <div key={i} className="truncate rounded bg-black/60 px-1.5 py-0.5 mb-0.5">{l}</div>)}
      </div>
      <div className="absolute right-2 bottom-2 flex gap-1">
        {[1, 2, 4].map((f) => (
          <button key={f} onClick={() => setFreq(f)} className="rounded px-2 py-1 font-mono text-[12px] text-white/90" style={{ background: freq === f ? `${accent}66` : "rgba(0,0,0,.6)" }}>
            ×{f}
          </button>
        ))}
        <button onClick={() => { world.current = createWorld(); }} className="rounded bg-black/60 px-2 py-1 font-mono text-[12px] text-white/90">reset</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recorded match: the real zappy_gui (raylib 3D) on a 12×10 map, two teams of
// six Python AIs. The broadcast feed shows their rally protocol
// (HAVE / RALLY / COMING / READY) before each incantation.
// ---------------------------------------------------------------------------

const ZV = `${import.meta.env.BASE_URL}projects/zappy/`;

function Recorded({ running }: DemoProps) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!v.current) return;
    if (running) v.current.play().catch(() => {});
    else v.current.pause();
  }, [running]);
  return (
    <div className="relative h-full w-full bg-black">
      <video ref={v} src={`${ZV}zappy_demo.mp4`} poster={`${ZV}zappy_poster.jpg`} muted loop playsInline controls aria-label="Recorded Zappy match seen from above: 12 AI clients in two teams on the whole 12 by 10 map" autoPlay={running} className="h-full w-full object-contain" />
      <div className="pointer-events-none absolute right-2 bottom-1.5 font-mono text-[12px] text-white/60">
        zappy_server · zappy_gui · 12 × zappy_ai (2 teams)
      </div>
    </div>
  );
}

export default function Zappy(props: DemoProps) {
  const [tab, setTab] = useState<"video" | "sim">("video");
  return (
    <div className="relative h-full w-full">
      {tab === "video" ? <Recorded {...props} /> : <ZappySim {...props} />}
      <div className="absolute top-2 right-2 flex overflow-hidden rounded border border-white/15 font-mono text-[12px]">
        {(["video", "sim"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-2 py-1 text-white/90" style={{ background: tab === t ? `${props.accent}66` : "rgba(0,0,0,.6)" }}>
            {t === "video" ? "Recorded match" : "2D simulation"}
          </button>
        ))}
      </div>
    </div>
  );
}
