import type { Bedtime } from "../../lib/figure-types";
import {
  BED_DOMAIN,
  BED_TICKS,
  fraction,
  hourTick,
  pct,
} from "../../lib/figures";
import {
  bedCaption,
  bedGap,
  bedLabel,
  bedSummary,
} from "../../lib/figure-text";
import { clockLabel } from "../../lib/format";
import { Axis } from "./Axis";
import { FigureFrame } from "./FigureFrame";
import { StripRow } from "./StripRow";

const TICKS = BED_TICKS.map((h) => ({
  at: fraction(BED_DOMAIN, h),
  label: hourTick(h),
}));

/** F4: lights-out on weekend and weekday nights, medians ticked and the gap bracketed. */
export function Bedtimes({ bedtime }: { bedtime: Bedtime }) {
  const rows = [
    { key: "weekend", name: "weekend nights", group: bedtime.weekend },
    { key: "weekday", name: "weekday nights", group: bedtime.weekday },
  ] as const;
  const a = fraction(BED_DOMAIN, bedtime.weekend.median);
  const b = fraction(BED_DOMAIN, bedtime.weekday.median);
  return (
    <FigureFrame
      className="fig--strips"
      kicker="Lights out, one dot per night"
      label={bedLabel()}
      summary={bedSummary(bedtime)}
      caption={bedCaption(bedtime)}
    >
      {rows.map((r, i) => (
        <StripRow
          key={r.key}
          name={r.name}
          n={r.group.n}
          end={`median ${clockLabel(r.group.median)}`}
          values={r.group.values}
          domain={BED_DOMAIN}
          tick={r.group.median}
          tickLabel={clockLabel(r.group.median)}
          tone={i === 0 ? "accent" : "ink"}
        />
      ))}
      <p className="gap">
        <span
          className="gap__span"
          style={{ left: pct(Math.min(a, b)), width: pct(Math.abs(a - b)) }}
        />
        <span className="gap__label" style={{ left: pct(Math.max(a, b)) }}>
          {bedGap(bedtime)} min
        </span>
      </p>
      <Axis ticks={TICKS} />
    </FigureFrame>
  );
}
