import { useEffect, useState } from "react";
import { education, internship as X } from "../data";
import { useInView } from "../hooks";
import { Slide, SlideTitle, useSlides } from "../slides";
import Decor from "./Decor";

/* ------------------------------------------------------------------ */
/* Slide 1 — the company, the problem, the numbers                     */
/* ------------------------------------------------------------------ */
export function ExperienceIntro() {
  return (
    <Slide id="experience" p="#ff7a1a" s="#2de2ff" decor={<Decor motif="relay" name="02 · Experience" />}>
      <p className="eyebrow">Code/X01 · Experience · {X.period}</p>
      <SlideTitle id="experience" className="mt-4 max-w-2xl">Shipping AI into a real support workflow.</SlideTitle>
      <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <h3 className="display text-xl text-ink">{X.company} <span className="font-normal text-ink-3">· {X.location}</span></h3>
          <p className="mt-0.5 text-ink-2">{X.role}</p>
          <p className="mt-1 text-[15px] text-ink-3">{X.team}</p>
          <p className="mt-6 leading-relaxed text-ink-2">{X.about}</p>
          <h4 className="eyebrow mt-7">The problem</h4>
          <p className="mt-1.5 leading-relaxed text-ink-2">{X.problem}</p>
        </div>
        <div className="flex flex-col gap-8">
          <dl className="grid grid-cols-2 gap-2.5">
            {X.kpis.map((k) => (
              <div key={k.label} className="hud-panel flex flex-col-reverse px-4 py-4" style={{ ["--b" as string]: "10px" }}>
                <dt className="mono mt-2 text-[12px] leading-snug tracking-[0.1em] text-ink-3 uppercase">{k.label}</dt>
                <dd className="display glow text-[38px] leading-none text-[var(--p)] tabular-nums">{k.value}</dd>
              </div>
            ))}
          </dl>
          <WeeklyChart />
        </div>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ */
/* Slide 2 — Martine                                                   */
/* ------------------------------------------------------------------ */
export function ExperienceMartine() {
  const p = X.projects[0];
  return (
    <Slide id="martine" p="#ff7a1a" s="#2de2ff" decor={<Decor motif="chat" name="02 · Experience" />}>
      <p className="eyebrow">Code/X02 · Experience · Project 1</p>
      <SlideTitle id="martine" className="mt-4">{p.name.split(" — ")[0]}<span className="text-ink-3"> — {p.name.split(" — ")[1]}</span></SlideTitle>
      <div className="mt-10 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="leading-relaxed text-ink-2">{p.summary}</p>
          <ul className="mt-5 space-y-2 text-[17px] text-ink-2">
            {p.features.map((f) => <li key={f} className="grid grid-cols-[14px_1fr] gap-2"><span aria-hidden className="text-[var(--p)]">▸</span>{f}</li>)}
          </ul>
          <blockquote className="hud-panel mt-6 px-4 py-3 text-[17px] leading-relaxed text-ink-2">{p.iteration}</blockquote>
          <Pipeline />
          <p className="mt-6 font-mono text-[14px] leading-relaxed text-ink-3"><span className="sr-only">Stack: </span>{p.stack.join("  ·  ")}</p>
        </div>
        <ChatMock />
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ */
/* Slide 3 — release notes, method, education                          */
/* ------------------------------------------------------------------ */
export function ExperienceJourney() {
  const p = X.projects[1];
  return (
    <Slide id="journey" p="#ff7a1a" s="#2de2ff" decor={<Decor motif="lattice" name="02 · Experience" />}>
      <p className="eyebrow">Code/X03 · Experience · Project 2 and method</p>
      <SlideTitle id="journey" className="mt-4">{p.name}, and how I worked.</SlideTitle>
      <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
        <article className="hud-panel p-5">
          <h3 className="display text-[17px] tracking-[0.06em] text-[var(--p)]">What it does</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{p.summary}</p>
          <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-2">
            {p.features.map((f) => <li key={f} className="grid grid-cols-[14px_1fr] gap-2"><span aria-hidden className="text-[var(--p)]">▸</span>{f}</li>)}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-ink-3">{p.iteration}</p>
        </article>
        <article className="hud-panel p-5">
          <h3 className="display text-[17px] tracking-[0.06em] text-[var(--p)]">How I worked</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-2">
            {X.workflow.map((w) => <li key={w} className="grid grid-cols-[14px_1fr] gap-2"><span aria-hidden className="text-[var(--p)]">▸</span>{w}</li>)}
          </ul>
          <h3 className="display mt-7 text-[17px] tracking-[0.06em] text-[var(--p)]">What I learned</h3>
          <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-2">
            {X.learned.map((w) => <li key={w} className="grid grid-cols-[14px_1fr] gap-2"><span aria-hidden className="text-[var(--p)]">▸</span>{w}</li>)}
          </ul>
        </article>
        <article className="hud-panel p-5">
          <h3 className="display text-[17px] tracking-[0.06em] text-[var(--p)]">Education</h3>
          <ol className="mt-4 space-y-5">
            {education.map((ed) => (
              <li key={ed.school} className="grid grid-cols-[88px_1fr] gap-3">
                <p className="mono pt-px text-[14px] text-[var(--s)] tabular-nums">{ed.period}</p>
                <div><p className="font-medium text-ink">{ed.school}</p>
                <p className="mt-1 text-sm text-ink-2">{ed.title}</p></div>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </Slide>
  );
}

/* ------------------------------------------------------------------ */

/** Tickets created by Martine per week — single series, hover tooltip, table view. */
function WeeklyChart() {
  const [hi, setHi] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const data = X.weekly;
  const W = 320, H = 120, padB = 18, padT = 10, max = 25;
  const y = (v: number) => H - padB - (v / max) * (H - padB - padT);
  return (
    <figure className="hud-panel p-4">
      <figcaption className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-ink">Tickets created by Martine, per week <span className="font-normal text-ink-3">Oct–Dec 2025</span></span>
        <button onClick={() => setTable((t) => !t)} aria-pressed={table} className="press rounded px-1.5 text-[14px] text-ink-3 underline underline-offset-2 hover:text-ink">
          {table ? "Show chart" : "Show table"}
        </button>
      </figcaption>
      {table ? (
        <table className="w-full text-left text-[14px]">
          <thead><tr className="text-ink-3"><th scope="col" className="py-1 font-medium">Week</th><th scope="col" className="text-right font-medium">Tickets</th></tr></thead>
          <tbody className="text-ink-2">
            {data.map((d) => <tr key={d.week} className="border-t border-line"><td className="py-1">{d.week}</td><td className="text-right font-mono">{d.n}</td></tr>)}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Bar chart. Weekly tickets: ${data.map((d) => `${d.week} ${d.n}`).join(", ")}. Peak of 25 in the first week of December.`}>
            {[0, 10, 20].map((t) => (
              <g key={t}>
                <line x1="14" x2={W} y1={y(t)} y2={y(t)} className={t ? "stroke-line" : "stroke-control"} />
                <text x="0" y={y(t) + 3} fontSize="10" className="fill-ink-3" fontFamily="Share Tech Mono">{t}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = 14 + i * ((W - 14) / data.length) + 3, w = (W - 14) / data.length - 6, top = y(d.n), base = y(0);
              return (
                <g key={d.week} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(null)}>
                  <rect x={x - 3} y="0" width={w + 6} height={H} fill="transparent" />
                  <path d={`M${x} ${base} V${top + 4} Q${x} ${top} ${x + 4} ${top} H${x + w - 4} Q${x + w} ${top} ${x + w} ${top + 4} V${base}Z`} fill={i === 6 ? "var(--p)" : "var(--color-ink-2)"} style={i === 6 ? { filter: "drop-shadow(0 0 4px var(--p))" } : undefined} opacity={hi === null || hi === i ? (i === 6 ? 1 : 0.8) : 0.25} />
                  {(i === 6 || hi === i) && <text x={x + w / 2} y={top - 3} fontSize="10" textAnchor="middle" className="fill-ink" fontFamily="Share Tech Mono">{d.n}</text>}
                </g>
              );
            })}
            {[["Oct", 0], ["Nov", 3], ["Dec", 6]].map(([m, i]) => (
              <text key={m} x={14 + (i as number) * ((W - 14) / data.length) + 3} y={H - 4} fontSize="11" className="fill-ink-3">{m}</text>
            ))}
          </svg>
          {hi !== null && (
            <div aria-hidden className="pointer-events-none absolute top-0 right-0 border border-[var(--p)] bg-bg px-2 py-1 text-[13px]">
              {data[hi].week} · <span className="font-mono font-semibold">{data[hi].n}</span> tickets
            </div>
          )}
        </div>
      )}
      <p className="mt-2 text-[14px] text-ink-3">Source: internship report, annex 2.</p>
    </figure>
  );
}

function Pipeline() {
  const nodes = ["Google Chat", "API Gateway", "Lambda", "Bedrock + KB", "DynamoDB", "Zoho Desk"];
  return (
    <figure className="mt-7">
      <figcaption className="eyebrow mb-3">Request flow</figcaption>
      <ol className="flex flex-wrap items-center gap-2 text-[14px]">
        {nodes.map((n, i) => (
          <li key={n} className="flex items-center gap-2">
            <span className="cut-sm mono bg-[color-mix(in_srgb,var(--p)_14%,transparent)] px-2 py-1 text-ink">{n}</span>
            {i < nodes.length - 1 && <span aria-hidden className="text-[var(--p)]">▶</span>}
          </li>
        ))}
      </ol>
    </figure>
  );
}

type Msg = { from: "user" | "bot"; text?: string; card?: { title: string; buttons?: string[]; fields?: string[]; ticket?: boolean } };
const SCRIPT: Msg[] = [
  { from: "user", text: "Hi, I can't download my invoice on Easy4Pro+" },
  { from: "bot", card: { title: "Which product is affected?", buttons: ["Easy4Pro+", "Rubiwin", "Oscar", "Other"] } },
  { from: "user", text: "Easy4Pro+" },
  { from: "bot", card: { title: "A few details for the support team", fields: ["Shipment / invoice ID", "What happens exactly?", "Screenshot (optional)"] } },
  { from: "user", text: "INV-20931 · button does nothing · screenshot.png attached" },
  { from: "bot", card: { title: "Ticket created", ticket: true } },
];

/** Illustrative replay of a Martine conversation. Pausable (RGAA 13.8). */
function ChatMock() {
  const { motion } = useSlides();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [n, setN] = useState(0);
  const [paused, setPaused] = useState(false);
  const playing = motion && !paused;
  useEffect(() => {
    if (!playing) { setN((v) => (v === 0 ? SCRIPT.length : v)); return; }
    if (!inView) return;
    const id = setTimeout(() => setN((v) => (v >= SCRIPT.length + 3 ? 0 : v + 1)), n === 0 ? 600 : 1500);
    return () => clearTimeout(id);
  }, [n, inView, playing]);
  const shown = Math.min(n, SCRIPT.length);
  return (
    <figure ref={ref} className="card self-start overflow-hidden">
      <figcaption className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span aria-hidden className="display grid h-8 w-8 place-items-center bg-[var(--p)] text-sm text-bg cut-sm">M</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">Martine</span>
          <span className="block text-[13px] text-ink-3">Google Chat app · illustrative replay</span>
        </span>
        <button onClick={() => setPaused((p) => !p)} aria-pressed={paused} disabled={!motion} className="btn-ghost !px-3 !py-1 !text-[12px] disabled:opacity-50">
          {paused || !motion ? "▶ Replay" : "❚❚ Pause"}
        </button>
      </figcaption>
      <div className="flex min-h-[340px] flex-col gap-2.5 p-4 text-sm">
        {SCRIPT.slice(0, shown).map((m, i) =>
          m.from === "user" ? (
            <p key={i} className="max-w-[80%] self-end cut-sm bg-[var(--p)] px-3 py-2 text-bg" style={{ animation: "chatIn 250ms var(--ease-out)" }}>
              <span className="sr-only">User: </span>{m.text}
            </p>
          ) : (
            <div key={i} className="max-w-[88%] self-start cut-sm border border-[color-mix(in_srgb,var(--p)_30%,transparent)] bg-surface-2/80 p-3" style={{ animation: "chatIn 250ms var(--ease-out)" }}>
              <p className="font-medium text-ink"><span className="sr-only">Martine: </span>{m.card!.title}</p>
              {m.card!.buttons && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {m.card!.buttons.map((b) => <li key={b} className="border border-[var(--s)] px-2.5 py-0.5 text-[14px] text-[var(--s)]">{b}</li>)}
                </ul>
              )}
              {m.card!.fields && (
                <ul className="mt-2 space-y-1.5">
                  {m.card!.fields.map((f) => <li key={f} className="border border-line bg-bg/60 px-2 py-1 text-[14px] text-ink-3">{f}</li>)}
                </ul>
              )}
              {m.card!.ticket && (
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14px]">
                  <dt className="text-ink-3">Category</dt><dd className="font-medium text-ink">Incident · Invoicing</dd>
                  <dt className="text-ink-3">Priority</dt><dd className="font-medium">Medium</dd>
                  <dt className="text-ink-3">Summary</dt><dd className="font-medium">Invoice download fails on Easy4Pro+</dd>
                  <dt className="text-ink-3">Sent to</dt><dd className="font-medium text-[#3dff7e]">Zoho Desk ✓</dd>
                </dl>
              )}
            </div>
          ),
        )}
        {playing && n > 0 && n < SCRIPT.length && SCRIPT[n].from === "bot" && (
          <span aria-hidden className="self-start px-1 text-[14px] text-ink-3">Martine is typing…</span>
        )}
      </div>
      <style>{`@keyframes chatIn{from{opacity:0;transform:translateY(6px) scale(.98)}}`}</style>
    </figure>
  );
}
