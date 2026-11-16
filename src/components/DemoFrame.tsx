import { Suspense, lazy, useEffect, useState, type ComponentType } from "react";
import type { DemoId, Identity } from "../data";
import { Corners } from "./hud";
import { useInView } from "../hooks";

export type DemoProps = { running: boolean; accent: string };

const demos: Record<DemoId, React.LazyExoticComponent<ComponentType<DemoProps>>> = {
  wolf3d: lazy(() => import("../demos/Wolf3D")),
  raytracer: lazy(() => import("../demos/Raytracer")),
  lander: lazy(() => import("../demos/Lander")),
  arcade: lazy(() => import("../demos/Arcade")),
  zappy: lazy(() => import("../demos/Zappy")),
  dashboard: lazy(() => import("../demos/Dashboard")),
  sensai: lazy(() => import("../demos/SensAI")),
};

/** Mounts a demo as soon as it nears the viewport, runs it while visible, pauses it off screen. */
export default function DemoFrame({ demo, title, accent, hint, identity }: { demo: DemoId; title: string; accent: string; ink?: string; hint: string; identity?: Identity }) {
  const [started, setStarted] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>("100px");
  const Demo = demos[demo];
  useEffect(() => { if (inView) setStarted(true); }, [inView]);
  const poster = (
    <div className="absolute inset-0 grid place-items-center">
      <Poster demo={demo} accent={accent} />
      <span className="mono relative text-[13px] tracking-[0.3em] text-[var(--p)] uppercase">Establishing link…</span>
    </div>
  );
  return (
    <figure className="flex flex-col gap-3">
      <div className="relative p-2.5">
        <Corners size={22} />
        {/* top tab */}
        <div aria-hidden className="mono mb-2 flex items-center justify-between gap-3 text-[12px] tracking-[0.2em] uppercase">
          <span className="flex items-center gap-2 text-[var(--p)]">
            <span className={`h-1.5 w-1.5 rounded-full ${started && inView ? "blink bg-alert shadow-[0_0_6px_var(--color-alert)]" : "bg-ink-3"}`} />
            {started && inView ? "Live" : "Standby"} // {identity?.badge ?? "DEMO"} feed
          </span>
          <span className="truncate text-ink-3">{identity?.codename}</span>
        </div>
        <div
          ref={ref}
          data-demo
          aria-label={`${title} — live demo`}
          role="region"
          className="cut relative aspect-[16/11] w-full overflow-hidden bg-[#020406] shadow-[0_0_0_1px_color-mix(in_srgb,var(--p)_45%,transparent),0_0_60px_-20px_var(--p)]"
        >
          {started ? (
            <Suspense fallback={poster}>
              <Demo running={inView} accent={accent} />
            </Suspense>
          ) : poster}
          {started && !inView && <div className="mono absolute top-2 right-2 bg-black/70 px-2 py-0.5 text-[12px] text-[var(--p)]">PAUSED</div>}
          {/* scanline sheen over the feed */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,.035)_0_1px,transparent_1px_3px)]" />
        </div>
        {identity && (
          <div aria-hidden className="mono mt-2 flex items-center gap-3 overflow-hidden text-[12px] tracking-[0.18em] whitespace-nowrap text-ink-3 uppercase">
            <span className="text-[var(--s)]">SYS</span>
            <span className="truncate">{identity.readout}</span>
            <span className="ticks ml-auto w-24 flex-none" />
          </div>
        )}
      </div>
      <figcaption className="border-l-2 border-[var(--p)] pl-3 text-[15px] leading-relaxed text-ink-3">
        {hint}
      </figcaption>
    </figure>
  );
}

/** Static, cheap SVG previews so the page loads fast before any demo runs. */
function Poster({ demo, accent }: { demo: DemoId; accent: string }) {
  const common = "absolute inset-0 h-full w-full opacity-45";
  const svg = { "aria-hidden": true, focusable: false } as const;
  switch (demo) {
    case "wolf3d":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110" preserveAspectRatio="none">
          <rect width="160" height="55" fill="#1a0f14" />
          <rect y="55" width="160" height="55" fill="#120c0a" />
          {Array.from({ length: 40 }, (_, i) => {
            const d = Math.abs(i - 20) / 20;
            const h = 70 - d * 40 + (i % 7 === 0 ? 8 : 0);
            return <rect key={i} x={i * 4} y={55 - h / 2} width="4.2" height={h} fill={accent} opacity={0.25 + (1 - d) * 0.6} />;
          })}
        </svg>
      );
    case "raytracer":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <defs>
            <radialGradient id="rtA" cx="35%" cy="35%"><stop offset="0" stopColor="#fff" /><stop offset=".4" stopColor={accent} /><stop offset="1" stopColor="#1e1036" /></radialGradient>
            <radialGradient id="rtB" cx="35%" cy="35%"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#7c2d12" /></radialGradient>
          </defs>
          <rect width="160" height="110" fill="#0b0a14" />
          <rect y="72" width="160" height="38" fill="#14121f" />
          <ellipse cx="62" cy="80" rx="26" ry="5" fill="#000" opacity=".5" />
          <circle cx="62" cy="58" r="22" fill="url(#rtA)" />
          <circle cx="108" cy="66" r="12" fill="url(#rtB)" />
        </svg>
      );
    case "lander":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <rect width="160" height="110" fill="#04060c" />
          {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 53) % 160} cy={(i * 31) % 70} r=".5" fill="#fff" />)}
          <path d="M0 95 L30 85 L55 92 L65 88 L95 88 L110 80 L135 92 L160 86 L160 110 L0 110Z" fill="#1e293b" />
          <path d="M65 88 L95 88" stroke={accent} strokeWidth="1" />
          <g transform="translate(80 45)"><rect x="-6" y="-5" width="12" height="9" rx="2" fill={accent} /><path d="M-6 4 L-9 9 M6 4 L9 9" stroke={accent} /><path d="M-2 5 L0 12 L2 5Z" fill="#fb923c" /></g>
        </svg>
      );
    case "arcade":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <rect width="160" height="110" fill="#03140a" />
          {[[40, 50], [48, 50], [56, 50], [64, 50], [64, 58], [64, 66], [72, 66], [80, 66]].map(([x, y], i) => <rect key={i} x={x} y={y} width="7" height="7" rx="1.5" fill={accent} />)}
          <circle cx="112" cy="40" r="3.5" fill="#f87171" />
        </svg>
      );
    case "zappy":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <rect width="160" height="110" fill="#0c0b05" />
          {Array.from({ length: 11 * 8 }, (_, i) => <rect key={i} x={(i % 11) * 14 + 3} y={Math.floor(i / 11) * 13 + 3} width="13" height="12" fill="#1a1a10" />)}
          {[[20, 20, accent], [80, 50, "#38bdf8"], [120, 80, accent], [50, 70, "#38bdf8"]].map(([x, y, c], i) => <circle key={i} cx={x as number} cy={y as number} r="4" fill={c as string} />)}
        </svg>
      );
    case "dashboard":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <rect width="160" height="110" fill="#0d0a12" />
          <rect x="8" y="8" width="70" height="44" rx="5" fill="#1d1525" />
          <rect x="84" y="8" width="68" height="94" rx="5" fill="#1d1525" />
          <rect x="8" y="58" width="70" height="44" rx="5" fill="#1d1525" />
          <path d="M14 42 L26 34 L38 38 L50 24 L62 28 L72 18" stroke={accent} fill="none" strokeWidth="1.5" />
        </svg>
      );
    case "sensai":
      return (
        <svg {...svg} className={common} viewBox="0 0 160 110">
          <rect width="160" height="110" fill="#05100f" />
          {[18, 30, 42, 54, 66].map((y, i) => <rect key={y} x="10" y={y} width={[40, 110, 70, 120, 50][i]} height="4" rx="2" fill={i % 2 ? "#334155" : accent} />)}
        </svg>
      );
  }
}
