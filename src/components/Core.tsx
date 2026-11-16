import { useEffect, useRef, useState } from "react";
import { useSlides } from "../slides";
import { HUD } from "../data";
import type { HoloCore } from "../three/HoloCore";

/**
 * Full-screen Three.js layer behind the page: a holographic point cloud that
 * takes the shape of whichever section is on screen.
 */
export default function Core() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const core = useRef<HoloCore | null>(null);
  const [ready, setReady] = useState(0);
  const { slides, active, motion } = useSlides();
  const [size, setSize] = useState(0);
  useEffect(() => {
    let t = 0;
    const on = () => { clearTimeout(t); t = window.setTimeout(() => setSize((n) => n + 1), 200); };
    window.addEventListener("resize", on);
    return () => { clearTimeout(t); window.removeEventListener("resize", on); };
  }, []);

  useEffect(() => {
    let alive = true;
    import("../three/HoloCore")
      .then(({ HoloCore }) => {
        if (!alive || !canvas.current) return;
        try {
          core.current = new HoloCore(canvas.current);
          setReady((n) => n + 1);
        } catch {
          /* no WebGL: the page keeps its plain ground */
        }
      });
    return () => { alive = false; core.current?.dispose(); core.current = null; };
  }, []);

  useEffect(() => { core.current?.setAnimated(motion); }, [motion, ready]);

  useEffect(() => {
    const s = slides[active];
    if (!core.current || !s) return;
    const wide = window.innerWidth >= 1024;
    const project = s.id.startsWith("project-");
    let anchor: [number, number] = project ? [0, wide ? 0 : 0.2] : wide ? [0.35, 0] : [0, 0];
    // experience slides: the text column is on the left
    // project slides: sit over the text column, opposite the demo
    const demo = document.getElementById(s.id)?.querySelector("[data-demo]");
    if (project && demo && wide) {
      const r = demo.getBoundingClientRect();
      anchor = [(r.left + r.width / 2) / window.innerWidth < 0.5 ? 0.5 : -0.5, 0];
    }
    let scale = project ? (wide ? 0.72 : 0.6) : wide ? 0.9 : 0.7;
    // experience slides: the text column is on the left
    if (s.chapter === "Experience" && wide) { anchor = [-0.42, -0.05]; scale = 0.8; }
    // a section can pin the core to an element (the hero reticle)
    const sec = document.getElementById(s.id);
    const pin = sec?.querySelector<HTMLElement>("[data-core-anchor]");
    if (sec && pin) {
      const r = pin.getBoundingClientRect(), top = sec.getBoundingClientRect().top;
      const frame = pin.closest(".aspect-square")?.getBoundingClientRect();
      anchor = [((r.left + r.width / 2) / window.innerWidth) * 2 - 1, Math.max(-0.7, 1 - ((r.top - top + r.height / 2) / window.innerHeight) * 2)];
      // fit the form inside the reticle's inner ring (66% of its radius); 8.4 world units span the viewport height
      if (frame) scale = ((frame.width / 2) * 0.62 * (8.4 / window.innerHeight)) / 3.1;
    }
    core.current.setTarget({
      motif: s.motif,
      primary: s.accent ?? HUD.cyan,
      secondary: s.secondary ?? HUD.orange,
      anchor,
      intensity: s.id === "intro" ? 1 : 0.75,
      scale,
    });
  }, [active, slides, ready, size]);

  return <canvas ref={canvas} aria-hidden className={`pointer-events-none fixed inset-0 z-0 h-full w-full transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} />;
}
