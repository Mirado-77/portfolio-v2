import { useEffect } from "react";
import { CHAPTERS, pad, useSlides } from "../slides";
import { HUD } from "../data";

/**
 * Fixed HUD chrome: a numbered section rail (desktop), a status strip along
 * the bottom edge, and a compact slide bar on mobile. The active section's
 * neon pair is mirrored on <html> so the chrome takes its colors.
 */
export function SlideChrome() {
  const { slides, active, goTo, motion, setMotion } = useSlides();
  const cur = slides[active];
  useEffect(() => {
    const d = document.documentElement.style;
    d.setProperty("--p", cur?.accent ?? HUD.cyan);
    d.setProperty("--s", cur?.secondary ?? HUD.orange);
  }, [cur]);
  const go = (e: React.MouseEvent, i: number) => { e.preventDefault(); goTo(i); };
  const progress = slides.length > 1 ? active / (slides.length - 1) : 0;

  return (
    <>
      <nav aria-label="Slides" className="group/rail fixed top-1/2 right-4 z-40 hidden -translate-y-1/2 lg:flex lg:gap-3">
        <ol className="flex flex-col items-end">
          {slides.map((s, i) => {
            const on = i === active;
            const ch = CHAPTERS[s.chapter];
            const first = ch && slides[i - 1]?.chapter !== s.chapter;
            return (
              <li key={s.id} className={first ? "mt-3" : ""}>
                {first && (
                  <span aria-hidden className="display mb-1 block text-right text-[12px] tracking-[0.18em] uppercase" style={{ color: ch.color, opacity: slides[active]?.chapter === s.chapter ? 1 : 0.55 }}>
                    {ch.n} {ch.title}
                  </span>
                )}
                <a href={`#${s.id}`} onClick={(e) => go(e, i)} aria-current={on ? "step" : undefined} aria-label={`${pad(i + 1)} · ${s.label}`} className="relative flex h-[22px] items-center justify-end gap-2">
                  <span aria-hidden className={`mono pointer-events-none text-[12px] tracking-[0.16em] whitespace-nowrap uppercase opacity-0 transition-[opacity,translate] duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 ${on ? "text-ink" : "text-ink-3"}`}>{s.label}</span>
                  <span aria-hidden className="mono text-[12px] tabular-nums transition-colors" style={{ color: on ? s.accent ?? HUD.cyan : "var(--color-ink-3)" }}>{pad(i + 1)}</span>
                  <span aria-hidden className="h-[2px] transition-[width,background-color,box-shadow] duration-300" style={{ width: on ? 22 : 8, background: on ? s.accent ?? HUD.cyan : "var(--color-control)", boxShadow: on ? `0 0 8px ${s.accent ?? HUD.cyan}` : "none" }} />
                </a>
              </li>
            );
          })}
        </ol>
        <span aria-hidden className="relative w-px self-stretch bg-line">
          <span className="absolute left-[-2px] h-4 w-[5px] bg-[var(--p)] shadow-[0_0_10px_var(--p)] transition-[top] duration-500" style={{ top: `calc(${progress * 100}% - 8px)` }} />
        </span>
        <p className="sr-only" aria-live="polite">Slide {active + 1} of {slides.length}: {cur?.label}</p>
      </nav>

      {/* bottom status strip */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden h-9 items-center justify-between border-t border-[color-mix(in_srgb,var(--p)_25%,transparent)] bg-bg/70 px-6 backdrop-blur-sm lg:flex" aria-hidden>
        <span className="mono flex items-center gap-4 text-[12px] tracking-[0.2em] text-ink-3 uppercase">
          <span className="text-[var(--p)]">SEC {pad(active + 1)}/{pad(slides.length)}</span>
          <span style={{ color: CHAPTERS[cur?.chapter ?? ""]?.color }}>{CHAPTERS[cur?.chapter ?? ""] ? `CH.${CHAPTERS[cur!.chapter].n} ${cur!.chapter}` : cur?.chapter}</span>
          <span className="text-ink-2">{cur?.code ? `CODE/${cur.code} · ` : ""}{cur?.label}</span>
        </span>
        <span className="flex h-[2px] w-56 bg-line">
          <span className="h-full bg-[var(--p)] shadow-[0_0_8px_var(--p)] transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </span>
        <span className="mono pointer-events-auto flex items-center gap-4 text-[12px] tracking-[0.2em] text-ink-3 uppercase">
          <span>← → navigate</span>
          <button onClick={() => setMotion(!motion)} aria-pressed={!motion} className="press uppercase hover:text-[var(--p)]">
            FX: <span className={motion ? "text-[var(--p)]" : "text-alert"}>{motion ? "ON" : "OFF"}</span>
          </button>
        </span>
      </div>

      {/* mobile slide bar */}
      <nav aria-label="Slides" className="cut-sm fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-2 border border-[color-mix(in_srgb,var(--p)_40%,transparent)] bg-bg/90 px-1.5 py-1.5 backdrop-blur-md lg:hidden">
        <button onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Previous slide" className="press grid h-9 w-9 place-items-center text-[var(--p)] disabled:opacity-30">◀</button>
        <p className="mono min-w-0 truncate text-center text-[13px] tracking-[0.14em] text-ink-2 uppercase">
          <span className="text-[var(--p)] tabular-nums">{pad(active + 1)}/{pad(slides.length)}</span>
          <span className="ml-2 text-ink">{cur?.label}</span>
        </p>
        <div className="flex items-center">
          <button onClick={() => setMotion(!motion)} aria-pressed={!motion} aria-label={motion ? "Pause animations" : "Play animations"} className="press mono grid h-9 w-9 place-items-center text-[12px] text-ink-3">{motion ? "FX" : "––"}</button>
          <button onClick={() => goTo(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1} aria-label="Next slide" className="press grid h-9 w-9 place-items-center text-[var(--p)] disabled:opacity-30">▶</button>
        </div>
      </nav>
    </>
  );
}
