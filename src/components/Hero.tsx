import { education, internship, profile, projects } from "../data";
import { Slide, enter, useSlides } from "../slides";
import { Clock, Reticle, Readout } from "./hud";
import ExtLink from "./ExtLink";

/*
 * Recruiter-first hero: in one screen it answers what, when, who and how to reach.
 * Order of reading: availability → name + role → the internship card → proof → contact.
 */
export default function Hero() {
  const { goTo } = useSlides();
  const S = profile.search;
  const [first, last] = profile.name.split(" ");
  const facts: [string, string][] = [
    ["School", `${education[0].school} · Year 3 · ${education[0].title.split(" (")[0]}`],
    ["Last role", `${internship.role.replace(" — Intern", "")} intern · ${internship.company} (${internship.location}), 4 months`],
    ["Impact", `${internship.kpis[0].value} ${internship.kpis[0].label}`],
    ["Languages", "French (fluent) · English (C1) · Spanish (A2)"],
  ];
  return (
    <Slide id="intro" reveal={false}>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-center xl:gap-10">
        <div>
          <p {...enter(0, "mono flex items-center gap-2.5 text-[14px] tracking-[0.16em] text-ink-2 uppercase", true)}>
            <span aria-hidden className="blink h-2.5 w-2.5 bg-[#3dff7e] shadow-[0_0_8px_#3dff7e]" />
            Available for an internship in 2027
          </p>
          <h1 id="intro-title" data-slide-title tabIndex={-1} {...enter(0, "display glitch mt-4 text-[clamp(40px,7.6vw,96px)] leading-[0.9] text-ink outline-none xl:text-[clamp(56px,4.8vw,86px)]")}>
            <span className="glow block text-ink">{first}</span>
            <span className="block text-transparent [-webkit-text-stroke:1.5px_var(--p)] [filter:drop-shadow(0_0_8px_var(--p))]">{last}</span>
          </h1>
          <p {...enter(60, "display mt-4 text-[22px] tracking-[0.06em] text-[var(--p)] sm:text-[26px]")}>{profile.role} · AI back-end</p>
          <p {...enter(100, "mt-3 max-w-xl text-[18px] leading-relaxed text-ink-2 sm:text-[19px]")}>{profile.pitch}</p>

          {/* the internship card: the one block a recruiter scans for */}
          <section {...enter(150, "hud-panel mt-6 max-w-2xl p-5")} style={{ ["--c" as string]: "var(--s)", ["--b" as string]: "16px" }} aria-labelledby="search-title">
            <p id="search-title" className="eyebrow !text-[var(--s)] [--p:var(--s)]">Internship wanted</p>
            <p className="display mt-3 text-[26px] leading-tight text-ink sm:text-[32px]">
              <span className="whitespace-nowrap">{S.start}</span> <span className="text-[var(--s)]">→</span> <span className="whitespace-nowrap">{S.end}</span>
            </p>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-3">
              <div><dt className="mono text-[13px] tracking-[0.12em] text-ink-3 uppercase">Duration</dt><dd className="mt-0.5 text-[17px] text-ink">{S.duration}</dd></div>
              <div><dt className="mono text-[13px] tracking-[0.12em] text-ink-3 uppercase">Roles</dt><dd className="mt-0.5 text-[17px] text-ink">{S.roles.join(" · ")}</dd></div>
              <div><dt className="mono text-[13px] tracking-[0.12em] text-ink-3 uppercase">Based in</dt><dd className="mt-0.5 text-[17px] text-ink">{S.base}</dd></div>
            </dl>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Core stack">
              {profile.keyStack.map((k) => <li key={k} className="cut-sm mono bg-[color-mix(in_srgb,var(--p)_14%,transparent)] px-3 py-1.5 text-[14px] text-ink">{k}</li>)}
            </ul>
          </section>

          <div {...enter(200, "mt-6 flex flex-wrap items-center gap-3")}>
            <a href={`mailto:${profile.email}?subject=${encodeURIComponent("Internship 2027")}`} className="btn-hud">✉ Contact me</a>
            <a href="#work" onClick={(e) => { e.preventDefault(); goTo("work"); }} className="btn-ghost">▶ See the 7 projects</a>
            <ExtLink href={profile.github} className="btn-ghost">GitHub</ExtLink>
          </div>
        </div>

        <aside {...enter(280, "relative mx-auto w-full max-w-[560px] xl:max-w-[500px]", true)} aria-label="Profile summary">
          <div className="relative">
            <Reticle className="mx-auto w-[64%] xl:w-[60%]">
              <span data-core-anchor className="block h-1 w-1" />
            </Reticle>
            <div aria-hidden className="mono pointer-events-none absolute inset-0 text-[13px] tracking-[0.14em] uppercase">
              <span className="absolute top-1 left-0 text-[var(--p)]">Core // online</span>
              <span className="absolute top-1 right-0 text-ink-3">Paris <Clock className="text-ink" /></span>
            </div>
          </div>
          <dl className="hud-panel mt-2 px-5 py-2" style={{ ["--b" as string]: "12px" }}>
            {facts.map(([k, v]) => <Readout key={k} k={k} v={v} />)}
          </dl>
          <dl className="mt-2 grid grid-cols-4 gap-2">
            {profile.stats.map((s, i) => (
              <div key={s.label} className="hud-panel flex flex-col-reverse px-3 py-3" style={{ ["--c" as string]: i % 2 ? "var(--s)" : "var(--p)", ["--b" as string]: "8px" }}>
                <dt className="mono mt-1 text-[12px] leading-snug text-ink-3 uppercase">{s.label}</dt>
                <dd className="display text-[30px] leading-none text-ink tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
          <ul className="sr-only">
            {projects.map((p) => <li key={p.repo}><a href={`#project-${p.repo}`}>{p.title}</a></li>)}
          </ul>
        </aside>
      </div>
    </Slide>
  );
}
