import ProbabilityBar from "./ProbabilityBar";

const DISCLAIMER = "These are machine-learning estimates, not proof of authorship.";

export default function ResultCard({ result, error }) {
  const isAI = result?.label === "AI-Generated";

  return (
    <section className="card h-full" aria-labelledby="result-heading" aria-live="polite">
      <h2 id="result-heading" className="text-lg font-semibold text-white">
        Result
      </h2>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!error && !result && (
        <p className="mt-4 text-sm text-slate-400">
          Paste some text and press <span className="text-slate-200">Analyze Text</span> to see the model’s
          prediction.
        </p>
      )}

      {result && !error && (
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Predicted class</p>
            <p
              className={`mt-1 inline-flex rounded-xl px-3 py-1.5 text-xl font-bold ring-1 ${
                isAI
                  ? "bg-violet-500/15 text-violet-200 ring-violet-400/30"
                  : "bg-sky-500/15 text-sky-200 ring-sky-400/30"
              }`}
            >
              {isAI ? "AI-Generated" : "Human-Written"}
            </p>
          </div>

          <div className="space-y-4">
            <ProbabilityBar
              label="Estimated Human probability"
              value={result.human_probability}
              gradient="from-sky-400 to-cyan-300"
            />
            <ProbabilityBar
              label="Estimated AI probability"
              value={result.ai_probability}
              gradient="from-indigo-400 to-violet-400"
            />
          </div>

          <p className="text-xs text-slate-400">
            Probabilities come from the model’s <code className="text-slate-300">predict_proba()</code>. They show how
            confident the classifier is, not what share of the text was written by AI.
            {result.ai_threshold != null && (
              <>
                {" "}Text is labelled AI-Generated only when the AI probability is at least{" "}
                <span className="font-medium text-slate-200">{Math.round(result.ai_threshold * 100)}%</span> (the
                model’s tuned decision threshold).
              </>
            )}
          </p>
        </div>
      )}

      <p className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
        <span className="font-semibold text-slate-100">Disclaimer: </span>
        {DISCLAIMER}
      </p>
    </section>
  );
}
