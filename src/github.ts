import { useEffect, useState } from "react";
import { GITHUB_USER, languageSnapshot } from "./data";

export type Repo = {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
};

type State = { repos: Repo[] | null; languages: Record<string, Record<string, number>> };

let cache: Promise<State> | null = null;

const CACHE_KEY = "gh-cache-v1";
const CACHE_MS = 60 * 60 * 1000; // the unauthenticated API allows 60 requests / hour

async function load(): Promise<State> {
  try {
    const hit = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null");
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.state as State;
  } catch {
    /* storage unavailable: fetch */
  }
  const state = await fetchState();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), state }));
  } catch {
    /* ignore */
  }
  return state;
}

async function fetchState(): Promise<State> {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`);
  if (!res.ok) throw new Error(String(res.status));
  const repos = ((await res.json()) as Repo[]).filter((r) => !r.fork);
  const languages = { ...languageSnapshot };
  await Promise.all(
    repos
      .filter((r) => r.name !== "portfolio")
      .map(async (r) => {
        try {
          const l = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${r.name}/languages`);
          if (l.ok) languages[r.name] = await l.json();
        } catch {
          /* keep snapshot */
        }
      }),
  );
  return { repos, languages };
}

/** Public repos of the account, fetched once per page load. Falls back to the snapshot. */
export function useGithub(): State {
  const [state, setState] = useState<State>({ repos: null, languages: languageSnapshot });
  useEffect(() => {
    cache ??= load().catch(() => ({ repos: null, languages: languageSnapshot }));
    let alive = true;
    cache.then((s) => alive && setState(s));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
