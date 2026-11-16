import { skills } from "../data";
import { Slide, SlideTitle } from "../slides";
import { RingGauge } from "./hud";

const CODES = ["FE", "BE", "DB", "OPS", "AI", "SYS", "PRC"];

export default function Skills() {
  return (
    <Slide id="skills" p="#2de2ff" s="#ff7a1a">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div>
          <p className="eyebrow">Loadout</p>
          <SlideTitle id="skills" className="mt-4 max-w-2xl">From C sockets to React components.</SlideTitle>
        </div>
        <div className="flex gap-4 text-ink-3" aria-label="Languages spoken">
          <RingGauge value={1} display="FR" label="Fluent" size={96} />
          <RingGauge value={0.8} display="EN" label="C1" size={96} />
          <RingGauge value={0.3} display="ES" label="A2" size={96} />
        </div>
      </div>
      <div className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {skills.map((s, i) => (
          <section key={s.group} aria-labelledby={`skill-${i}`} className="hud-panel p-4" style={{ ["--c" as string]: i % 3 === 1 ? "var(--s)" : "var(--p)", ["--b" as string]: "10px" }}>
            <div className="flex items-center justify-between">
              <h3 id={`skill-${i}`} className="display text-[17px] tracking-[0.06em] text-ink">{s.group}</h3>
              <span aria-hidden className="mono text-[12px] tracking-[0.2em] text-[var(--c)]">{CODES[i]}</span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5 text-[15px] text-ink-2">
              {s.items.map((it) => <li key={it} className="border border-line bg-bg/40 px-2 py-0.5">{it}</li>)}
            </ul>
          </section>
        ))}
        <section aria-labelledby="skill-lang" className="hud-panel p-4" style={{ ["--b" as string]: "10px" }}>
          <h3 id="skill-lang" className="display text-[17px] tracking-[0.06em] text-ink">Off the grid</h3>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-2">A year in retail (2024–2025) taught me client advice and staying calm under pressure. Outside code: dance, drawing, weight training, fashion.</p>
        </section>
      </div>
    </Slide>
  );
}
