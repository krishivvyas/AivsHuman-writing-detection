import { API_URL } from "../lib/api";

/** Shown when the backend is unreachable or the model file failed to load. */
export default function SetupBanner({ health, onRetry }) {
  if (health.loading) return null;
  if (!health.error && health.data?.model_loaded) return null;

  const message = health.error
    ? `Cannot reach the backend at ${API_URL}. Start it from the backend folder with: uvicorn app.main:app --reload --port 8000`
    : health.data?.error || "The model is not loaded.";

  return (
    <div role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold text-amber-200">Setup required</p>
          <p className="mt-1 break-words text-amber-100/90">{message}</p>
          <p className="mt-1 text-amber-100/70">
            See the README section “Model file” for where to put the .joblib file.
          </p>
        </div>
        <button type="button" onClick={onRetry} className="btn-ghost shrink-0">
          Retry
        </button>
      </div>
    </div>
  );
}
