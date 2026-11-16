import { useEffect, useRef, useState } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { Viewer, type FrameInfo } from "../pathtracer/viewer/viewer";
import { createLight, createMaterial, createObject, createScene, type Scene } from "../pathtracer/core/scene";
import { scenePreset } from "../pathtracer/core/presets";

/*
 * The raytracer slide runs path-tracer-web, the WebGL2 port of the C++ renderer:
 * GGX microfacets, rough transmission, MIS between light and BSDF sampling,
 * progressive accumulation. The default scene is lit by two neon tubes.
 */

function neon(): Scene {
  const floor = createMaterial({ name: "Floor", baseColor: "#1b2330", roughness: 0.22, pattern: "checker", patternColor: "#090c12", patternScale: 2.5 });
  const wall = createMaterial({ name: "Wall", baseColor: "#0e141c", roughness: 0.85 });
  const glass = createMaterial({ name: "Glass", baseColor: "#ffffff", transmission: 1, roughness: 0, ior: 1.5 });
  const chrome = createMaterial({ name: "Chrome", baseColor: "#e9f2ff", metallic: 1, roughness: 0.04 });
  const gold = createMaterial({ name: "Gold", baseColor: "#ffd27a", metallic: 1, roughness: 0.28 });
  const cyan = createMaterial({ name: "Cyan tube", baseColor: "#000000", emission: "#2de2ff", emissionStrength: 7 });
  const orange = createMaterial({ name: "Orange tube", baseColor: "#000000", emission: "#ff7a1a", emissionStrength: 7 });
  return createScene({
    name: "Neon",
    camera: { target: [0, 0.55, -0.3], yaw: 18, pitch: 11, distance: 4.4, fov: 40, aperture: 0, focusDistance: 0 },
    environment: { type: "color", color: "#020409", intensity: 1 },
    render: { maxBounces: 8, maxSamples: 3000, exposure: 0.4, toneMapping: "aces", clamp: 10 },
    materials: [floor, wall, glass, chrome, gold, cyan, orange],
    objects: [
      createObject("plane", { name: "Floor", position: [0, 0, 0], scale: [10, 1, 10], materialId: floor.id }),
      createObject("plane", { name: "Back wall", position: [0, 2, -1.7], rotation: [90, 0, 0], scale: [10, 1, 4], materialId: wall.id }),
      createObject("sphere", { name: "Glass ball", position: [0.6, 0.48, 0.05], scale: [0.96, 0.96, 0.96], materialId: glass.id }),
      createObject("sphere", { name: "Chrome ball", position: [-0.72, 0.4, -0.35], scale: [0.8, 0.8, 0.8], materialId: chrome.id }),
      createObject("cylinder", { name: "Gold pillar", position: [0.05, 0.4, -1.0], scale: [0.46, 0.8, 0.46], materialId: gold.id }),
      createObject("box", { name: "Cyan tube", position: [-1.75, 1.1, -1.35], scale: [0.07, 2.2, 0.07], materialId: cyan.id }),
      createObject("box", { name: "Orange tube", position: [1.75, 1.1, -1.35], scale: [0.07, 2.2, 0.07], materialId: orange.id }),
    ],
    lights: [
      createLight("sphere", { name: "Cyan glow", position: [-1.6, 1.1, -1.2], radius: 0.12, color: "#2de2ff", intensity: 34, visible: false }),
      createLight("sphere", { name: "Orange glow", position: [1.6, 1.1, -1.2], radius: 0.12, color: "#ff7a1a", intensity: 34, visible: false }),
      createLight("area", { name: "Key", position: [0, 2.6, 0.6], size: [1.2, 0.8], color: "#dfe9ff", intensity: 2.2 }),
    ],
  });
}

const SCENES: { id: string; label: string; make: () => Scene }[] = [
  { id: "neon", label: "Neon", make: neon },
  { id: "cornell", label: "Cornell", make: () => scenePreset("cornell") },
  { id: "materials", label: "Materials", make: () => scenePreset("materials") },
  { id: "studio", label: "Studio", make: () => scenePreset("studio") },
];

export default function Raytracer({ running, accent }: DemoProps) {
  const host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const [info, setInfo] = useState<FrameInfo | null>(null);
  const [scene, setScene] = useState(0);
  const [follow, setFollow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!host.current) return;
    let v: Viewer;
    try {
      v = new Viewer(host.current, { scene: SCENES[0].make(), maxPixelRatio: 1.25, maxPassesPerFrame: 6 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "WebGL2 is not available on this device.");
      return;
    }
    viewer.current = v;
    let last = 0;
    const offFrame = v.on("frame", (f) => {
      const now = performance.now();
      if (now - last > 200 || f.converged) { last = now; setInfo({ ...f }); }
    });
    const offErr = v.on("error", ({ message }) => setError(message));
    return () => { offFrame(); offErr(); v.dispose(); viewer.current = null; };
  }, []);

  useEffect(() => { if (viewer.current) viewer.current.paused = !running; }, [running]);
  useEffect(() => { if (viewer.current) viewer.current.lightFollow = follow; }, [follow]);

  const pick = (i: number) => {
    setScene(i);
    viewer.current?.setScene(SCENES[i].make());
  };

  const max = viewer.current?.scene.render.maxSamples || 3000;
  const progress = info ? Math.min(1, info.samples / max) : 0;
  const btn = "mono px-2 py-1 text-[12px] tracking-[0.14em] uppercase backdrop-blur transition-colors";

  return (
    <div className="relative h-full w-full">
      <div ref={host} className="absolute inset-0" />
      {error ? (
        <div className="mono absolute inset-0 grid place-items-center p-6 text-center text-[14px] text-[var(--p)]">{error}</div>
      ) : (
        <>
          <div className="mono pointer-events-none absolute top-2 left-2 bg-black/65 px-2.5 py-1.5 text-[12px] leading-relaxed tracking-[0.1em] text-white/80 uppercase">
            <div><span style={{ color: accent }}>spp</span> {info?.samples ?? 0} / {max}</div>
            <div><span style={{ color: accent }}>rate</span> {Math.round(info?.samplesPerSecond ?? 0)} spp/s</div>
            <div><span style={{ color: accent }}>res</span> {info ? `${info.width}×${info.height}` : "—"} · MIS · GGX</div>
            <div className="mt-1 h-[2px] w-32 bg-white/15"><div className="h-full" style={{ width: `${progress * 100}%`, background: accent, boxShadow: `0 0 6px ${accent}` }} /></div>
            {info?.converged && <div className="mt-1" style={{ color: "var(--s)" }}>■ Converged</div>}
          </div>
          <div className="absolute right-2 bottom-2 left-2 flex flex-wrap justify-end gap-1">
            <button onClick={() => setFollow((f) => !f)} aria-pressed={follow} className={btn} style={{ background: follow ? `color-mix(in srgb, var(--s) 45%, black)` : "rgba(0,0,0,.55)", color: "#fff" }}>
              Light follow
            </button>
            {SCENES.map((s, i) => (
              <button key={s.id} onClick={() => pick(i)} aria-pressed={scene === i} className={btn} style={{ background: scene === i ? `color-mix(in srgb, ${accent} 40%, black)` : "rgba(0,0,0,.55)", color: "#fff" }}>
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
