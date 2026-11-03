const STEPS = [
  {
    title: "1. Cleaning the text",
    body: "Before anything else, the text is lower-cased, curly quotes are turned into straight ones, and extra spaces and line breaks are collapsed. This is the same clean_text() function used during training, so the model sees text in the format it learned from.",
  },
  {
    title: "2. TF-IDF turns text into numbers",
    body: "TF-IDF (Term Frequency – Inverse Document Frequency) scores each feature: high when it appears often in this text but is rare across the dataset, low when it is everywhere. The model combines two views: words and two-word phrases (up to 100,000 features, punctuation included), and 3–5 letter character chunks (up to 150,000 features), which capture spelling, word endings and style.",
  },
  {
    title: "3. Logistic Regression makes the decision",
    body: "Logistic Regression learns a weight for every feature. Features seen more often in AI-generated essays push the score up; features more common in human essays push it down. The sum is squashed into a 0–1 probability with the sigmoid function. Text is only labelled AI when that probability reaches the tuned threshold, which reduces false accusations against human writers.",
  },
  {
    title: "4. Reading the probabilities",
    body: "The two bars come from predict_proba(). They describe how confident the model is, based on patterns in its training data. They are not the percentage of the text written by AI, and they can be wrong, especially for short texts, unusual writing styles, or topics unlike the training essays.",
  },
];

function describeSteps(steps) {
  return Object.entries(steps)
    .map(([name, type]) =>
      typeof type === "string"
        ? `${name} (${type})`
        : `${name} (${Object.entries(type)
            .map(([sub, t]) => `${sub}: ${t}`)
            .join(" + ")})`
    )
    .join(" → ");
}

export default function AboutModel({ health }) {
  const data = health.data?.model_loaded ? health.data : null;

  return (
    <section className="card" aria-labelledby="about-heading">
      <h2 id="about-heading" className="text-lg font-semibold text-white">
        About the model
      </h2>
      <p className="mt-1 text-sm text-slate-400">
        An improved scikit-learn pipeline trained on the AI vs Human essay dataset and loaded by the backend with
        joblib.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4"
          >
            <h3 className="text-sm font-semibold text-indigo-200">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.body}</p>
          </div>
        ))}
      </div>

      {data && (
        <div className="mt-4 space-y-1 break-words text-xs text-slate-500">
          <p>Loaded pipeline: {describeSteps(data.pipeline_steps)}</p>
          <p>
            AI decision threshold: {Math.round(data.ai_threshold * 100)}% · Minimum length: {data.min_words} words
          </p>
        </div>
      )}
    </section>
  );
}
