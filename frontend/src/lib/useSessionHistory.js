import { useEffect, useState } from "react";

const KEY = "ai-human-classifier:history";
const MAX_ITEMS = 20;

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Analysis history kept in sessionStorage, so it lasts only for this browser tab/session. */
export function useSessionHistory() {
  const [history, setHistory] = useState(load);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(history));
    } catch {
      /* storage unavailable (private mode etc.) - history still works in memory */
    }
  }, [history]);

  const add = (entry) => setHistory((prev) => [entry, ...prev].slice(0, MAX_ITEMS));
  const clear = () => setHistory([]);

  return { history, add, clear };
}
