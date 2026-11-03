import { formatPercent } from "../lib/text";

export default function ProbabilityBar({ label, value, gradient }) {
  const percent = formatPercent(value);
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-semibold tabular-nums text-white">{percent}</span>
      </div>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-[width] duration-700 ease-out`}
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}
