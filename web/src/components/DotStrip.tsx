import { formatDay } from "../lib/dates";
import type { StripDot } from "../lib/checkin";

export function DotStrip({ dots }: { dots: readonly StripDot[] }) {
  const filled = dots.filter((d) => d.filled).length;
  return (
    <ol
      className="strip"
      aria-label={`${filled} of ${dots.length} days answered`}
    >
      {dots.map((d, i) => {
        const { label } = formatDay(d.date);
        const state = d.filled ? "answered" : "not answered";
        return (
          <li
            key={d.date}
            className={`strip__dot${d.filled ? " is-filled" : ""}${d.today ? " is-today" : ""}`}
            title={`Day ${i + 1}, ${label}: ${state}`}
          >
            <span className="visually-hidden">
              Day {i + 1}, {label}, {state}
              {d.today ? ", today" : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
