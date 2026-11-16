# Portfolio v2 — Andriamirado Ravelonahina

HUD / demo-reel redesign of the first portfolio (`../portfolio`). What changed:

- **Three.js holographic core** (`src/three/`): a 6.5k-point cloud with bloom, HUD rings and a
  flying grid that morphs into a different form for every section (raycast corridor, light paths,
  lunar descent, snake grid, torus world, bento panels, neural net, pipeline, chat bubble, helix, portal).
- **path-tracer-web** vendored in `src/pathtracer/` (MIT, viewer + renderer only) and used for the
  Raytracer demo, with a custom neon scene plus the Cornell / Materials / Studio presets.
- **Per-project identity** (`identities` in `src/data.ts`): codename, hex badge, neon color pair,
  background linework (`src/components/Decor.tsx`) and 3D motif.
- HUD design system in `src/index.css` and `src/components/hud.tsx` (panels with corner brackets,
  ring gauges, reticle, live clock, waveform), boot sequence, status strip, FX on/off switch.

Served under `/portfolio-v2/` (set `BASE_PATH` to change it).

---


Personal portfolio built from my public GitHub repositories. Each project has a
live, in-browser emulation of its core idea:

| Repo | Demo |
|---|---|
| wolf3d | Playable textured raycaster (yōkai, torch, doors, spells, minimap) |
| raytracer | WebGL2 progressive path tracer (NEE, Russian roulette, glass / metal / diffuse) |
| start-trek | Lunar lander with heuristic / random / manual agents + real eval results chart |
| arcade | Snake with hot-swappable ncurses / SFML renderers (F2) |
| zappy | Tile-world match simulation: foraging, broadcasts, incantations |
| dashboard | Live widgets (Open-Meteo, Binance, GitHub) on a draggable bento grid |
| SensAI | Scripted CLI emulation: slash commands, tool calls, token accounting |

Repos that are not curated in `src/data.ts` still appear automatically under
"More on GitHub" (fetched from the GitHub API at runtime).

## Develop

```sh
npm install
npm run dev
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds and publishes
to GitHub Pages. In the repo settings, set **Pages → Source** to **GitHub Actions**.
The site is served under `/portfolio/`; set `BASE_PATH` to change it.

## Add a project

Add an entry to `projects` in `src/data.ts`. Its `demo` field picks a component
in `src/demos/` (registered in `src/components/DemoFrame.tsx`).
