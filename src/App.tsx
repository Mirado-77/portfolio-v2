import { HUD, identities, projects } from "./data";
import { SlideChrome, SlideProvider, type SlideDef } from "./slides";
import Nav from "./components/Nav";
import Core from "./components/Core";
import Boot from "./components/Boot";
import Hero from "./components/Hero";
import { ProjectSlide, WorkIndex } from "./components/Projects";
import { ExperienceIntro, ExperienceJourney, ExperienceMartine } from "./components/Experience";
import Skills from "./components/Skills";
import Contact from "./components/Contact";

const SLIDES: SlideDef[] = [
  { id: "intro", label: "Introduction", chapter: "Intro", motif: "core", accent: HUD.cyan, secondary: HUD.orange, code: "000" },
  { id: "work", label: "Mission select", chapter: "Work", motif: "index", accent: HUD.cyan, secondary: HUD.orange },
  ...projects.map((p) => {
    const id = identities[p.demo];
    return { id: `project-${p.repo}`, label: p.title.split(" — ")[0], chapter: "Work", motif: id.motif, accent: id.primary, secondary: id.secondary, code: id.code };
  }),
  { id: "experience", label: "Redspher", chapter: "Experience", motif: "relay", accent: HUD.orange, secondary: HUD.cyan, code: "X01" },
  { id: "martine", label: "Martine chatbot", chapter: "Experience", motif: "chat", accent: HUD.orange, secondary: HUD.cyan, code: "X02" },
  { id: "journey", label: "Method & education", chapter: "Experience", motif: "lattice", accent: HUD.orange, secondary: HUD.cyan, code: "X03" },
  { id: "skills", label: "Skills", chapter: "Profile", motif: "helix", accent: HUD.cyan, secondary: HUD.orange },
  { id: "contact", label: "Contact", chapter: "Profile", motif: "portal", accent: HUD.orange, secondary: HUD.cyan },
];

export default function App() {
  return (
    <SlideProvider slides={SLIDES}>
      <a href="#main" className="skip-link">Skip to content</a>
      <Boot />
      <Core />
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <WorkIndex />
        {projects.map((p, i) => <ProjectSlide key={p.repo} p={p} index={i} />)}
        <ExperienceIntro />
        <ExperienceMartine />
        <ExperienceJourney />
        <Skills />
        <Contact />
      </main>
      <SlideChrome />
    </SlideProvider>
  );
}
