import { useEffect, useRef, useState } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { fitCanvas, useAnimationFrame, useKeys } from "../hooks";
import { DT, PAD, WORLD_W, heuristic, observe, reset, step, type LanderState } from "./lander-sim";

type Mode = "heuristic" | "random" | "manual";
type Particle = { x: number; y: number; vx: number; vy: number; life: number };

function LiveSim({ running, accent }: DemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("heuristic");
  const [wind, setWind] = useState(false);
  const [history, setHistory] = useState<{ ret: number; outcome: string }[]>([]);
  const modeRef = useRef(mode); modeRef.current = mode;
  const windRef = useRef(wind); windRef.current = wind;
  const sim = useRef<{ s: LanderState; acc: number; t: number; action: number; endT: number; parts: Particle[]; terrain: number[]; stars: number[][] } | null>(null);
  const keys = useKeys(wrapRef);

  const newTerrain = () => {
    const n = 11, pts: number[] = [];
    for (let i = 0; i <= n; i++) pts.push(Math.random() * 1.1 - 0.8);
    // flat helipad in the middle
    pts[5] = pts[6] = 0;
    return pts;
  };
  if (!sim.current) {
    sim.current = {
      s: reset(Math.random, wind), acc: 0, t: 0, action: 0, endT: 0, parts: [], terrain: newTerrain(),
      stars: Array.from({ length: 70 }, () => [Math.random(), Math.random(), Math.random()]),
    };
  }
  const restart = () => {
    const m = sim.current!;
    m.s = reset(Math.random, windRef.current);
    m.endT = 0;
    m.terrain = newTerrain();
  };

  useAnimationFrame((dt) => {
    const m = sim.current!, c = canvasRef.current!;
    const [w, h] = fitCanvas(c);
    const ctx = c.getContext("2d")!;
    // fixed-step simulation
    m.acc += dt;
    while (m.acc >= DT) {
      m.acc -= DT; m.t += DT;
      if (m.s.done) {
        m.endT += DT;
        if (m.endT > 1.6) restart();
        continue;
      }
      const k = keys.current;
      const md = modeRef.current;
      let a = 0;
      if (md === "heuristic") a = heuristic(m.s);
      else if (md === "random") a = m.s.steps % 4 === 0 ? Math.floor(Math.random() * 4) : m.action;
      else a = k.has("ArrowUp") || k.has("w") || k.has("z") ? 2 : k.has("ArrowLeft") || k.has("q") || k.has("a") ? 1 : k.has("ArrowRight") || k.has("d") ? 3 : 0;
      m.action = a;
      step(m.s, a, m.t);
      if (m.s.done) setHistory((hh) => [...hh.slice(-7), { ret: m.s.ret, outcome: m.s.outcome }]);
      // exhaust particles
      const s = m.s, sin = Math.sin(s.a), cos = Math.cos(s.a);
      if (a === 2) for (let i = 0; i < 3; i++) m.parts.push({ x: s.x + sin * 0.5, y: s.y - cos * 0.5, vx: sin * 6 + (Math.random() - 0.5) * 2 + s.vx, vy: -cos * 6 + (Math.random() - 0.5) * 2 + s.vy, life: 0.5 });
      if (a === 1 || a === 3) { const sd = a === 1 ? 1 : -1; m.parts.push({ x: s.x + cos * 0.45 * sd, y: s.y + sin * 0.45 * sd + 0.15, vx: cos * 4 * sd + s.vx, vy: sin * 4 * sd + s.vy, life: 0.25 }); }
    }
    for (const p of m.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    m.parts = m.parts.filter((p) => p.life > 0 && p.y > -0.5);

    // ---- render ----
    const scale = Math.min(w / WORLD_W, h / 14);
    const ox = w / 2, oy = h - 1.2 * scale;
    const X = (x: number) => ox + x * scale, Y = (y: number) => oy - y * scale;
    ctx.fillStyle = "#03050b"; ctx.fillRect(0, 0, w, h);
    for (const [sx, sy, sb] of m.stars) { ctx.fillStyle = `rgba(255,255,255,${0.25 + sb * 0.6})`; ctx.fillRect(sx * w, sy * h * 0.75, sb > 0.8 ? 1.6 : 1, sb > 0.8 ? 1.6 : 1); }
    // terrain
    ctx.beginPath(); ctx.moveTo(0, h);
    m.terrain.forEach((ty, i) => ctx.lineTo(X(-WORLD_W / 2 + (i * WORLD_W) / (m.terrain.length - 1)), Y(ty - 0.02)));
    ctx.lineTo(w, h); ctx.closePath();
    const grd = ctx.createLinearGradient(0, Y(2), 0, h); grd.addColorStop(0, "#334155"); grd.addColorStop(1, "#0f172a");
    ctx.fillStyle = grd; ctx.fill();
    // pad + flags
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(X(-PAD), Y(0)); ctx.lineTo(X(PAD), Y(0)); ctx.stroke();
    for (const fx of [-PAD, PAD]) {
      ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X(fx), Y(0)); ctx.lineTo(X(fx), Y(1)); ctx.stroke();
      ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.moveTo(X(fx), Y(1)); ctx.lineTo(X(fx + 0.5), Y(0.88)); ctx.lineTo(X(fx), Y(0.76)); ctx.fill();
    }
    // particles
    for (const p of m.parts) { const t = p.life / 0.5; ctx.fillStyle = `rgba(${255},${120 + 120 * t},${40 * t},${t})`; ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 1 + 2.5 * t, 0, 7); ctx.fill(); }
    // lander
    const s = m.s;
    ctx.save(); ctx.translate(X(s.x), Y(s.y)); ctx.rotate(-s.a); ctx.scale(scale, scale);
    ctx.lineWidth = 0.06; ctx.strokeStyle = "#e2e8f0";
    ctx.beginPath(); ctx.moveTo(-0.3, 0.1); ctx.lineTo(-0.55, 0.55); ctx.moveTo(0.3, 0.1); ctx.lineTo(0.55, 0.55); ctx.stroke();
    ctx.fillStyle = s.legs[0] ? "#4ade80" : "#94a3b8"; ctx.fillRect(-0.7, 0.5, 0.3, 0.08);
    ctx.fillStyle = s.legs[1] ? "#4ade80" : "#94a3b8"; ctx.fillRect(0.4, 0.5, 0.3, 0.08);
    ctx.fillStyle = s.outcome === "crashed" ? "#ef4444" : accent;
    ctx.beginPath(); ctx.roundRect(-0.42, -0.35, 0.84, 0.6, 0.12); ctx.fill();
    ctx.fillStyle = "#0b1220"; ctx.beginPath(); ctx.arc(0, -0.08, 0.14, 0, 7); ctx.fill();
    ctx.fillStyle = "#cbd5e1"; ctx.fillRect(-0.15, 0.25, 0.3, 0.12);
    ctx.restore();

    // HUD: observation vector + action, like the Gymnasium env
    const o = observe(s);
    const labels = ["x", "y", "vx", "vy", "θ", "ω", "leg L", "leg R"];
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(8, 8, 128, 128);
    labels.forEach((l, i) => {
      ctx.fillStyle = "#94a3b8"; ctx.fillText(l, 14, 22 + i * 12);
      const v = Math.max(-1, Math.min(1, o[i]));
      ctx.fillStyle = "#1e293b"; ctx.fillRect(56, 15 + i * 12, 70, 6);
      ctx.fillStyle = accent; ctx.fillRect(91, 15 + i * 12, v * 35, 6);
    });
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`a=${m.action} ${["noop", "left", "main", "right"][m.action]}`, 14, 128);
    ctx.textAlign = "right";
    ctx.fillText(`return ${s.ret.toFixed(1)}`, w - 10, 48);
    ctx.fillStyle = "#94a3b8"; ctx.fillText(`step ${s.steps}${s.wind ? " · wind" : ""}`, w - 10, 62);
    ctx.textAlign = "left";
    if (s.done) {
      ctx.font = "600 16px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillStyle = s.outcome === "landed" ? "#4ade80" : "#f87171";
      ctx.fillText(s.outcome === "landed" ? `Landed · ${s.ret.toFixed(0)}` : s.outcome === "crashed" ? "Crashed" : "Lost", w / 2, h / 2 - 30);
      ctx.textAlign = "left";
    }
  }, running);

  return (
    <div ref={wrapRef} tabIndex={0} role="application" aria-label="Lunar lander simulation. In manual mode, up arrow fires the main engine, left and right arrows the side engines." className="relative h-full w-full outline-none">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="absolute right-2 bottom-2 left-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["heuristic", "random", "manual"] as Mode[]).map((md) => (
            <button
              key={md}
              onClick={() => { setMode(md); restart(); if (md === "manual") wrapRef.current?.focus(); }}
              className="rounded px-2 py-1 font-mono text-[12px] text-white/90"
              style={{ background: mode === md ? `${accent}66` : "rgba(0,0,0,.55)" }}
            >
              {md}
            </button>
          ))}
          <button onClick={() => { setWind((v) => !v); windRef.current = !wind; restart(); }} className="rounded px-2 py-1 font-mono text-[12px] text-white/90" style={{ background: wind ? `${accent}66` : "rgba(0,0,0,.55)" }}>
            wind
          </button>
        </div>
        <div className="flex gap-1" aria-label="Last episodes">
          {history.map((e, i) => (
            <span key={i} title={`${e.outcome} ${e.ret.toFixed(1)}`} className="rounded bg-black/55 px-1.5 py-0.5 font-mono text-[12px]" style={{ color: e.outcome === "landed" ? "#4ade80" : "#f87171" }}>
              {e.ret.toFixed(0)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recorded runs: the real evaluation videos from start-trek/assets/videos,
// with the score of each episode from logs/{eval,train}/*.csv.
// ---------------------------------------------------------------------------

const VID = `${import.meta.env.BASE_URL}projects/start-trek/`;
type Ep = { ep: number; score: number; end: string };
const RUNS: { id: string; label: string; file: string; note: string; mean?: number; eps: Ep[] }[] = [
  { id: "random", label: "Random", file: "random_eval", mean: -174.8, note: "Uniform random actions — the floor.",
    eps: [{ ep: 0, score: -351.16, end: "crash" }, { ep: 30, score: -120.66, end: "crash" }, { ep: 60, score: -139.74, end: "crash" }, { ep: 90, score: -391.56, end: "out_of_view" }] },
  { id: "heuristic", label: "Heuristic", file: "heuristic_eval", mean: 244.0, note: "Hand-tuned PD controller (Gymnasium reference).",
    eps: [{ ep: 0, score: 255.99, end: "landed" }, { ep: 30, score: -100.66, end: "crash" }, { ep: 60, score: 257.18, end: "landed" }, { ep: 90, score: 289.19, end: "landed" }] },
  { id: "dqn", label: "DQN", file: "dqn_eval", mean: 216.8, note: "MLP Q-network, replay buffer, target network, greedy at eval.",
    eps: [{ ep: 0, score: 262.09, end: "landed" }, { ep: 30, score: 254.49, end: "landed" }, { ep: 60, score: 273.69, end: "landed" }, { ep: 90, score: -27.7, end: "crash" }] },
  { id: "ddqn_wind", label: "Double DQN + wind", file: "ddqn_wind_eval", mean: 179.5, note: "Double DQN trained and evaluated with wind perturbation.",
    eps: [{ ep: 0, score: 27.27, end: "crash" }, { ep: 30, score: 262.17, end: "landed" }, { ep: 60, score: 222.26, end: "landed" }, { ep: 90, score: 232.64, end: "landed" }] },
  { id: "td3", label: "TD3", file: "td3_eval", mean: 236.9, note: "Continuous-action actor-critic (bonus) — the best learned agent.",
    eps: [{ ep: 0, score: 200.27, end: "landed" }, { ep: 30, score: 203.26, end: "landed" }, { ep: 60, score: 243.45, end: "landed" }, { ep: 90, score: 285.01, end: "landed" }] },
  { id: "dqn_train", label: "DQN training", file: "dqn_train", note: "The same DQN while it learns: episode 0 → 750.",
    eps: [{ ep: 0, score: -351.59, end: "crash" }, { ep: 150, score: 27.18, end: "crash" }, { ep: 300, score: 97.1, end: "out_of_time" }, { ep: 450, score: 266.94, end: "landed" }, { ep: 600, score: 204.62, end: "landed" }, { ep: 750, score: 283.14, end: "landed" }] },
];

function Recorded({ running, accent }: DemoProps) {
  const [run, setRun] = useState(RUNS[4].id);
  const [i, setI] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const r = RUNS.find((x) => x.id === run)!;
  const ep = r.eps[i % r.eps.length];

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (running) v.play().catch(() => {});
    else v.pause();
  }, [running, run, i]);

  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="flex flex-wrap gap-1 p-2 pr-40">
        {RUNS.map((x) => (
          <button
            key={x.id}
            onClick={() => { setRun(x.id); setI(0); }}
            className="rounded px-2 py-1 font-mono text-[12px] text-white/90 sm:text-[12px]"
            style={{ background: run === x.id ? `${accent}66` : "rgba(255,255,255,.08)" }}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="relative min-h-0 flex-1">
        <video
          ref={video}
          key={`${r.file}_${ep.ep}`}
          src={`${VID}${r.file}_${ep.ep}.mp4`}
          muted
          playsInline
          controls
          aria-label={`${r.label}, episode ${ep.ep}: return ${ep.score.toFixed(1)}, ${ep.end.replace(/_/g, " ")}`}
          autoPlay={running}
          onEnded={() => setI((n) => (n + 1) % r.eps.length)}
          className="h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute top-2 left-2 rounded bg-black/70 px-2 py-1 font-mono text-[12px] leading-relaxed text-white/85">
          <div><span style={{ color: accent }}>{r.label}</span> · episode {ep.ep}</div>
          <div>
            return <span className="text-white">{ep.score.toFixed(1)}</span> ·{" "}
            <span style={{ color: ep.end === "landed" ? "#4ade80" : "#f87171" }}>{ep.end.replace(/_/g, " ")}</span>
          </div>
          {r.mean !== undefined && <div className="text-white/60">mean over 100 eps: {r.mean.toFixed(1)}</div>}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <p className="truncate font-mono text-[12px] text-white/55">{r.note}</p>
        <div className="flex flex-none gap-1">
          {r.eps.map((e, n) => (
            <button
              key={e.ep}
              onClick={() => setI(n)}
              title={`episode ${e.ep}: ${e.score.toFixed(1)}`}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: n === i % r.eps.length ? (e.end === "landed" ? "#4ade80" : "#f87171") : "rgba(255,255,255,.2)" }}
              aria-label={`Play episode ${e.ep}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Lander(props: DemoProps) {
  const [tab, setTab] = useState<"video" | "sim">("video");
  return (
    <div className="relative h-full w-full">
      {tab === "video" ? <Recorded {...props} /> : <LiveSim {...props} />}
      <div className="absolute top-2 right-2 flex overflow-hidden rounded border border-white/15 font-mono text-[12px]">
        {(["video", "sim"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-2 py-1 text-white/90" style={{ background: tab === t ? `${props.accent}66` : "rgba(0,0,0,.6)" }}>
            {t === "video" ? "Recorded runs" : "Try it live"}
          </button>
        ))}
      </div>
    </div>
  );
}
