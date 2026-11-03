export default function Header({ health }) {
  const status = health.loading
    ? { text: "Checking backend…", dot: "bg-slate-400 animate-pulse" }
    : health.error
      ? { text: "Backend offline", dot: "bg-rose-400" }
      : health.data?.model_loaded
        ? { text: "Model loaded", dot: "bg-emerald-400" }
        : { text: "Model not loaded", dot: "bg-amber-400" };

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300/80">
          Machine Learning Project
        </p>
        <h1 className="mt-2 bg-gradient-to-r from-white via-indigo-100 to-violet-300 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
          AI vs Human Text Classifier
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Paste a passage to see how a word + character TF-IDF and Logistic Regression model classifies it.
        </p>
      </div>
      <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 sm:self-auto">
        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
        {status.text}
      </div>
    </header>
  );
}
