import { useEffect, useState } from "react";
import { profile } from "../data";
import { useSlides } from "../slides";
import ExtLink from "./ExtLink";
import { Clock } from "./hud";

const links: [string, string, string][] = [
  ["Work", "work", ""],
  ["Experience", "experience", "hidden sm:inline-flex"],
  ["Skills", "skills", "hidden md:inline-flex"],
  ["Contact", "contact", ""],
];

export default function Nav() {
  const { goTo, slides, active } = useSlides();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const chapter = slides[active]?.chapter;
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-300 ${scrolled ? "border-[color-mix(in_srgb,var(--p)_25%,transparent)] bg-bg/80 backdrop-blur-md" : "border-transparent"}`}>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 sm:px-8 lg:box-content lg:px-[104px]">
        <a href="#intro" onClick={(e) => { e.preventDefault(); goTo(0); }} className="press flex items-center gap-3 text-ink">
          <svg width="26" height="28" viewBox="0 0 100 110" aria-hidden>
            <path d="M50 3 L95 28 L95 82 L50 107 L5 82 L5 28 Z" fill="none" stroke="var(--p)" strokeWidth="7" style={{ filter: "drop-shadow(0 0 4px var(--p))" }} />
            <text x="50" y="70" textAnchor="middle" fontSize="44" fontWeight="700" fill="var(--s)" fontFamily="Oxanium">A</text>
          </svg>
          <span className="leading-none">
            <span className="display block text-[16px] tracking-[0.12em]">A.Ravelonahina</span>
            <span className="mono block text-[12px] tracking-[0.3em] text-ink-3">PORTFOLIO // V2</span>
          </span>
        </a>
        <ul className="flex items-center gap-0.5 sm:gap-1">
          {links.map(([label, id, cls], i) => {
            const current = (label === "Work" && chapter === "Work") || (label === "Experience" && chapter === "Experience") || slides[active]?.id === id;
            return (
              <li key={id} className={cls}>
                <a
                  href={`#${id}`}
                  onClick={(e) => { e.preventDefault(); goTo(id); }}
                  aria-current={current ? "location" : undefined}
                  className={`press mono relative inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[14px] tracking-[0.16em] uppercase hover:text-ink ${current ? "text-ink" : "text-ink-3"}`}
                >
                  <span aria-hidden className={current ? "text-[var(--p)]" : "hidden text-ink-3 sm:inline"}>0{i + 1}</span>
                  {label}
                  <span aria-hidden className={`absolute inset-x-2.5 -bottom-[11px] h-[2px] origin-left bg-[var(--p)] shadow-[0_0_8px_var(--p)] transition-transform duration-300 ease-out ${current ? "scale-x-100" : "scale-x-0"}`} />
                </a>
              </li>
            );
          })}
          <li className="ml-2 hidden xl:block">
            <a href="#contact" onClick={(e) => { e.preventDefault(); goTo("contact"); }} className="mono inline-flex min-h-[44px] items-center gap-2 px-2 text-[13px] tracking-[0.1em] whitespace-nowrap text-[#3dff7e] uppercase">
              <span aria-hidden className="blink h-2 w-2 bg-[#3dff7e]" />Internship · Mar–Aug 2027
            </a>
          </li>
          <li className="ml-3 hidden 2xl:block"><Clock className="text-[13px] text-ink-3" /></li>
          <li className="ml-2 hidden sm:block">
            <ExtLink href={profile.github} className="btn-ghost !px-3.5 !py-1.5 !text-[13px]">GitHub</ExtLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
