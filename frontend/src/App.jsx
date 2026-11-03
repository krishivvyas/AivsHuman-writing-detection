import { useCallback, useEffect, useRef, useState } from "react";
import AboutModel from "./components/AboutModel";
import Header from "./components/Header";
import HistoryPanel from "./components/HistoryPanel";
import ResultCard from "./components/ResultCard";
import SetupBanner from "./components/SetupBanner";
import TextInput from "./components/TextInput";
import { getHealth, predictText } from "./lib/api";
import { useSessionHistory } from "./lib/useSessionHistory";

// Fallbacks until /health reports the backend's actual limits.
const DEFAULT_MAX_CHARS = 50000;
const DEFAULT_MIN_WORDS = 1;

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState({ loading: true, data: null, error: null });
  const { history, add, clear } = useSessionHistory();
  const abortRef = useRef(null);
  const maxChars = health.data?.max_chars ?? DEFAULT_MAX_CHARS;
  const minWords = health.data?.model_loaded ? health.data.min_words : DEFAULT_MIN_WORDS;

  const checkHealth = useCallback(async () => {
    setHealth((h) => ({ ...h, loading: true }));
    try {
      setHealth({ loading: false, data: await getHealth(), error: null });
    } catch (e) {
      setHealth({ loading: false, data: null, error: e.message });
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please paste some text before analyzing.");
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const data = await predictText(text, controller.signal);
      setResult(data);
      add({ id: `${Date.now()}-${Math.random()}`, time: Date.now(), text: text.trim().slice(0, 300), ...data });
    } catch (e) {
      if (e.name === "AbortError") return;
      setResult(null);
      setError(e.message);
      // The backend may have gone down or failed to load the model - refresh the status banner.
      if (e.message.startsWith("Cannot reach") || e.message.startsWith("Model not available")) checkHealth();
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const handleSelectHistory = (item) => {
    setResult(item);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-32 top-24 h-[24rem] w-[24rem] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <Header health={health} />
        <SetupBanner health={health} onRetry={checkHealth} />

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TextInput
              text={text}
              onChange={setText}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              loading={loading}
              maxChars={maxChars}
              minWords={minWords}
            />
          </div>
          <div className="lg:col-span-2">
            <ResultCard result={result} error={error} />
          </div>
        </div>

        <HistoryPanel history={history} onSelect={handleSelectHistory} onClear={clear} />
        <AboutModel health={health} />

        <footer className="pb-4 text-center text-xs text-slate-500">
          College ML project · TF-IDF + Logistic Regression · Results are estimates, not proof of authorship.
        </footer>
      </main>
    </div>
  );
}
