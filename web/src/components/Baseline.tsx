import { formatHours } from "../lib/numbers";
import type { Experiment } from "../lib/types";

interface Figure {
  readonly key: string;
  readonly value: string;
  readonly label: string;
}

export const baselineFigures = (b: Experiment["baseline"]): readonly Figure[] =>
  [
    b.sleep_h != null
      ? { key: "sleep", value: formatHours(b.sleep_h), label: b.label }
      : null,
    b.hrv_ms != null
      ? { key: "hrv", value: `${Math.round(b.hrv_ms)} ms`, label: "HRV" }
      : null,
  ].filter((f): f is Figure => f !== null);

export function Baseline({ baseline }: { baseline: Experiment["baseline"] }) {
  const figures = baselineFigures(baseline);
  if (figures.length === 0) return null;
  return (
    <div className="test__block">
      <h5 className="test__label">Baseline</h5>
      <div className="baseline">
        {figures.map((f) => (
          <div className="figure" key={f.key}>
            <p className="figure__value">{f.value}</p>
            <p className="figure__label">{f.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
