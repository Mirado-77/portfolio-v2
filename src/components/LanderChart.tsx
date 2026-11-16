import { useState } from "react";
import { landerResults } from "../data";

/** Horizontal bar chart: mean eval return per agent (100 episodes). Single series, zero baseline. */
export default function LanderChart(_: { accent?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const min = -200, max = 300, solved = 200;
  const W = 520, labelW = 150, rowH = 26, gap = 6, padR = 46;
  const plotW = W - labelW - padR;
  const x = (v: number) => labelW + ((v - min) / (max - min)) * plotW;
  const H = landerResults.length * (rowH + gap) + 24;

  return (
    <figure className="hud-panel mt-4 p-4 sm:p-5">
      <figcaption className="mb-3 flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">Mean evaluation return · 100 episodes</span>
        <button onClick={() => setTable((t) => !t)} className="press rounded px-1.5 text-[14px] text-ink-3 underline underline-offset-2 hover:text-ink">{table ? "chart" : "table"}</button>
      </figcaption>
      {table ? (
        <table className="w-full text-left text-[14px]">
          <thead className="text-ink-3"><tr><th className="py-1 font-normal">Agent</th><th className="font-normal">Mean return</th><th className="font-normal">Landed ≥ 200</th></tr></thead>
          <tbody className="text-ink-2">
            {landerResults.map((r) => (
              <tr key={r.agent} className="border-t border-line"><td className="py-1.5">{r.agent}</td><td className="font-mono">{r.score.toFixed(1)}</td><td className="font-mono">{Math.round(r.solve * 100)}%</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart of mean evaluation return per agent">
            {[-200, -100, 0, 100, 200, 300].map((t) => (
              <g key={t}>
                <line x1={x(t)} x2={x(t)} y1={0} y2={H - 20} className={t === 0 ? "stroke-control" : "stroke-line"} />
                <text x={x(t)} y={H - 6} textAnchor="middle" fontSize="10" className="fill-ink-3" fontFamily="Share Tech Mono">{t}</text>
              </g>
            ))}
            <line x1={x(solved)} x2={x(solved)} y1={0} y2={H - 20} className="stroke-ink-3" strokeDasharray="3 3" />
            <text x={x(solved) + 4} y={10} fontSize="10" className="fill-ink-2">solved</text>
            {landerResults.map((r, i) => {
              const y = i * (rowH + gap) + 14;
              const x0 = x(Math.min(0, r.score)), x1 = x(Math.max(0, r.score));
              const neg = r.score < 0;
              const w = x1 - x0;
              const rad = 4;
              // rounded data-end only (away from the zero baseline)
              const d = neg
                ? `M${x1} ${y} H${x0 + rad} Q${x0} ${y} ${x0} ${y + rad} V${y + rowH - 8 - rad} Q${x0} ${y + rowH - 8} ${x0 + rad} ${y + rowH - 8} H${x1}Z`
                : `M${x0} ${y} H${x1 - rad} Q${x1} ${y} ${x1} ${y + rad} V${y + rowH - 8 - rad} Q${x1} ${y + rowH - 8} ${x1 - rad} ${y + rowH - 8} H${x0}Z`;
              return (
                <g key={r.agent} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={0} y={y - 3} width={W} height={rowH} className={hover === i ? "fill-surface-2" : "fill-transparent"} />
                  <text x={labelW - 10} y={y + 13} textAnchor="end" fontSize="11" className="fill-ink-2">{r.agent}</text>
                  {w > 0 && <path d={d} className={r.agent === "TD3" ? "fill-accent" : "fill-ink"} opacity={hover === null || hover === i ? (neg ? 0.35 : 0.85) : 0.25} />}
                  <text x={neg ? x0 - 4 : x1 + 4} y={y + 13} textAnchor={neg ? "end" : "start"} fontSize="10" className="fill-ink" fontFamily="Share Tech Mono" opacity={i < 2 || hover === i ? 1 : 0}>
                    {r.score.toFixed(0)}
                  </text>
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="pointer-events-none absolute right-2 bottom-8 rounded-md border border-line bg-surface px-3 py-2 text-[14px] shadow-lg">
              <p className="font-medium">{landerResults[hover].agent}</p>
              <p className="mt-1 text-ink-2">Mean return <span className="font-mono text-ink">{landerResults[hover].score.toFixed(1)}</span></p>
              <p className="text-ink-2">Landed (≥200) <span className="font-mono text-ink">{Math.round(landerResults[hover].solve * 100)}%</span></p>
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[13px] text-ink-3">Source: start-trek/logs/eval/*.csv. TD3 is the best learned agent, within 8 points of the hand-tuned controller.</p>
    </figure>
  );
}
