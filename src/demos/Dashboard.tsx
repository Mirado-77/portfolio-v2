import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { GITHUB_USER } from "../data";

/*
 * A miniature of the Dashboard project: widget instances with their own refresh
 * timer, live public services (Open-Meteo, Binance, GitHub) and a bento grid you
 * can rearrange by drag-and-drop (or with the keyboard: focus a widget, Alt+←/→).
 */

type WidgetId = "weather" | "forecast" | "crypto" | "commits" | "clock";
const LAYOUT: Record<WidgetId, string> = {
  weather: "col-span-1 row-span-1",
  clock: "col-span-1 row-span-1",
  crypto: "col-span-2 row-span-2",
  forecast: "col-span-1 row-span-1",
  commits: "col-span-1 row-span-2",
};

function useWidgetData<T>(fetcher: () => Promise<T>, fallback: T, everyS: number, running: boolean) {
  const [data, setData] = useState<T>(fallback);
  const [live, setLive] = useState<boolean | null>(null);
  const [left, setLeft] = useState(everyS);
  const f = useRef(fetcher); f.current = fetcher;
  const refresh = useCallback(async () => {
    setLeft(everyS);
    try { setData(await f.current()); setLive(true); } catch { setLive(false); }
  }, [everyS]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { refresh(); return everyS; } return l - 1; }), 1000);
    return () => clearInterval(id);
  }, [running, everyS, refresh]);
  return { data, live, left, refresh, every: everyS };
}

const WMO: Record<number, [string, string]> = {
  0: ["☀️", "Clear"], 1: ["🌤️", "Mainly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁️", "Overcast"], 45: ["🌫️", "Fog"], 48: ["🌫️", "Fog"],
  51: ["🌦️", "Drizzle"], 53: ["🌦️", "Drizzle"], 55: ["🌦️", "Drizzle"], 61: ["🌧️", "Rain"], 63: ["🌧️", "Rain"], 65: ["🌧️", "Heavy rain"],
  71: ["🌨️", "Snow"], 73: ["🌨️", "Snow"], 75: ["❄️", "Heavy snow"], 80: ["🌦️", "Showers"], 81: ["🌧️", "Showers"], 82: ["⛈️", "Violent showers"], 95: ["⛈️", "Thunderstorm"],
};
const wmo = (c: number) => WMO[c] ?? ["🌡️", "—"];

type Weather = { temp: number; code: number; wind: number; days: { d: string; max: number; min: number; code: number }[] };
const weatherFallback: Weather = { temp: 9, code: 3, wind: 14, days: [{ d: "Sat", max: 11, min: 5, code: 3 }, { d: "Sun", max: 12, min: 6, code: 61 }, { d: "Mon", max: 10, min: 4, code: 2 }, { d: "Tue", max: 9, min: 3, code: 0 }] };
async function fetchWeather(): Promise<Weather> {
  const r = await fetch("https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe%2FParis&forecast_days=4");
  if (!r.ok) throw new Error();
  const j = await r.json();
  return {
    temp: j.current.temperature_2m, code: j.current.weather_code, wind: j.current.wind_speed_10m,
    days: j.daily.time.map((t: string, i: number) => ({ d: new Date(t).toLocaleDateString("en-GB", { weekday: "short" }), max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i], code: j.daily.weather_code[i] })),
  };
}

type Crypto = { price: number; change: number; closes: { t: number; c: number }[] };
const cryptoFallback: Crypto = { price: 0, change: 0, closes: Array.from({ length: 30 }, (_, i) => ({ t: Date.now() - (29 - i) * 864e5, c: 60000 + Math.sin(i / 3) * 3000 + i * 150 })) };
async function fetchCrypto(): Promise<Crypto> {
  const [t, k] = await Promise.all([
    fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCEUR").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    fetch("https://api.binance.com/api/v3/klines?symbol=BTCEUR&interval=1d&limit=30").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
  ]);
  return { price: +t.lastPrice, change: +t.priceChangePercent, closes: (k as unknown[][]).map((row) => ({ t: row[0] as number, c: +(row[4] as string) })) };
}

type Commit = { sha: string; msg: string; date: string; repo: string };
const commitsFallback: Commit[] = [{ sha: "a1b2c3d", msg: "feat(widgets): bento grid layout", date: new Date().toISOString(), repo: "dashboard" }];
async function fetchCommits(): Promise<Commit[]> {
  const r = await fetch(`https://api.github.com/repos/${GITHUB_USER}/dashboard/commits?per_page=4`);
  if (!r.ok) throw new Error();
  const j = await r.json();
  return j.map((c: { sha: string; commit: { message: string; author: { date: string } } }) => ({ sha: c.sha.slice(0, 7), msg: c.commit.message.split("\n")[0], date: c.commit.author.date, repo: "dashboard" }));
}

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

function Card({ title, service, live, left, every, onRefresh, children, accent, dragProps }: {
  title: string; service: string; live?: boolean | null; left?: number; every?: number; onRefresh?: () => void; children: ReactNode; accent: string;
  dragProps: React.HTMLAttributes<HTMLDivElement> & { draggable: boolean };
}) {
  const p = left !== undefined && every ? left / every : 1;
  return (
    <div {...dragProps} className={`group flex h-full min-h-0 cursor-grab flex-col rounded-lg border border-white/10 bg-white/[0.04] p-2.5 active:cursor-grabbing ${dragProps.className ?? ""}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-semibold text-white/90">{title}</p>
          <p className="truncate text-[12px] text-white/45">{service}{live === false && " · offline sample"}</p>
        </div>
        {onRefresh && (
          <button onClick={onRefresh} title={`Refreshes every ${every}s — click to refresh now`} className="relative grid h-5 w-5 flex-none place-items-center" aria-label={`Refresh ${title}`}>
            <svg viewBox="0 0 20 20" className="absolute inset-0 -rotate-90">
              <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="2" />
              <circle cx="10" cy="10" r="8" fill="none" stroke={accent} strokeWidth="2" strokeDasharray={`${p * 50.3} 50.3`} />
            </svg>
            <span className="text-[8px] text-white/70">↻</span>
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

function Sparkline({ points, accent }: { points: { t: number; c: number }[]; accent: string }) {
  const [hi, setHi] = useState<number | null>(null);
  const W = 300, H = 60;
  const min = Math.min(...points.map((p) => p.c)), max = Math.max(...points.map((p) => p.c));
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - 4 - ((v - min) / (max - min || 1)) * (H - 8);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.c).toFixed(1)}`).join("");
  return (
    <div className="relative h-full">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full"
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHi(Math.round(((e.clientX - r.left) / r.width) * (points.length - 1))); }}
        onPointerLeave={() => setHi(null)}>
        <path d={`${d}L${W} ${H}L0 ${H}Z`} fill={accent} opacity=".12" />
        <path d={d} fill="none" stroke={accent} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {hi !== null && <line x1={x(hi)} x2={x(hi)} y1="0" y2={H} stroke="rgba(255,255,255,.35)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {hi !== null && points[hi] && (
        <div className="pointer-events-none absolute top-0 right-0 rounded bg-black/80 px-1.5 py-0.5 text-[12px] text-white">
          {new Date(points[hi].t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · €{Math.round(points[hi].c).toLocaleString("en-GB")}
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ running, accent }: DemoProps) {
  const [order, setOrder] = useState<WidgetId[]>(["weather", "clock", "crypto", "forecast", "commits"]);
  const [dragging, setDragging] = useState<WidgetId | null>(null);
  const [now, setNow] = useState(new Date());
  const weather = useWidgetData(fetchWeather, weatherFallback, 120, running);
  const crypto = useWidgetData(fetchCrypto, cryptoFallback, 60, running);
  const commits = useWidgetData(fetchCommits, commitsFallback, 300, running);
  useEffect(() => { if (!running) return; const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, [running]);

  const move = (id: WidgetId, to: number) => setOrder((o) => { const n = o.filter((x) => x !== id); n.splice(Math.max(0, Math.min(n.length, to)), 0, id); return n; });
  const dragProps = (id: WidgetId) => ({
    draggable: true,
    tabIndex: 0,
    "aria-label": `${id} widget. Alt + arrow keys to move.`,
    onDragStart: (e: React.DragEvent) => { setDragging(id); e.dataTransfer.effectAllowed = "move"; },
    onDragEnd: () => setDragging(null),
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); if (dragging && dragging !== id) move(dragging, order.indexOf(id)); },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(id, order.indexOf(id) - 1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(id, order.indexOf(id) + 1); }
    },
    className: dragging === id ? "opacity-40" : "",
  });

  const widgets: Record<WidgetId, ReactNode> = {
    weather: (
      <Card title="City temperature" service="Weather · Paris" {...weather} onRefresh={weather.refresh} accent={accent} dragProps={dragProps("weather")}>
        <div className="flex h-full items-center gap-2">
          <span className="text-3xl">{wmo(weather.data.code)[0]}</span>
          <div>
            <p className="text-2xl font-semibold text-white">{Math.round(weather.data.temp)}°</p>
            <p className="text-[12px] text-white/55">{wmo(weather.data.code)[1]} · {Math.round(weather.data.wind)} km/h</p>
          </div>
        </div>
      </Card>
    ),
    clock: (
      <Card title="Today" service="Clock · Europe/Paris" accent={accent} dragProps={dragProps("clock")}>
        <div className="flex h-full flex-col justify-center">
          <p className="font-mono text-2xl font-semibold text-white tabular-nums">{now.toLocaleTimeString("en-GB", { timeZone: "Europe/Paris" })}</p>
          <p className="text-[12px] text-white/55">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" })}</p>
        </div>
      </Card>
    ),
    crypto: (
      <Card title="Price history · BTC/EUR" service="Crypto markets · Binance" {...crypto} onRefresh={crypto.refresh} accent={accent} dragProps={dragProps("crypto")}>
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex-none">
            <p className="text-lg font-semibold text-white tabular-nums">{crypto.data.price ? `€${Math.round(crypto.data.price).toLocaleString("en-GB")}` : "—"}</p>
            <p className={`text-[12px] ${crypto.data.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>{crypto.data.change >= 0 ? "▲" : "▼"} {Math.abs(crypto.data.change).toFixed(2)}% 24h</p>
            <p className="mt-1 text-[12px] text-white/40">30 days</p>
          </div>
          <div className="min-w-0 flex-1"><Sparkline points={crypto.data.closes} accent={accent} /></div>
        </div>
      </Card>
    ),
    forecast: (
      <Card title="Forecast" service="Weather · 4 days" {...weather} onRefresh={weather.refresh} accent={accent} dragProps={dragProps("forecast")}>
        <ul className="grid h-full grid-cols-4 items-center text-center">
          {weather.data.days.map((d) => (
            <li key={d.d}>
              <p className="text-[12px] text-white/55">{d.d}</p>
              <p className="text-base">{wmo(d.code)[0]}</p>
              <p className="text-[12px] text-white/80">{Math.round(d.max)}°<span className="text-white/40">/{Math.round(d.min)}°</span></p>
            </li>
          ))}
        </ul>
      </Card>
    ),
    commits: (
      <Card title="Last commits" service={`GitHub · ${GITHUB_USER}/dashboard`} {...commits} onRefresh={commits.refresh} accent={accent} dragProps={dragProps("commits")}>
        <ul className="h-full space-y-2 overflow-hidden">
          {commits.data.slice(0, 4).map((c) => (
            <li key={c.sha} className="text-[12px] leading-tight">
              <p className="line-clamp-2 text-white/80">{c.msg}</p>
              <p className="mt-0.5"><span className="font-mono" style={{ color: accent }}>{c.sha}</span> <span className="text-white/40">· {ago(c.date)}</span></p>
            </li>
          ))}
        </ul>
      </Card>
    ),
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-br from-[#140d18] to-[#0b0a10] p-2.5 sm:p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-white">My dashboard</p>
        <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[12px] text-white/50">⌘K</span>
      </div>
      <div className="grid min-h-0 flex-1 grid-flow-dense grid-cols-3 grid-rows-[1fr_1fr_1fr] gap-2">
        {order.map((id) => <div key={id} className={`min-h-0 ${LAYOUT[id]}`}>{widgets[id]}</div>)}
      </div>
    </div>
  );
}
