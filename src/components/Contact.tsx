import { useEffect, useState } from "react";
import { profile } from "../data";
import { Slide } from "../slides";
import ExtLink from "./ExtLink";
import { GithubIcon } from "./Projects";
import { Clock, Corners, Wave } from "./hud";

export default function Contact() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      /* clipboard unavailable: the mailto link still works */
    }
  };
  const ghost = "btn-ghost";
  return (
    <Slide id="contact" p="#ff7a1a" s="#2de2ff">
      <div className="relative max-w-4xl p-6 sm:p-10">
      <Corners size={28} />
      <p className="eyebrow">Open comms · channel secure</p>
      <h2 id="contact-title" data-slide-title tabIndex={-1} className="display glitch glow mt-5 max-w-3xl text-[40px] leading-[1] text-ink outline-none sm:text-[64px]">
        An internship from <span className="text-[var(--p)]">March</span> to <span className="text-[var(--p)]">August 2027</span>?
      </h2>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
        I'm looking for five months in full-stack, back-end or AI engineering. Write to me — I answer quickly.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-2.5">
        <a className="btn-hud !normal-case !tracking-[0.04em]" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        {/* label swap: both labels share one box and crossfade through a short blur, so the button never changes width */}
        <button onClick={copy} className={`${ghost} relative`}>
          <span className="grid">
            <span aria-hidden={copied} className={`col-start-1 row-start-1 transition-[opacity,filter] duration-200 ${copied ? "opacity-0 blur-[2px]" : "opacity-100 blur-0"}`}>Copy address</span>
            <span aria-hidden={!copied} className={`col-start-1 row-start-1 text-center transition-[opacity,filter] duration-200 ${copied ? "opacity-100 blur-0" : "opacity-0 blur-[2px]"}`}>Copied</span>
          </span>
        </button>
        <ExtLink href={profile.github} className={ghost}><GithubIcon /> GitHub</ExtLink>
        {profile.linkedin && <ExtLink href={profile.linkedin} className={ghost}>LinkedIn</ExtLink>}
      </div>
      <div aria-hidden className="mono mt-8 flex items-center gap-4 text-[12px] tracking-[0.2em] text-ink-3 uppercase">
        <span>Paris <Clock className="text-ink-2" /></span>
        <Wave className="h-6 w-40" color="var(--p)" />
        <span>Response time ▸ fast</span>
      </div>
      </div>
      <p role="status" className="sr-only">{copied ? "E-mail address copied to the clipboard" : ""}</p>
      <footer className="mono mt-20 flex flex-wrap justify-between gap-2 border-t border-[color-mix(in_srgb,var(--p)_25%,transparent)] pt-6 text-[13px] tracking-[0.12em] text-ink-3 uppercase">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with React, Three.js and a WebGL2 path tracer · {profile.location}</span>
      </footer>
    </Slide>
  );
}
