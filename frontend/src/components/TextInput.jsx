import { SAMPLES } from "../lib/samples";
import { countWords } from "../lib/text";

export default function TextInput({ text, onChange, onAnalyze, onClear, loading, maxChars, minWords }) {
  const words = countWords(text);
  const chars = text.length;
  const tooLong = chars > maxChars;
  const tooShort = words > 0 && words < minWords;
  const canAnalyze = words >= Math.max(minWords, 1) && !tooLong && !loading;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canAnalyze) onAnalyze();
  };

  return (
    <section className="card" aria-labelledby="input-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="input-heading" className="text-lg font-semibold text-white">
          Text to analyze
        </h2>
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="btn-ghost px-3 py-1.5 text-xs"
              onClick={() => onChange(s.text)}
              disabled={loading}
              title="Example text from the project dataset"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="text-input" className="sr-only">
        Text to analyze
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste an essay, paragraph or article here…"
        className="mt-4 h-64 w-full resize-y rounded-xl border border-white/10 bg-navy-950/70 p-4 text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:h-72"
      />

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-xs ${tooLong ? "text-rose-300" : tooShort ? "text-amber-300" : "text-slate-400"}`}>
          <span className="font-medium text-slate-200">{chars.toLocaleString()}</span> characters ·{" "}
          <span className="font-medium text-slate-200">{words.toLocaleString()}</span> words
          {tooLong && ` · limit is ${maxChars.toLocaleString()} characters`}
          {tooShort && ` · at least ${minWords} words needed for a reliable estimate`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost flex-1 sm:flex-none"
            onClick={onClear}
            disabled={loading || !text}
          >
            Clear Text
          </button>
          <button
            type="button"
            className="btn-primary flex-1 sm:flex-none"
            onClick={onAnalyze}
            disabled={!canAnalyze}
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            {loading ? "Analyzing…" : "Analyze Text"}
          </button>
        </div>
      </div>
    </section>
  );
}
