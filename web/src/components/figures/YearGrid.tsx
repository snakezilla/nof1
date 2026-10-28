import type { Calendar, Figures } from "../../lib/figure-types";
import {
  CELL,
  STEP_OPACITY,
  SLEEP_STEPS,
  WEEKEND_DAYS,
  cellOrigin,
  gridSize,
  laneFraction,
  pct,
  sleepStep,
  type Orientation,
} from "../../lib/figures";
import { yearCaption, yearLabel, yearSummary } from "../../lib/figure-text";
import { FigureFrame, Key } from "./FigureFrame";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Wide grid: only the first and last rows are named; the bracket names the weekend. */
const WIDE_DAYS = [0, 6];

function Cells({ calendar, o }: { calendar: Calendar; o: Orientation }) {
  const { width, height } = gridSize(calendar.weeks, o);
  return (
    <svg className="cal__svg" viewBox={`0 0 ${width} ${height}`}>
      {calendar.cells.map((c) => {
        const { x, y } = cellOrigin(c, o);
        const step = sleepStep(c.sleep_h);
        return step === null ? (
          <rect
            key={c.date}
            className="cal__none"
            x={x + 0.5}
            y={y + 0.5}
            width={CELL - 1}
            height={CELL - 1}
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <rect
            key={c.date}
            className="cal__night"
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            fillOpacity={STEP_OPACITY[step]}
          />
        );
      })}
    </svg>
  );
}

function Grid({ calendar, o }: { calendar: Calendar; o: Orientation }) {
  const weekend = laneFraction(Math.min(...WEEKEND_DAYS), 7);
  const days = o === "wide" ? WIDE_DAYS : DAY_NAMES.map((_, i) => i);
  const along = o === "wide" ? "left" : "top";
  const across = o === "wide" ? "top" : "left";
  return (
    <div className={`cal cal--${o}`}>
      <div className="cal__months">
        {calendar.months.map((m) => (
          <span
            key={m.label}
            style={{ [along]: pct(laneFraction(m.week, calendar.weeks)) }}
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="cal__days">
        {days.map((d) => (
          <span key={d} style={{ [across]: pct(laneFraction(d, 7)) }}>
            {o === "wide" ? DAY_NAMES[d] : DAY_NAMES[d].charAt(0)}
          </span>
        ))}
        <span className="cal__weekend" style={{ [across]: pct(weekend) }} />
      </div>
      <Cells calendar={calendar} o={o} />
    </div>
  );
}

/** F1: every night of the year, one square each, shaded by hours asleep. */
export function YearGrid({ figures }: { figures: Figures }) {
  return (
    <FigureFrame
      className="fig--wide"
      kicker="One square per night, shaded by hours asleep"
      label={yearLabel(figures)}
      summary={yearSummary(figures)}
      caption={yearCaption(figures)}
      legend={
        <>
          {SLEEP_STEPS.map((s, i) => (
            <Key key={s} swatch="is-ink" opacity={STEP_OPACITY[i]}>
              {s}
            </Key>
          ))}
          <Key swatch="is-none">no reading</Key>
          <Key swatch="is-weekend">Sat and Sun</Key>
        </>
      }
    >
      <Grid calendar={figures.calendar} o="wide" />
      <Grid calendar={figures.calendar} o="tall" />
    </FigureFrame>
  );
}
