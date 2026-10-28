import type { TypicalNight as Night } from "../../lib/figure-types";
import { fraction, hourTick, nightAxis, pct } from "../../lib/figures";
import { typicalLabel, typicalSummary } from "../../lib/figure-text";
import { clockLabel } from "../../lib/format";
import { formatHours } from "../../lib/numbers";
import { Axis } from "./Axis";
import { FigureFrame, Key } from "./FigureFrame";

const VIEW_W = 1000;
const BAR_H = 32;

/** F3: one bar from the median lights-out to the median wake, asleep in ink, awake outlined. */
export function TypicalNight({ night }: { night: Night }) {
  const { domain, ticks } = nightAxis(night.bed_h, night.wake_h);
  const bed = fraction(domain, night.bed_h);
  const asleepEnd = fraction(domain, night.bed_h + night.sleep_h);
  const wake = fraction(domain, night.wake_h);
  return (
    <FigureFrame
      className="fig--night"
      kicker="A typical night, medians"
      label={typicalLabel(night)}
      summary={typicalSummary(night)}
      caption={`Medians of ${night.n} nights. The outlined end is the time awake during the night, put together.`}
      legend={
        <>
          <Key swatch="is-ink">asleep</Key>
          <Key swatch="is-none">awake</Key>
        </>
      }
    >
      <div className="night">
        <p className="night__ends">
          <span style={{ left: pct(bed) }}>
            lights out {clockLabel(night.bed_h)}
          </span>
          <span className="is-end" style={{ right: pct(1 - wake) }}>
            up {clockLabel(night.wake_h)}
          </span>
        </p>
        <div className="night__bar">
          <svg
            viewBox={`0 0 ${VIEW_W} ${BAR_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              className="night__asleep"
              x={bed * VIEW_W}
              width={(asleepEnd - bed) * VIEW_W}
              height={BAR_H}
            />
            <rect
              className="night__awake"
              x={asleepEnd * VIEW_W}
              y="0.5"
              width={(wake - asleepEnd) * VIEW_W}
              height={BAR_H - 1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span
            className="night__hours"
            style={{ left: pct(bed), right: pct(1 - asleepEnd) }}
          >
            {formatHours(night.sleep_h)} asleep
          </span>
        </div>
        <p className="night__awake-label">
          <span style={{ right: pct(1 - wake) }}>
            {night.awake_min} min awake
          </span>
        </p>
        <Axis
          ticks={ticks.map((h) => ({
            at: fraction(domain, h),
            label: hourTick(h),
          }))}
        />
      </div>
    </FigureFrame>
  );
}
