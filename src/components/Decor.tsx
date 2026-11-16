import type { Motif } from "../data";

/** Background linework that gives each project section its own visual signature. */
export default function Decor({ motif, name }: { motif: Motif; name: string }) {
  const svg = { className: "absolute inset-0 h-full w-full", viewBox: "0 0 1600 1000", preserveAspectRatio: "xMidYMid slice" } as const;
  const stroke = { stroke: "var(--p)", fill: "none" } as const;
  let art: React.ReactNode = null;
  switch (motif) {
    case "corridor": // raycaster columns converging on a vanishing point
      art = (
        <svg {...svg}>
          <g {...stroke} strokeOpacity=".22">
            {Array.from({ length: 22 }, (_, i) => <line key={i} x1="800" y1="500" x2={-400 + i * 114} y2="1000" />)}
            {Array.from({ length: 22 }, (_, i) => <line key={`t${i}`} x1="800" y1="500" x2={-400 + i * 114} y2="0" strokeOpacity=".5" />)}
          </g>
          <g fill="var(--p)">
            {Array.from({ length: 40 }, (_, i) => { const d = Math.abs(i - 19.5) / 20; const h = 120 + (1 - d) * 380; return <rect key={i} x={i * 40} y={500 - h / 2} width="38" height={h} opacity={0.02 + (1 - d) * 0.05} />; })}
          </g>
        </svg>
      );
      break;
    case "photon": // rays out of a lamp, bouncing off the floor
      art = (
        <svg {...svg}>
          <defs><radialGradient id="lamp"><stop offset="0" stopColor="var(--p)" stopOpacity=".35" /><stop offset="1" stopColor="var(--p)" stopOpacity="0" /></radialGradient></defs>
          <circle cx="1200" cy="80" r="260" fill="url(#lamp)" />
          <g {...stroke} strokeOpacity=".2">
            {Array.from({ length: 26 }, (_, i) => { const x = 150 + i * 55, bx = x + (i % 2 ? 160 : -200); return <polyline key={i} points={`1200,80 ${x},900 ${bx},${520 + (i * 37) % 300}`} />; })}
          </g>
          <line x1="0" y1="900" x2="1600" y2="900" stroke="var(--s)" strokeOpacity=".35" />
        </svg>
      );
      break;
    case "orbit": // orbital ellipses and a dotted descent
      art = (
        <svg {...svg}>
          <g {...stroke} strokeOpacity=".2">
            {[260, 380, 520, 680].map((r, i) => <ellipse key={r} cx="1250" cy="760" rx={r * 1.5} ry={r * 0.5} strokeDasharray={i % 2 ? "4 10" : undefined} />)}
          </g>
          <path d="M150 80 C 600 120, 900 400, 1250 700" stroke="var(--s)" strokeOpacity=".5" strokeDasharray="2 12" fill="none" strokeWidth="2" />
          <circle cx="1250" cy="1700" r="980" fill="var(--p)" fillOpacity=".04" stroke="var(--p)" strokeOpacity=".25" />
        </svg>
      );
      break;
    case "pixel": // phosphor grid
      art = (
        <svg {...svg}>
          <defs>
            <pattern id="px" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" {...stroke} strokeOpacity=".09" /><rect x="14" y="14" width="4" height="4" fill="var(--p)" fillOpacity=".18" /></pattern>
          </defs>
          <rect width="1600" height="1000" fill="url(#px)" />
          <g fill="var(--p)" fillOpacity=".16">
            {[[10, 4], [11, 4], [12, 4], [13, 4], [13, 5], [13, 6], [14, 6], [15, 6], [16, 6]].map(([x, y]) => <rect key={`${x}${y}`} x={x * 32 + 2} y={y * 32 + 2} width="28" height="28" />)}
          </g>
          <rect x={22 * 32 + 6} y={9 * 32 + 6} width="20" height="20" fill="var(--s)" fillOpacity=".4" />
        </svg>
      );
      break;
    case "torus": // hex tile world
      art = (
        <svg {...svg}>
          <defs>
            <pattern id="hex" width="84" height="146" patternUnits="userSpaceOnUse" patternTransform="scale(.8)">
              <path d="M42 0 L84 24 L84 73 L42 97 L0 73 L0 24 Z M42 97 L42 146" {...stroke} strokeOpacity=".16" />
            </pattern>
          </defs>
          <rect width="1600" height="1000" fill="url(#hex)" />
          {[[300, 300], [1100, 650], [1350, 250], [600, 780]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="70" stroke={i % 2 ? "var(--s)" : "var(--p)"} strokeOpacity=".35" fill="none" strokeDasharray="6 6" />)}
        </svg>
      );
      break;
    case "bento": // widget grid
      art = (
        <svg {...svg}>
          <g {...stroke} strokeOpacity=".16">
            {[[40, 60, 420, 300], [480, 60, 300, 620], [800, 60, 760, 300], [40, 380, 420, 300], [800, 380, 360, 300], [1180, 380, 380, 560], [40, 700, 740, 240], [800, 700, 360, 240]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="22" />)}
          </g>
          <path d="M860 280 L940 220 L1020 240 L1100 160 L1180 190 L1260 120 L1340 150 L1500 100" stroke="var(--s)" strokeOpacity=".4" fill="none" strokeWidth="2" />
        </svg>
      );
      break;
    case "neural": // network graph
      art = (
        <svg {...svg}>
          {(() => {
            const layers = [4, 6, 6, 3];
            const nodes = layers.flatMap((k, li) => Array.from({ length: k }, (_, i) => ({ x: 200 + li * 400, y: 500 + (i - (k - 1) / 2) * 150, l: li })));
            return (
              <>
                <g stroke="var(--p)" strokeOpacity=".1">
                  {nodes.flatMap((a, i) => nodes.filter((b) => b.l === a.l + 1).map((b, j) => <line key={`${i}-${j}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />))}
                </g>
                {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r="9" fill="var(--color-bg)" stroke={i % 5 ? "var(--p)" : "var(--s)"} strokeOpacity=".5" />)}
              </>
            );
          })()}
        </svg>
      );
      break;
    case "index": // chapter opener: a hex field
      art = (
        <svg {...svg}>
          <defs>
            <pattern id="hexw" width="84" height="146" patternUnits="userSpaceOnUse" patternTransform="scale(.6)">
              <path d="M42 0 L84 24 L84 73 L42 97 L0 73 L0 24 Z M42 97 L42 146" {...stroke} strokeOpacity=".12" />
            </pattern>
          </defs>
          <rect width="1600" height="1000" fill="url(#hexw)" />
        </svg>
      );
      break;
    case "relay":
    case "chat":
    case "lattice": // experience: a work log timeline with a warm glow
      art = (
        <svg {...svg}>
          <defs><radialGradient id="warm" cx="80%" cy="20%" r="70%"><stop offset="0" stopColor="var(--p)" stopOpacity=".16" /><stop offset="1" stopColor="var(--p)" stopOpacity="0" /></radialGradient></defs>
          <rect width="1600" height="1000" fill="url(#warm)" />
          <line x1="60" y1="0" x2="60" y2="1000" stroke="var(--p)" strokeOpacity=".45" strokeWidth="2" />
          {["SEP", "OCT", "NOV", "DEC"].map((m, i) => (
            <g key={m}>
              <circle cx="60" cy={180 + i * 200} r="9" fill="var(--color-bg)" stroke="var(--p)" strokeWidth="2" />
              <line x1="72" y1={180 + i * 200} x2="1600" y2={180 + i * 200} stroke="var(--p)" strokeOpacity=".07" />
              <text x="84" y={186 + i * 200} fill="var(--p)" fillOpacity=".6" fontSize="18" fontFamily="Share Tech Mono" letterSpacing="3">{m} 2025</text>
            </g>
          ))}
        </svg>
      );
      break;
  }
  return (
    <>
      <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]">{art}</div>
      {/* giant codename watermark */}
      <p className="display absolute -bottom-[0.18em] left-0 w-full overflow-hidden text-center text-[15vw] leading-none whitespace-nowrap text-transparent opacity-[0.07] [-webkit-text-stroke:2px_var(--p)]">{name}</p>
    </>
  );
}
