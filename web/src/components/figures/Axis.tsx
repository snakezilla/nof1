import { pct } from "../../lib/figures";

export interface Tick {
  /** Position on the axis, 0 to 1. */
  readonly at: number;
  readonly label: string;
}

/** Mono tick labels under a drawing; the end labels align to the ends so nothing overflows. */
export function Axis({ ticks }: { ticks: readonly Tick[] }) {
  return (
    <div className="axis">
      {ticks.map((t) => (
        <span
          key={t.label}
          className={`axis__tick${t.at <= 0 ? " is-start" : t.at >= 1 ? " is-end" : ""}`}
          style={{ left: pct(t.at) }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
