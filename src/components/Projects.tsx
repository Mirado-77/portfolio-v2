import { projects, profile, languageColors, identities, type Project } from "../data";
import { useGithub } from "../github";
import { Slide, SlideTitle, useSlides } from "../slides";
import DemoFrame from "./DemoFrame";
import ExtLink from "./ExtLink";
import LanderChart from "./LanderChart";
import Decor from "./Decor";
import { HexBadge } from "./hud";

function LanguageBar({ langs }: { langs?: Record<string, number> }) {
  if (!langs) return null;
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
  return (
    <div>
      <div className="mute-color flex h-[3px] gap-[2px]" aria-hidden>
        {entries.map(([l, n]) => <span key={l} style={{ width: `${(n / total) * 100}%`, background: languageColors[l] ?? "#64748b", boxShadow: `0 0 6px ${languageColors[l] ?? "#64748b"}` }} />)}
      </div>
      <ul className="mono mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-3" aria-label="Languages">
        {entries.slice(0, 4).map(([l, n]) => (
          <li key={l} className="flex items-center gap-1.5">
            <span aria-hidden className="mute-color h-2 w-2" style={{ background: languageColors[l] ?? "#64748b" }} />
            {l} {((n / total) * 100).toFixed(1)}%
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.470 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.690-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/** Mission select: every project as a selectable card in its own colors. */
export function WorkIndex() {
  const { goTo } = useSlides();
  const { repos } = useGithub();
  const curated = new Set(projects.map((p) => p.repo.toLowerCase()).concat("portfolio", "portfolio-v2"));
  const others = (repos ?? []).filter((r) => !curated.has(r.name.toLowerCase()));
  return (
    <Slide id="work" decor={<Decor motif="index" name="01 · Work" />}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.7fr)] lg:gap-14">
        <div>
          <p className="eyebrow">Mission select</p>
          <SlideTitle id="work" className="mt-4">Seven projects. All of them run here.</SlideTitle>
          <p className="mt-5 max-w-md leading-relaxed text-ink-2">
            Each project has its own codename, colors and live demo ported to the browser: a playable raycaster, a WebGL path tracer, real RL training runs, a recorded multi-agent match.
          </p>
          <ExtLink href={profile.github} className="btn-ghost mt-7">
            <GithubIcon /> {others.length ? `+${others.length} more repos` : "All repositories"}
          </ExtLink>
        </div>
        <ol className="grid gap-2.5 sm:grid-cols-2">
          {projects.map((p) => {
            const id = identities[p.demo];
            return (
              <li key={p.repo} style={{ ["--p" as string]: id.primary, ["--s" as string]: id.secondary }}>
                <a
                  href={`#project-${p.repo}`}
                  onClick={(e) => { e.preventDefault(); goTo(`project-${p.repo}`); }}
                  className="hud-panel group flex h-full items-center gap-4 px-4 py-3.5 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_30px_-8px_var(--p),inset_0_0_40px_-16px_var(--p)]"
                  style={{ ["--b" as string]: "10px" }}
                >
                  <HexBadge text={id.badge} size={50} />
                  <span className="min-w-0 flex-1">
                    <span className="mono block truncate text-[12px] tracking-[0.2em] text-[var(--p)] uppercase">Code/{id.code} · {id.codename}</span>
                    <span className="display mt-0.5 block truncate text-[17px] text-ink">{p.title.split(" — ")[0]}</span>
                    <span className="block truncate text-[15px] text-ink-3">{p.tagline}</span>
                  </span>
                  <span aria-hidden className="text-[var(--p)] transition-transform duration-200 group-hover:translate-x-1">▶</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </Slide>
  );
}

export function ProjectSlide({ p, index }: { p: Project; index: number }) {
  const { repos, languages } = useGithub();
  const repo = repos?.find((r) => r.name === p.repo);
  const idn = identities[p.demo];
  const id = `project-${p.repo}`;
  const flip = index % 2 === 1;
  const [name, subtitle] = p.title.split(" — ");
  return (
    <Slide id={id} p={idn.primary} s={idn.secondary} decor={<Decor motif={idn.motif} name={idn.codename} />}>
      <div className={`grid items-center gap-10 lg:gap-10 ${flip ? "lg:grid-cols-[1fr_1.55fr] xl:grid-cols-[1fr_1.8fr]" : "lg:grid-cols-[1.55fr_1fr] xl:grid-cols-[1.8fr_1fr]"}`}>
        <div className={flip ? "lg:order-2" : ""}>
          <DemoFrame demo={p.demo} title={p.title} accent={idn.primary} ink={idn.primary} hint={p.demoHint} identity={idn} />
          {p.demo === "lander" && <LanderChart accent={idn.primary} />}
        </div>
        <div className={flip ? "lg:order-1" : ""}>
          <div className="flex items-center gap-4">
            <HexBadge text={idn.badge} size={64} sub={idn.code} />
            <div>
              <p className="mono text-[13px] tracking-[0.22em] text-[var(--p)] uppercase">Code/{idn.code} · {idn.codename}</p>
              <p className="mono mt-1 text-[13px] tracking-[0.12em] text-ink-3 uppercase">{p.context}</p>
            </div>
          </div>
          <SlideTitle id={id} className="mt-5">
            <span className="glow" style={{ color: "var(--color-ink)" }}>{name}</span>
            {subtitle && <span className="block text-[0.5em] text-[var(--p)]">{subtitle}</span>}
          </SlideTitle>
          <p className="mt-3 text-[var(--s)]">{p.tagline}</p>
          <p className="mt-4 leading-relaxed text-ink-2">{p.description}</p>
          <ul className="mt-5 space-y-2 text-[17px] text-ink-2">
            {p.highlights.map((h, i) => (
              <li key={h} className="grid grid-cols-[30px_1fr] gap-2">
                <span aria-hidden className="mono pt-[3px] text-[13px] text-[var(--p)]">{String(i + 1).padStart(2, "0")}▸</span>
                {h}
              </li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Stack">
            {p.stack.map((s) => <li key={s} className="cut-sm mono bg-[color-mix(in_srgb,var(--p)_12%,transparent)] px-2.5 py-1 text-[13px] tracking-[0.08em] text-ink">{s}</li>)}
          </ul>
          <div className="mt-5"><LanguageBar langs={languages[p.repo]} /></div>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <ExtLink href={`${profile.github}/${p.repo}`} className="btn-hud"><GithubIcon /> Source code</ExtLink>
            {repo && (
              <span className="mono text-[13px] tracking-[0.1em] text-ink-3 uppercase">
                {repo.stargazers_count} ★ · updated {new Date(repo.pushed_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Slide>
  );
}
