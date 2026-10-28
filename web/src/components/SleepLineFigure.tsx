import { formatDay, formatMonthYearLong } from "../lib/dates";
import { formatHours } from "../lib/numbers";
import { LINE_H, LINE_W, type SleepLine } from "../lib/sleepline";

const pct = (f: number): string => `${(f * 100).toFixed(2)}%`;

export const lineSummary = (line: SleepLine): string =>
  [
    line.windowMean !== null
      ? `${formatHours(line.windowMean)} a night in the table`
      : null,
    line.yearMean !== null
      ? `${formatHours(line.yearMean)} across the year`
      : null,
  ]
    .filter((s): s is string => s !== null)
    .join(", ");

export function SleepLineFigure({ line }: { line: SleepLine }) {
  const b = line.bracket;
  return (
    <figure className="sleepline">
      <svg
        className="sleepline__svg"
        viewBox={`0 0 ${LINE_W} ${LINE_H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Hours of sleep, seven-night average, ${formatMonthYearLong(line.from)} to ${formatMonthYearLong(line.to)}`}
      >
        <path
          className="sleepline__path"
          d={line.path}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="sleepline__axis sleepline__ends">
        <span>{formatMonthYearLong(line.from)}</span>
        <span>{formatMonthYearLong(line.to)}</span>
      </div>
      {b && (
        <div className="sleepline__bracket">
          <span
            className="sleepline__span"
            style={{ left: pct(b.start), right: pct(1 - b.end) }}
            aria-hidden="true"
          />
          <span
            className="sleepline__bracket-labels"
            style={{ right: pct(1 - b.end), minWidth: pct(b.end - b.start) }}
          >
            <span>{formatDay(b.from).label}</span>
            <span>{formatDay(b.to).label}</span>
          </span>
        </div>
      )}
      <figcaption className="sleepline__caption">
        Seven-night average; breaks in the line are nights with no data. The
        bracket marks the nights in the table. {lineSummary(line)}.
      </figcaption>
    </figure>
  );
}
