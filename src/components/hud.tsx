import { useEffect, useState, type ReactNode } from "react";

/* Small HUD instruments. All decorative ones are aria-hidden; colors come from --p / --s. */

/** Live clock, Paris time, HH:MM:SS. */
export function Clock({ className = "" }: { className?: string }) {
  const fmt = () => new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Paris", hour12: false });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={`mono tabular-nums ${className}`}>{t}</span>;
}

/** Four corner brackets around the parent (which must be positioned). */
export function Corners({ size = 14, color = "var(--p)", inset = 0 }: { size?: number; color?: string; inset?: number }) {
  const b = `2px solid ${color}`;
  const base = { position: "absolute", width: size, height: size, pointerEvents: "none" } as const;
  return (
    <span aria-hidden>
      <span style={{ ...base, top: inset, left: inset, borderTop: b, borderLeft: b }} />
      <span style={{ ...base, top: inset, right: inset, borderTop: b, borderRight: b }} />
      <span style={{ ...base, bottom: inset, left: inset, borderBottom: b, borderLeft: b }} />
      <span style={{ ...base, bottom: inset, right: inset, borderBottom: b, borderRight: b }} />
    </span>
  );
}

/** Segmented ring gauge with a value in the middle (the "23%" instrument). */
export function RingGauge({ value, label, display, size = 120, color = "var(--p)", accent = "var(--s)" }: { value: number; label: string; display?: string; size?: number; color?: string; accent?: string }) {
  const r = 42, c = 2 * Math.PI * r;
  const segs = 48;
  return (
    <figure className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <g className="spin-r" style={{ ["--dur" as string]: "40s" }}>
          {Array.from({ length: segs }, (_, i) => {
            const a = (i / segs) * Math.PI * 2;
            const on = i / segs < value;
            return <line key={i} x1={50 + Math.cos(a) * 47} y1={50 + Math.sin(a) * 47} x2={50 + Math.cos(a) * 49.5} y2={50 + Math.sin(a) * 49.5} stroke={on ? color : "currentColor"} strokeWidth="1.2" opacity={on ? 1 : 0.25} />;
          })}
        </g>
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="3" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${c * value} ${c}`} transform="rotate(-90 50 50)" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        <circle cx="50" cy="50" r="34" fill="none" stroke={accent} strokeOpacity=".6" strokeWidth=".6" strokeDasharray="2 4" className="spin" />
      </svg>
      <figcaption className="relative text-center">
        <span className="display block text-2xl leading-none text-ink tabular-nums" style={{ textShadow: `0 0 12px ${color}` }}>{display ?? `${Math.round(value * 100)}%`}</span>
        <span className="mono mt-1 block text-[12px] tracking-[0.2em] text-ink-3 uppercase">{label}</span>
      </figcaption>
    </figure>
  );
}

/** Hexagonal badge with a short code. */
export function HexBadge({ text, size = 72, color = "var(--p)", sub }: { text: string; size?: number; color?: string; sub?: string }) {
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size * 1.1 }} aria-hidden>
      <svg viewBox="0 0 100 110" className="absolute inset-0 h-full w-full">
        <path d="M50 3 L95 28 L95 82 L50 107 L5 82 L5 28 Z" fill="color-mix(in srgb, currentColor 6%, transparent)" stroke={color} strokeWidth="2" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
        <path d="M50 13 L86 33 L86 77 L50 97 L14 77 L14 33 Z" fill="none" stroke={color} strokeOpacity=".4" strokeWidth="1" strokeDasharray="3 3" />
      </svg>
      <span className="relative text-center leading-none">
        <span className="display block text-[19px]" style={{ color }}>{text}</span>
        {sub && <span className="mono mt-1 block text-[8px] tracking-[0.2em] text-ink-3">{sub}</span>}
      </span>
    </span>
  );
}

/** Heart-beat line. */
export function Wave({ className = "", color = "var(--s)" }: { className?: string; color?: string }) {
  const d = "M0 30 L40 30 L50 30 L56 10 L64 50 L72 22 L78 34 L84 30 L130 30 L138 30 L144 6 L152 54 L160 26 L166 32 L200 30";
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeOpacity=".25" strokeWidth="1" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" className="wave" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

/** Equalizer bars. */
export function Bars({ n = 14, className = "" }: { n?: number; className?: string }) {
  return (
    <span aria-hidden className={`flex items-end gap-[3px] ${className}`}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="pulse w-[3px] bg-[var(--p)]" style={{ height: `${20 + ((i * 37) % 80)}%`, animationDelay: `${(i * 130) % 900}ms`, opacity: 0.4 + ((i * 17) % 60) / 100 }} />
      ))}
    </span>
  );
}

/** Big rotating targeting reticle. Children sit in the middle. */
export function Reticle({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <filter id="rg"><feGaussianBlur stdDeviation="1.4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g filter="url(#rg)">
          <g className="spin" style={{ ["--dur" as string]: "60s" }}>
            {Array.from({ length: 120 }, (_, i) => {
              const a = (i / 120) * Math.PI * 2, long = i % 10 === 0;
              return <line key={i} x1={200 + Math.cos(a) * 188} y1={200 + Math.sin(a) * 188} x2={200 + Math.cos(a) * (long ? 176 : 183)} y2={200 + Math.sin(a) * (long ? 176 : 183)} stroke="var(--p)" strokeWidth={long ? 1.5 : 0.8} opacity={long ? 0.9 : 0.45} />;
            })}
          </g>
          <circle cx="200" cy="200" r="168" fill="none" stroke="var(--p)" strokeWidth="1" strokeDasharray="80 20 6 20" className="spin-r" style={{ ["--dur" as string]: "36s" }} />
          <circle cx="200" cy="200" r="150" fill="none" stroke="var(--s)" strokeWidth="3" strokeDasharray="40 260 20 620" className="spin" style={{ ["--dur" as string]: "14s" }} />
          <circle cx="200" cy="200" r="132" fill="none" stroke="var(--p)" strokeOpacity=".35" strokeWidth="1" />
          <path d="M200 6 L200 40 M200 360 L200 394 M6 200 L40 200 M360 200 L394 200" stroke="var(--p)" strokeWidth="1.5" />
          <path d="M70 70 L90 70 M70 70 L70 90 M330 70 L310 70 M330 70 L330 90 M70 330 L90 330 M70 330 L70 310 M330 330 L310 330 M330 330 L330 310" stroke="var(--s)" strokeWidth="2" fill="none" />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** "LABEL ............ VALUE" readout row. */
export function Readout({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[104px_1fr] items-baseline gap-3 border-b border-dotted border-[color-mix(in_srgb,var(--p)_30%,transparent)] py-2 last:border-b-0">
      <dt className="mono text-[13px] tracking-[0.12em] text-ink-3 uppercase">{k}</dt>
      <dd className="text-[16px] leading-snug text-ink">{v}</dd>
    </div>
  );
}
