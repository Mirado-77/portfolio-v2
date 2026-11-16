import { useEffect, useRef, useState } from "react";
import type { DemoProps } from "../components/DemoFrame";
import { projects, profile } from "../data";

/*
 * A scripted emulation of the SensAI CLI: the slash commands, streamed answers,
 * tool calls with risk levels and approval, token / context-window accounting.
 * Answers are canned — the real assistant talks to a local model through Ollama.
 */

type Line = { kind: "user" | "ai" | "sys" | "tool" | "meta" | "dim"; text: string };
const NUM_CTX = 8192;

const TOOLS = [
  ["read_file", "read"], ["list_dir", "read"], ["search_code", "read"], ["web_search", "read"], ["ask_user", "read"],
  ["edit_file", "write"], ["write_file", "write"], ["run_command", "exec · docker sandbox"],
];
const PERSONAS = ["dev", "reviewer"];

function answer(q: string): { tool?: [string, string, string]; text: string } {
  const s = q.toLowerCase();
  if (/^(hi|hello|hey|salut|bonjour)/.test(s)) return { text: "Hello! I'm SENSAI, running on a local model through Ollama. Ask me about the code, or try /tools." };
  if (s.includes("name")) return { text: "You haven't told me yet — try `/profile set name <you>`. Your profile is sent at every turn, in every session." };
  if (s.includes("who") && (s.includes("made") || s.includes("built") || s.includes("author"))) return { text: `I was built at Epitech, with ${profile.name} on the team: a CLI agent talking straight to Ollama's HTTP API, with no LLM framework.` };
  if (s.includes("project") || s.includes("repo") || s.includes("files") || s.includes("ls")) {
    return { tool: ["list_dir", `{"path": "~/projects"}`, projects.map((p) => p.repo + "/").join("  ")], text: `There are ${projects.length} projects. The biggest are zappy (C++/C/Python) and raytracer (C++). Want me to open one?` };
  }
  if (s.includes("test")) return { tool: ["run_command", `{"cmd": "pytest -q"}`, "tests/unit ................................ passed"], text: "The unit tests pass. The command ran in the Docker sandbox, without network access." };
  if (s.includes("search") || s.includes("where") || s.includes("find")) return { tool: ["search_code", `{"query": "${q.slice(0, 40)}"}`, "src/sensai/memory/sqlite_store.py:42-71  (0.83)\ntests/unit/test_sqlite_store.py:10-34  (0.79)"], text: "The closest excerpts are in the SQLite store and its tests. I can read either file if you want." };
  if (s.includes("bug") || s.includes("fix")) return { text: "Paste the failing test or the traceback and I'll locate it. With /pair, the dev persona fixes it and the reviewer checks the patch." };
  return { text: "In the real CLI this goes to your local model. Here I'm a scripted demo — try asking for your projects, to run the tests, to search the code, or type /help." };
}

export default function SensAI({ running, accent }: DemoProps) {
  const [lines, setLines] = useState<Line[]>([
    { kind: "meta", text: "SENSAI | model: qwen3.5:9b | persona: dev | /exit or Ctrl-D to quit" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [persona, setPersona] = useState("dev");
  const ctx = useRef(312);
  const hist = useRef<string[]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const runningRef = useRef(running); runningRef.current = running;

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [lines]);

  const push = (l: Line) => setLines((ls) => [...ls, l]);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const stream = async (kind: Line["kind"], text: string, speed = 18) => {
    push({ kind, text: "" });
    const tokens = text.match(/\S+\s*/g) ?? [text];
    let acc = "";
    for (const t of tokens) {
      while (!runningRef.current) await sleep(200);
      acc += t;
      setLines((ls) => [...ls.slice(0, -1), { kind, text: acc }]);
      await sleep(speed + Math.random() * speed);
    }
  };

  const turn = async (q: string, typed = false) => {
    if (typed) {
      push({ kind: "user", text: "" });
      for (let i = 1; i <= q.length; i++) { setLines((ls) => [...ls.slice(0, -1), { kind: "user", text: q.slice(0, i) }]); await sleep(45); }
    } else push({ kind: "user", text: q });
    hist.current.push(q);
    await sleep(250);

    if (q.startsWith("/")) return command(q);
    const a = answer(q);
    if (a.tool) {
      const [name, args, out] = a.tool;
      const risk = TOOLS.find((t) => t[0] === name)?.[1] ?? "read";
      push({ kind: "tool", text: `tool> ${name}(${args})  [${risk}]` });
      if (risk.startsWith("exec")) { await sleep(400); push({ kind: "dim", text: "  allow? [y/N] y" }); }
      await sleep(500);
      out.split("\n").forEach((o) => push({ kind: "dim", text: "  " + o }));
    }
    await stream("ai", a.text);
    const prompt = 20 + Math.round(q.length / 3), completion = Math.round(a.text.length / 4);
    const next = ctx.current + prompt + completion + (a.tool ? 120 : 0);
    ctx.current = next;
    push({ kind: "meta", text: `${prompt + completion} tokens (prompt ${prompt}, completion ${completion}) · context ${next}/${NUM_CTX} (${Math.round((next / NUM_CTX) * 100)}%)` });
  };

  const command = async (q: string) => {
    const [cmd, ...rest] = q.trim().split(/\s+/);
    const arg = rest.join(" ");
    switch (cmd) {
      case "/help":
        ["/tools  /history  /fork <n>  /profile  /memory  /doc", "/cache clear  /persona [name]  /pair <task>  /clear  /exit"].forEach((t) => push({ kind: "sys", text: t }));
        break;
      case "/tools":
        TOOLS.forEach(([n, r]) => push({ kind: "sys", text: `  ${n.padEnd(13)} ${r}` }));
        break;
      case "/history":
        hist.current.forEach((h, i) => push({ kind: "sys", text: `  ${String(i + 1).padStart(2)}  you: ${h}` }));
        if (!hist.current.length) push({ kind: "sys", text: "  (empty)" });
        break;
      case "/persona":
        if (arg && PERSONAS.includes(arg)) { setPersona(arg); push({ kind: "sys", text: `persona> ${arg} (next turns, same session)` }); }
        else PERSONAS.forEach((p) => push({ kind: "sys", text: `  ${p === persona ? "*" : " "} ${p}` }));
        break;
      case "/profile":
        push({ kind: "sys", text: "  instructions: (none)" });
        push({ kind: "sys", text: "  language = Python · tone = concise" });
        break;
      case "/memory":
        push({ kind: "sys", text: "  m1  project uses pytest, run with `make test`" });
        push({ kind: "sys", text: "  m2  sandbox image: sensai-sandbox:latest" });
        break;
      case "/doc":
        ["goal: show what SENSAI can do", "decisions: canned answers, no network", "done: tools, personas, streaming", "left: try /pair"].forEach((t) => push({ kind: "sys", text: "  " + t }));
        break;
      case "/cache":
        push({ kind: "sys", text: arg === "clear" ? "cache> 3 entries removed" : "usage: /cache clear" });
        break;
      case "/fork":
        push({ kind: "sys", text: `fork> new session from message ${arg || 1}; the original session is kept` });
        break;
      case "/clear":
        setLines([{ kind: "meta", text: "SENSAI | model: qwen3.5:9b | persona: " + persona }]);
        break;
      case "/pair": {
        const task = arg || "add a --verbose flag to sensai ask";
        push({ kind: "sys", text: `pair> dev: ${task}` });
        await sleep(300);
        push({ kind: "tool", text: `tool> edit_file({"path": "src/sensai/cli.py"})  [write]` });
        await stream("ai", "dev> Added the flag and its help text; it raises the log level to DEBUG.");
        await sleep(300);
        await stream("ai", "reviewer> Changes requested: the flag is not covered by a test.");
        push({ kind: "tool", text: `tool> write_file({"path": "tests/unit/test_cli.py"})  [write]` });
        await stream("ai", "dev> Added test_ask_verbose.");
        await stream("ai", "reviewer> Approved ✓ (round 2/2)");
        break;
      }
      case "/exit":
      case "/quit":
        push({ kind: "sys", text: "bye. (this is a demo — the session stays open)" });
        break;
      default:
        push({ kind: "sys", text: `unknown command ${cmd} — /help` });
    }
  };

  const enqueue = (q: string, typed = false) => {
    setBusy(true);
    queue.current = queue.current.then(() => turn(q, typed)).finally(() => setBusy(false));
  };

  // a short scripted intro, as in the README
  useEffect(() => {
    if (!running || started.current) return;
    started.current = true;
    (async () => {
      await sleep(500);
      enqueue("what projects do I have?", true);
      enqueue("/tools", true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const color: Record<Line["kind"], string> = { user: "#e2e8f0", ai: accent, sys: "#94a3b8", tool: "#facc15", meta: "#64748b", dim: "#94a3b8" };

  return (
    <div className="flex h-full w-full flex-col bg-[#041311] font-mono text-[12px] leading-relaxed sm:text-xs" onClick={() => inputRef.current?.focus()}>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto p-3">
        {lines.map((l, i) => (
          <div key={i} className="break-words whitespace-pre-wrap" style={{ color: color[l.kind] }}>
            {l.kind === "user" && <span className="text-emerald-400">you&gt; </span>}
            {l.kind === "ai" && !/^(dev|reviewer)>/.test(l.text) && <span className="text-teal-200">sensai&gt; </span>}
            {l.text}
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 border-t border-teal-900/60 px-3 py-2"
        onSubmit={(e) => { e.preventDefault(); const q = input.trim(); if (!q || busy) return; setInput(""); enqueue(q); }}
      >
        <span className="text-emerald-400">you&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "…" : "type a message or /help"}
          className="min-w-0 flex-1 bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
          aria-label="Message to SensAI"
        />
        <span className="hidden text-[12px] text-slate-500 sm:inline">persona: {persona}</span>
      </form>
    </div>
  );
}
