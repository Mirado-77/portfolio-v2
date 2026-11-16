import { useEffect, useRef, useState } from "react";

/** True while the element is at least partly on screen. */
export function useInView<T extends Element>(margin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, inView };
}

/** Adds the `in` class once the element scrolls into view. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** requestAnimationFrame loop that only runs while `running` is true. dt in seconds, capped. */
export function useAnimationFrame(cb: (dt: number, t: number) => void, running: boolean) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      cbRef.current(dt, now / 1000);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [running]);
}

/** Keys currently held, recorded only while `target` has focus. */
export function useKeys(target: React.RefObject<HTMLElement | null>, onPress?: (key: string, e: KeyboardEvent) => void) {
  const keys = useRef(new Set<string>());
  const pressRef = useRef(onPress);
  pressRef.current = onPress;
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k.startsWith("Arrow") || k === " " || k === "F2" || k === "Tab") e.preventDefault();
      if (!keys.current.has(k)) pressRef.current?.(k, e);
      keys.current.add(k);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    const blur = () => keys.current.clear();
    el.addEventListener("keydown", down);
    el.addEventListener("keyup", up);
    el.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("keydown", down);
      el.removeEventListener("keyup", up);
      el.removeEventListener("blur", blur);
    };
  }, [target]);
  return keys;
}

/** Resize a canvas backing store to its CSS size × devicePixelRatio (capped). Returns [w, h] in CSS px. */
export function fitCanvas(c: HTMLCanvasElement, maxDpr = 2): [number, number] {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = c.clientWidth;
  const h = c.clientHeight;
  if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
    c.width = Math.round(w * dpr);
    c.height = Math.round(h * dpr);
  }
  const ctx = c.getContext("2d");
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
}
