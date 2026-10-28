import type { GroupPair } from "../../lib/figure-types";
import {
  HOURS_DOMAIN,
  HOURS_TICKS,
  SHORT_NIGHT_H,
  fraction,
} from "../../lib/figures";
import { stripLabel, stripSummary, underShare } from "../../lib/figure-text";
import { formatHours } from "../../lib/numbers";
import { Axis } from "./Axis";
import { FigureFrame } from "./FigureFrame";
import { StripRow } from "./StripRow";

const TICKS = HOURS_TICKS.map((h) => ({
  at: fraction(HOURS_DOMAIN, h),
  label: `${h} h`,
}));

/** F2: every night in the two groups of a finding, highlighted group first. */
export function SleepStrips({ pair }: { pair: GroupPair }) {
  return (
    <FigureFrame
      className="fig--strips"
      label={stripLabel(pair)}
      summary={stripSummary(pair)}
    >
      {pair.map((g, i) => (
        <StripRow
          key={g.label}
          name={g.label}
          n={g.n}
          end={underShare(g)}
          values={g.values}
          domain={HOURS_DOMAIN}
          tick={g.mean}
          tickLabel={`mean ${formatHours(g.mean)}`}
          tone={i === 0 ? "accent" : "ink"}
          reference={SHORT_NIGHT_H}
        />
      ))}
      <Axis ticks={TICKS} />
    </FigureFrame>
  );
}
