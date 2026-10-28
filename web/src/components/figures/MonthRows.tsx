import type { MonthRow } from "../../lib/figure-types";
import {
  TINTS,
  fraction,
  monthSegments,
  ticks,
  totalMinutes,
} from "../../lib/figures";
import {
  monthsCaption,
  monthsLabel,
  monthsSummary,
} from "../../lib/figure-text";
import { formatHours } from "../../lib/numbers";
import { Axis } from "./Axis";
import { FigureFrame, Key } from "./FigureFrame";

const VIEW_W = 1000;
const TINT_OPACITY = Object.fromEntries(TINTS.map((t) => [t.key, t.opacity]));
const BAR_H = 16;
/** Axis ticks every 20 hours. */
const STEP_MIN = 1200;

function Bar({ month, max }: { month: MonthRow; max: number }) {
  if (month.nights === 0 && totalMinutes(month.training_min) === 0) {
    return <span className="months__empty">no readings</span>;
  }
  return (
    <svg
      className="months__svg"
      viewBox={`0 0 ${VIEW_W} ${BAR_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {monthSegments(month.training_min).map((s) => (
        <rect
          key={s.tint}
          className="months__seg"
          fillOpacity={TINT_OPACITY[s.tint]}
          x={(s.offset / max) * VIEW_W}
          width={(s.minutes / max) * VIEW_W}
          height={BAR_H}
        />
      ))}
    </svg>
  );
}

/** F5: one row per month, training minutes stacked by type, nights and median sleep at the right. */
export function MonthRows({ months }: { months: readonly MonthRow[] }) {
  const busiest = Math.max(
    1,
    ...months.map((m) => totalMinutes(m.training_min)),
  );
  const max = Math.ceil(busiest / STEP_MIN) * STEP_MIN;
  return (
    <FigureFrame
      className="fig--wide"
      kicker="Training time by month, with nights and median sleep"
      label={monthsLabel(months)}
      summary={monthsSummary(months)}
      caption={monthsCaption(months)}
      legend={TINTS.map((t) => (
        <Key key={t.key} swatch="is-ink" opacity={t.opacity}>
          {t.label}
        </Key>
      ))}
    >
      <div className="months">
        <p className="months__row months__head">
          <span />
          <span>Training</span>
          <span className="num">Nights</span>
          <span className="num">Median</span>
        </p>
        {months.map((m) => (
          <p
            key={m.month}
            className={`months__row${m.nights === 0 ? " is-empty" : ""}`}
          >
            <span className="months__label">{m.label}</span>
            <span className="months__bar">
              <Bar month={m} max={max} />
            </span>
            <span className="num">{m.nights > 0 ? m.nights : ""}</span>
            <span className="num">
              {m.median_sleep !== null ? formatHours(m.median_sleep) : ""}
            </span>
          </p>
        ))}
        <div className="months__row months__scale">
          <span />
          <Axis
            ticks={ticks(0, max, STEP_MIN).map((v) => ({
              at: fraction([0, max], v),
              label: `${v / 60} h`,
            }))}
          />
        </div>
      </div>
    </FigureFrame>
  );
}
