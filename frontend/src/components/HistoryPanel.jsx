import { formatPercent } from "../lib/text";

export default function HistoryPanel({ history, onSelect, onClear }) {
  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="history-heading" className="text-lg font-semibold text-white">
            Session history
          </h2>
          <p className="text-xs text-slate-400">Stored only in this browser tab; cleared when the session ends.</p>
        </div>
        {history.length > 0 && (
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onClear}>
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No analyses yet.</p>
      ) : (
        <ul className="mt-4 grid max-h-96 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
          {history.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="h-full w-full rounded-xl border border-white/5 bg-white/[0.03] p-3 text-left transition hover:border-indigo-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className={`font-semibold ${item.label === "AI-Generated" ? "text-violet-300" : "text-sky-300"}`}>
                    {item.label}
                  </span>
                  <span className="text-slate-500">{new Date(item.time).toLocaleTimeString()}</span>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm text-slate-300">{item.text}</p>
                <p className="mt-1 text-xs tabular-nums text-slate-500">
                  Human {formatPercent(item.human_probability)} · AI {formatPercent(item.ai_probability)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
