import type { Motif } from "./data";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** The site's chapters: number, color and one-line subtitle. Intro has none. */
export const CHAPTERS: Record<string, { n: string; color: string; title: string; sub: string }> = {
  Work: { n: "01", color: "#2de2ff", title: "Work", sub: "7 projects · live demos" },
  Experience: { n: "02", color: "#ff7a1a", title: "Experience", sub: "Redspher · AI back-end internship · 2025" },
  Profile: { n: "03", color: "#3dff7e", title: "Profile", sub: "Skills · contact" },
};

export type SlideDef = { id: string; label: string; chapter: string; accent?: string; secondary?: string; motif: Motif; code?: string };

/** "smooth" for pointer navigation, "instant" for the keyboard (keyboard actions never animate). */
type How = "smooth" | "instant";

type Ctx = {
  slides: SlideDef[];
  active: number;
  goTo: (i: number | string, how?: How) => void;
  motion: boolean;
  setMotion: (on: boolean) => void;
};
const SlideCtx = createContext<Ctx | null>(null);
export const useSlides = () => useContext(SlideCtx)!;

const motionOn = () => document.documentElement.dataset.motion !== "off";

export function SlideProvider({ slides, children }: { slides: SlideDef[]; children: ReactNode }) {
  const [active, setActive] = useState(0);
  const [motion, setMotionState] = useState(motionOn);

  // which slide holds the viewport's reading line
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      let idx = 0;
      slides.forEach((s, i) => {
        const r = document.getElementById(s.id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) idx = i;
      });
      setActive(idx);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [slides]);

  const goTo = useCallback((target: number | string, how: How = "smooth") => {
    const i = typeof target === "number" ? target : slides.findIndex((s) => s.id === target);
    if (i < 0 || i >= slides.length) return;
    const el = document.getElementById(slides[i].id);
    if (!el) return;
    el.scrollIntoView({ behavior: how === "smooth" && motionOn() ? "smooth" : "instant", block: "start" });
    el.querySelector<HTMLElement>("[data-slide-title]")?.focus({ preventScroll: true });
    history.replaceState(null, "", `#${slides[i].id}`);
  }, [slides]);

  // deep links: React renders after the browser applied the hash, so honour it once on load
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && id !== "main") document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
  }, []);

  // keyboard: Page Up / Page Down and ← / → move between slides (not while typing or playing a demo)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (t.closest("input, textarea, select, [contenteditable], [data-demo], video")) return;
      if (e.key === "PageDown" || e.key === "ArrowRight") { e.preventDefault(); goTo(Math.min(slides.length - 1, active + 1), "instant"); }
      if (e.key === "PageUp" || e.key === "ArrowLeft") { e.preventDefault(); goTo(Math.max(0, active - 1), "instant"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, goTo, slides.length]);

  const setMotion = (on: boolean) => {
    document.documentElement.dataset.motion = on ? "on" : "off";
    try { localStorage.setItem("motion", on ? "on" : "off"); } catch { /* ignore */ }
    setMotionState(on);
  };

  return <SlideCtx.Provider value={{ slides, active, goTo, motion, setMotion }}>{children}</SlideCtx.Provider>;
}

/**
 * Splits a slide into its reading blocks (columns, then the pieces of each column)
 * and tags them `.rv` with a stagger index. They rise in, one after another, the
 * first time the slide comes into view. Without JS, or with motion off, nothing is held back.
 */
function useSlideReveal(ref: React.RefObject<HTMLElement | null>, skip: boolean) {
  useLayoutEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    if (!skip) {
      const inner = sec.firstElementChild as HTMLElement | null;
      let blocks = inner ? Array.from(inner.children) : [];
      while (blocks.length === 1 && blocks[0].children.length > 1) blocks = Array.from(blocks[0].children);
      const items: Element[] = [];
      for (const b of blocks) {
        const kids = Array.from(b.children);
        const column = b.tagName === "DIV" && getComputedStyle(b).display === "block" && kids.length > 1 && kids.length < 12;
        items.push(...(column ? kids : [b]));
      }
      items.forEach((el, i) => {
        el.classList.add("rv");
        (el as HTMLElement).style.setProperty("--i", String(Math.min(i, 9)));
      });
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { sec.dataset.in = ""; io.disconnect(); }
    }, { threshold: 0.18 });
    io.observe(sec);
    return () => io.disconnect();
  }, [ref, skip]);
}

/** A full-viewport section. `p` / `s` set its neon pair, `decor` draws behind it. */
export function Slide({ id, className = "", children, reveal = true, p, s: sec, decor }: { id: string; className?: string; children: ReactNode; reveal?: boolean; p?: string; s?: string; decor?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useSlideReveal(ref, !reveal);
  const style = { ...(p ? { ["--p" as string]: p } : {}), ...(sec ? { ["--s" as string]: sec } : {}) } as React.CSSProperties;
  const { slides } = useSlides();
  const def = slides.find((d) => d.id === id);
  const ch = def ? CHAPTERS[def.chapter] : undefined;
  const inChapter = def ? slides.filter((d) => d.chapter === def.chapter) : [];
  const pos = def ? inChapter.indexOf(def) + 1 : 0;
  return (
    <section ref={ref} id={id} aria-labelledby={`${id}-title`} className={`slide ${className}`} style={style} data-chapter={def?.chapter}>
      {ch && (
        <div className="absolute inset-x-0 top-[78px] z-[1] px-5 sm:px-8 lg:px-[104px]" aria-hidden>
          <div className="mx-auto flex max-w-[1320px] items-center gap-4 sm:gap-5" style={{ color: ch.color }}>
            <span className="display glow text-[22px] tracking-[0.14em] whitespace-nowrap sm:text-[28px]">CH.{ch.n}</span>
            <span className="display text-[22px] tracking-[0.14em] whitespace-nowrap text-ink sm:text-[28px]">{ch.title}</span>
            <span className="mono hidden text-[15px] tracking-[0.1em] whitespace-nowrap text-ink-2 uppercase md:inline">{ch.sub}</span>
            <span className="h-[3px] flex-1" style={{ background: `linear-gradient(90deg, ${ch.color}, transparent)`, boxShadow: `0 0 10px ${ch.color}` }} />
            <span className="display text-[18px] tracking-[0.12em] whitespace-nowrap tabular-nums sm:text-[20px]">{pad(pos)}/{pad(inChapter.length)}</span>
          </div>
        </div>
      )}
      <div className="relative mx-auto w-full max-w-[1320px]">{children}</div>
      {decor && <div className="decor" aria-hidden>{decor}</div>}
    </section>
  );
}

/** Kept for API compatibility: titles are plain text now. */
export function Words({ children }: { children: ReactNode; start?: number }) {
  return <>{children}</>;
}

/** Slide title; focus target when navigating with the index. */
export function SlideTitle({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={`${id}-title`} data-slide-title tabIndex={-1} className={`display glitch text-[32px] leading-[1.02] text-ink outline-none sm:text-[48px] ${className}`}>
      <span className="title-mask"><span>{children}</span></span>
    </h2>
  );
}

export const pad = (n: number) => String(n).padStart(2, "0");

export { SlideChrome } from "./components/Chrome";

/**
 * Entrance props. Only the first screen animates (`enter` / `enter-fade` with a delay in ms);
 * elsewhere this just passes layout classes through.
 */
export const anim = (_d: number, variant = "") => ({ className: variant.replace(/\ba-(left|right|zoom|tumble|block)\b/g, "").trim() });
export const enter = (delay: number, cls = "", fade = false) => ({
  className: `${fade ? "enter-fade" : "enter"} ${cls}`,
  style: { ["--delay" as string]: `${delay}ms` } as React.CSSProperties,
});
