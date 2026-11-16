import { useEffect, useState } from "react";
import { HexBadge } from "./hud";

const LINES = [
  "BIOS // A.RAVELONAHINA v2.0",
  "MOUNT /projects ............ 7 OK",
  "LOAD three.js core ......... OK",
  "LOAD path-tracer (webgl2) .. OK",
  "CALIBRATE HUD .............. OK",
];

/** Short boot sequence, once per session. Skipped with motion off. */
export default function Boot() {
  const [skip] = useState(() => {
    try { if (sessionStorage.getItem("booted")) return true; sessionStorage.setItem("booted", "1"); } catch { /* ignore */ }
    return document.documentElement.dataset.motion === "off";
  });
  const [n, setN] = useState(0);
  const [done, setDone] = useState(skip);
  useEffect(() => {
    if (skip) return;
    const ids = LINES.map((_, i) => setTimeout(() => setN(i + 1), 120 + i * 170));
    ids.push(setTimeout(() => setDone(true), 120 + LINES.length * 170 + 350));
    const end = () => setDone(true);
    window.addEventListener("keydown", end, { once: true });
    window.addEventListener("pointerdown", end, { once: true });
    return () => { ids.forEach(clearTimeout); window.removeEventListener("keydown", end); window.removeEventListener("pointerdown", end); };
  }, [skip]);
  if (skip) return null;
  return (
    <div className="boot" data-done={done ? "" : undefined} aria-hidden>
      <div className="w-[min(420px,86vw)]">
        <div className="flex items-center gap-4">
          <HexBadge text="AR" size={56} />
          <div>
            <p className="display text-lg text-ink">System boot</p>
            <p className="mono text-[13px] tracking-[0.2em] text-[var(--s)]">INITIALISING INTERFACE</p>
          </div>
        </div>
        <ul className="mono mt-6 space-y-1 text-[14px] text-ink-2">
          {LINES.slice(0, n).map((l) => <li key={l}><span className="text-[var(--p)]">&gt;</span> {l}</li>)}
        </ul>
        <div className="mt-5 h-[3px] bg-line">
          <div className="h-full bg-[var(--p)] shadow-[0_0_10px_var(--p)] transition-[width] duration-200" style={{ width: `${(n / LINES.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
