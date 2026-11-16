export const GITHUB_USER = "Mirado-77";

export const profile = {
  name: "Andriamirado Ravelonahina",
  shortName: "Andriamirado",
  role: "Full-Stack Developer",
  school: "3rd year · Epitech Paris",
  location: "Paris, France",
  email: "andriamirado.ravelonahina@epitech.eu",
  github: `https://github.com/${GITHUB_USER}`,
  // Fill in your LinkedIn profile URL to show the link.
  linkedin: "",
  availability: "Looking for a 5-month internship · March 29 → August 27, 2027",
  /** what a recruiter needs first */
  search: {
    kind: "Internship",
    start: "Mar 29, 2027",
    end: "Aug 27, 2027",
    duration: "5 months · full-time",
    roles: ["Full-stack", "Back-end", "AI engineering"],
    base: "Paris, France",
  },
  keyStack: ["TypeScript", "Node.js", "React / Next.js", "AWS Lambda", "Python", "PostgreSQL", "C / C++"],
  pitch:
    "I build back-ends, AI integrations and the interfaces on top of them — from AWS Lambda chatbots to raycasting engines written in C.",
  stats: [
    { value: "50", label: "team projects shipped" },
    { value: "6", label: "hackathons" },
    { value: "1", label: "internship (AI back-end)" },
    { value: "C1", label: "English" },
  ],
};

export const internship = {
  role: "Back-End Developer (AI) — Intern",
  team: "Support & Automation · CRS support team",
  company: "Redspher",
  location: "Luxembourg",
  period: "Sept. 1 – Dec. 31, 2025 · 4 months",
  about:
    "Redspher is a European group (founded 2008, ~700 people) in on-demand and urgent transport, with digital logistics products such as the Easy4Pro+ 4PL marketplace, Rubiwin and the internal Oscar platform. Much of the work still runs offline, so the support team is central.",
  problem:
    "Support tickets mostly arrived by e-mail: incomplete descriptions, missing information and wrong categories. Many had to be re-classified by hand, which slowed everyone down.",
  kpis: [
    { value: "75%+", label: "of incident tickets now created through Martine" },
    { value: "40+", label: "tickets a month over the last two months" },
    { value: "2", label: "AI tools designed and built solo" },
    { value: "4", label: "months from architecture to production" },
  ],
  // annex 2 of the internship report — tickets created by Martine per week
  weekly: [
    { week: "Oct · w1", n: 4 }, { week: "Oct · w2", n: 3 }, { week: "Oct · w3", n: 7 }, { week: "Nov · w1", n: 6 },
    { week: "Nov · w2", n: 3 }, { week: "Nov · w3", n: 17 }, { week: "Dec · w1", n: 25 }, { week: "Dec · w2", n: 23 },
    { week: "Dec · w3", n: 12 }, { week: "Dec · w4", n: 12 },
  ],
  projects: [
    {
      name: "Martine — AI ticketing chatbot",
      color: "#b5916c",
      summary:
        "A conversational assistant in Google Chat that guides the user through a structured conversation, collects what support needs, and creates a clean, categorised ticket in Zoho Desk.",
      features: [
        "Interactive Google Chat cards: clickable buttons and forms with several input fields",
        "AI classification and automatic problem description (AWS Bedrock)",
        "Knowledge base to understand requests and answer precise questions",
        "Broadcast announcements to every user of the bot",
        "Image attachments, conversation history in DynamoDB, logs in Elastic",
      ],
      iteration:
        "First user feedback: conversations felt too long. I added buttons, cut and reordered the questions and handled images — while the support team saw ticket quality jump.",
      stack: ["Node.js", "TypeScript", "AWS Lambda", "API Gateway", "DynamoDB", "S3", "Bedrock", "Zoho Desk API", "Google Chat", "Elastic"],
    },
    {
      name: "Release-notes generator",
      color: "#8f9aa6",
      summary:
        "Triggered by a webhook on every release: it gathers the release, its code changes (GitHub API) and the linked Zoho Desk tickets, then writes two versions — business and technical — and e-mails them.",
      features: [
        "GitHub webhook → Lambda through API Gateway",
        "Scrapes diffs, issues and related support tickets",
        "Two audiences, two notes, generated with Bedrock and sent with the Gmail API",
      ],
      iteration: "Result: business and technical teams read the same release in their own language.",
      stack: ["Node.js", "AWS Lambda", "API Gateway", "Bedrock", "GitHub API", "Zoho Desk API", "Gmail API"],
    },
  ],
  workflow: [
    "Daily stand-ups, plus longer reviews with my tutor after each major feature",
    "Autonomous on the chatbot; infrastructure team for AWS access, Travis CI and deployments",
    "Support team and product owner tested every feature before production",
  ],
  learned: [
    "Node.js, TypeScript and complex API integrations — none of which I had used before",
    "AWS services in production: Lambda, API Gateway, DynamoDB, S3, Bedrock",
    "Living with an LLM in production: hallucinations, prompt and knowledge-base tuning, bugs found live",
    "Estimating deadlines and iterating from real user feedback",
  ],
};

export const education = [
  { school: "Epitech Paris", title: "Expert in Information Technology (RNCP level 7)", period: "2025 – 2028" },
  { school: "Lycée Marie Curie", title: "Baccalauréat with honours — Computer Science, Economics & Sociology", period: "2023 – 2024" },
];

export const skills: { group: string; items: string[] }[] = [
  { group: "Front-end", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "shadcn/ui", "Figma"] },
  { group: "Back-end & API", items: ["Node.js", "NestJS", "Prisma", "Drizzle", "Zod", "Better Auth", "OAuth", "Python"] },
  { group: "Data", items: ["PostgreSQL", "DynamoDB"] },
  { group: "Cloud & DevOps", items: ["AWS Lambda", "API Gateway", "S3", "Docker Compose", "Bun", "Vitest", "GitHub Actions", "Elastic"] },
  { group: "AI", items: ["AWS Bedrock", "Claude", "Ollama", "Reinforcement Learning", "PyTorch", "Gymnasium"] },
  { group: "Systems & graphics", items: ["C", "C++20", "CSFML / SFML", "GLSL", "ncurses", "POSIX sockets", "Linux"] },
  { group: "Practices", items: ["Agile", "Client management", "RGAA / WCAG AA", "GDPR", "Unit testing"] },
];

export type DemoId = "wolf3d" | "raytracer" | "lander" | "arcade" | "zappy" | "dashboard" | "sensai";

export type Project = {
  repo: string;
  title: string;
  tagline: string;
  context: string;
  description: string;
  highlights: string[];
  stack: string[];
  demo: DemoId;
  demoHint: string;
  accent: string;
  /** darker variant of the accent, readable on the light page */
  ink: string;
};

/** Curated projects, one per public repository. Order = display order. */
export const projects: Project[] = [
  {
    repo: "wolf3d",
    title: "Wolf3D — Le Palais du Crépuscule",
    tagline: "First-person raycasting game in C",
    context: "Epitech · team project · 2025",
    description:
      "A raycaster built from scratch with CSFML. You play a revenant warrior-monk climbing a cursed palace overrun by yōkai to defeat the shogun who sold his soul.",
    highlights: [
      "Textured raycasting engine with GLSL lighting shaders",
      "Custom ECS library (libecs.a) for enemies, items and the boss",
      "Spells, mana & stamina, HUD, minimap, dialogue, gamepad support",
      "Online multiplayer over TCP (bonus)",
    ],
    stack: ["C", "CSFML", "GLSL", "Makefile"],
    demo: "wolf3d",
    demoHint: "Runs on the game’s own textures, sprites, HUD and 80×60 map. Move with Z Q S D / W A S D, arrows or drag to turn, E or click to cast, F opens doors, R toggles the torch.",
    accent: "#a3866d",
    ink: "#c2a88f",
  },
  {
    repo: "raytracer",
    title: "Raytracer",
    tagline: "Plugin-based Monte Carlo path tracer in C++",
    context: "Epitech · team project",
    description:
      "A physically-based renderer: BVH acceleration, tile-scheduled multithreading, progressive display and a plugin system where primitives, materials, loaders and denoisers are shared libraries.",
    highlights: [
      "Path tracing with next-event estimation & Russian roulette",
      "Emissive, glossy, PBR and transparent materials as plugins",
      "OBJ / MTL and STL mesh loaders, image textures",
      "Intel Open Image Denoise integration, live scene reloading",
    ],
    stack: ["C++", "CMake", "libconfig++", "OIDN"],
    demo: "raytracer",
    demoHint: "Runs path-tracer-web, the WebGL2 port of the renderer: GGX, glass, MIS. Drag to orbit, scroll to zoom, switch scenes or let the light follow your pointer — the image converges sample by sample.",
    accent: "#8f9aa6",
    ink: "#b3bcc6",
  },
  {
    repo: "start-trek",
    title: "Start TreK",
    tagline: "Reinforcement learning lunar lander",
    context: "Epitech · Python",
    description:
      "Agents that learn to land on Gymnasium's LunarLander-v3. Random and heuristic baselines, a DQN with replay buffer and target network, Double DQN with wind and TD3 — with ablations and a 5-seed study reporting mean ± 95% CI.",
    highlights: [
      "DQN, Double DQN, TD3 and tabular Q-learning compared",
      "Ablation study: buffer size, observation normalisation, soft updates",
      "5-seed reproducibility runs, one-click scripts, plots & videos",
    ],
    stack: ["Python", "PyTorch", "Gymnasium", "YAML"],
    demo: "lander",
    demoHint: "Real evaluation videos from the repo — switch algorithm with the buttons. “Try it live” lets you fly it yourself (↑ main engine, ← → side engines).",
    accent: "#7f95a3",
    ink: "#a6b8c4",
  },
  {
    repo: "arcade",
    title: "Arcade",
    tagline: "Hot-swappable game & graphics plugins",
    context: "Epitech · 2nd year · C++20",
    description:
      "A retro gaming platform where both renderers and games are shared libraries loaded at runtime with dlopen. Switch from ncurses to SFML in the middle of a game without restarting.",
    highlights: [
      "Core binary with zero graphical dependencies",
      "IDisplayModule / IGameModule / IEntity interfaces",
      "Snake & Centipede, menu, persistent scores",
    ],
    stack: ["C++20", "CMake", "SFML", "ncurses", "dlopen"],
    demo: "arcade",
    demoHint: "Click the screen, steer with the arrows. Press F2 (or the button) to hot-swap the renderer.",
    accent: "#8c9a7a",
    ink: "#b0bc9f",
  },
  {
    repo: "zappy",
    title: "Zappy",
    tagline: "Networked multi-agent game: server, GUI and AI",
    context: "Epitech · team project",
    description:
      "Teams of autonomous AI clients compete on a toroidal tile world to collect stones and elevate their players. A C++ server arbitrates over TCP, a 3D GUI observes, Python AIs play.",
    highlights: [
      "Poll-based TCP server with RAII POSIX wrappers",
      "Protocol library with no network dependency, unit-tested (Criterion)",
      "Autonomous Python AI: vision, inventory, broadcast, incantations",
    ],
    stack: ["C++", "C", "Python", "GLSL", "Criterion"],
    demo: "zappy",
    demoHint: "A real match recorded from zappy_gui: 12 AIs forage, broadcast RALLY / COMING / READY and gather for incantations. “2D simulation” is an interactive model of the same rules.",
    accent: "#a68a5b",
    ink: "#c9b48f",
  },
  {
    repo: "dashboard",
    title: "Dashboard",
    tagline: "Personal widget dashboard",
    context: "Epitech · Oct. 2026",
    description:
      "Users pick widgets from five services (weather, crypto, RSS, Google Calendar, GitHub), configure them and arrange them on a bento grid. Each widget refreshes itself at its own rate.",
    highlights: [
      "Email + GitHub/Google OAuth, tokens encrypted with AES-256-GCM",
      "Drag-and-drop bento grid, ⌘K command palette, light/dark",
      "API rate-limiting, WCAG AA, Vitest tests, one-command Docker",
    ],
    stack: ["NestJS", "Next.js", "PostgreSQL", "Drizzle", "shadcn/ui", "Docker"],
    demo: "dashboard",
    demoHint: "Live widgets: real weather (Open-Meteo), crypto prices (Binance) and GitHub commits. Drag to rearrange.",
    accent: "#9d8496",
    ink: "#bfa9b8",
  },
  {
    repo: "SensAI",
    title: "SensAI",
    tagline: "Command-line AI assistant on a local model",
    context: "Python · Ollama",
    description:
      "A terminal assistant talking straight to Ollama's HTTP API — no LLM framework. Streaming, tool calls in a Docker sandbox, memory with automatic summarisation, code search with embeddings, personas and a scheduler.",
    highlights: [
      "Tools with risk levels, sandboxed run_command",
      "Context-window tracking and automatic history compression",
      "Semantic code index, semantic cache, dev ⇄ reviewer pair mode",
    ],
    stack: ["Python", "Ollama", "SQLite", "Docker", "TypeScript"],
    demo: "sensai",
    demoHint: "Type a message or a slash command like /tools, /persona, /doc or /help.",
    accent: "#7d9b94",
    ink: "#a9c2bb",
  },
];

/** Mean evaluation return over 100 episodes, from start-trek/logs/eval/*.csv. */
export const landerResults = [
  { agent: "Heuristic (PD)", score: 244.0, solve: 0.91 },
  { agent: "TD3", score: 236.9, solve: 0.88 },
  { agent: "DQN", score: 216.8, solve: 0.79 },
  { agent: "Double DQN", score: 205.0, solve: 0.55 },
  { agent: "Double DQN + wind", score: 179.5, solve: 0.63 },
  { agent: "Q-learning (tabular)", score: -171.8, solve: 0 },
  { agent: "Random", score: -174.8, solve: 0 },
];

/** Language byte counts from the GitHub API (snapshot, refreshed live at runtime). */
export const languageSnapshot: Record<string, Record<string, number>> = {
  wolf3d: { C: 220164, Makefile: 5194, GLSL: 1123 },
  "start-trek": { Python: 76490, HTML: 17272, CSS: 10593, Shell: 7975 },
  raytracer: { "C++": 616080, "Objective-C": 19735, CMake: 14887, C: 2165 },
  dashboard: { TypeScript: 470209, CSS: 9194, Dockerfile: 1743, JavaScript: 623, Shell: 363 },
  SensAI: { Python: 761790, TypeScript: 85736, CSS: 4803, Makefile: 1591 },
  arcade: { "C++": 113565, CMake: 4175 },
  zappy: { "C++": 783066, C: 313132, Python: 109083, Makefile: 11448, GLSL: 3617 },
};

export const languageColors: Record<string, string> = {
  C: "#8b9bb4", "C++": "#f34b7d", Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a",
  GLSL: "#5686a5", CSS: "#663399", HTML: "#e34c26", Shell: "#89e051", Makefile: "#427819",
  CMake: "#DA3434", Dockerfile: "#384d54", "Objective-C": "#438eff",
};

/* ------------------------------------------------------------------ v2 */

/** Shape the holographic core takes behind a section. */
export type Motif =
  | "core" | "index" | "corridor" | "photon" | "orbit" | "pixel" | "torus" | "bento" | "neural"
  | "relay" | "chat" | "helix" | "lattice" | "portal";

/** Each project's visual identity: its own codename, colors, HUD badge and 3D form. */
export type Identity = {
  code: string;
  codename: string;
  badge: string;
  motif: Motif;
  /** main neon */
  primary: string;
  /** counter neon */
  secondary: string;
  /** one-line system readout shown on the HUD */
  readout: string;
};

export const identities: Record<DemoId, Identity> = {
  wolf3d: { code: "001", codename: "Palace of Dusk", badge: "W3D", motif: "corridor", primary: "#ff4b2b", secondary: "#ffb340", readout: "RAYCAST // 80×60 GRID // YŌKAI DETECTED" },
  raytracer: { code: "002", codename: "Photon Engine", badge: "RTX", motif: "photon", primary: "#8af3ff", secondary: "#ffd27a", readout: "MONTE CARLO // NEE + MIS // CONVERGING" },
  lander: { code: "003", codename: "Lunar Descent", badge: "RL", motif: "orbit", primary: "#ffa630", secondary: "#4de1ff", readout: "LUNARLANDER-V3 // 5 SEEDS // Δv NOMINAL" },
  arcade: { code: "004", codename: "Insert Coin", badge: "ARC", motif: "pixel", primary: "#3dff7e", secondary: "#ff3d8b", readout: "DLOPEN // HOT-SWAP READY // F2" },
  zappy: { code: "005", codename: "Torus War", badge: "ZPY", motif: "torus", primary: "#ffe14a", secondary: "#38c8ff", readout: "TCP POLL // 12 AGENTS // INCANTATION" },
  dashboard: { code: "006", codename: "Bento Grid", badge: "DSH", motif: "bento", primary: "#ff4fd8", secondary: "#7d8cff", readout: "OAUTH // AES-256-GCM // LIVE WIDGETS" },
  sensai: { code: "007", codename: "Local Mind", badge: "SAI", motif: "neural", primary: "#38ffcb", secondary: "#a77bff", readout: "OLLAMA // STREAM // CONTEXT 61%" },
};

/** HUD system colors. */
export const HUD = { cyan: "#2de2ff", orange: "#ff7a1a", red: "#ff3b4e" };
