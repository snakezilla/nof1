import { useMemo } from "react";
import { fraction, pct, stripDots, type Domain } from "../../lib/figures";

/** Packing for the dots: 6 px dots, 11 lanes 5 px apart, laid out for a 520 px row. */
const DOT = 6;
const LANES = 11;
const LANE_STEP = 5;
const PACK_WIDTH = 520;
export const BAND_H = (LANES - 1) * LANE_STEP + DOT + 4;
const VIEW_W = 1000;

interface Props {
  name: string;
  /** Nights in the row, kept on one line with its "n =". */
  n: number;
  /** Printed at the right end of the row, e.g. "20% under 6 h". */
  end: string;
  values: readonly number[];
  domain: Domain;
  /** The median or mean, drawn as a 2 px tick. */
  tick: number;
  tickLabel: string;
  tone: "accent" | "ink";
  /** A hairline for reference, e.g. 6 h. */
  reference?: number;
}

const x = (f: number): string => (f * VIEW_W).toFixed(1);

/** One row of a strip plot: every value a dot, one tick, the row's numbers at the ends. */
export function StripRow({
  name,
  n,
  end,
  values,
  domain,
  tick,
  tickLabel,
  tone,
  reference,
}: Props) {
  const path = useMemo(() => {
    const mid = BAND_H / 2;
    return stripDots(values, {
      domain,
      width: PACK_WIDTH,
      dot: DOT - 1,
      lanes: LANES,
    })
      .map((d) => `M${x(d.x)} ${(mid + d.lane * LANE_STEP).toFixed(1)}h0`)
      .join("");
  }, [values, domain]);
  const at = fraction(domain, tick);

  return (
    <div className="strip-row">
      <p className="strip-row__head">
        <span>
          {name}, <span className="nowrap">n = {n}</span>
        </span>
        <span>{end}</span>
      </p>
      <svg
        className="strip-row__band"
        viewBox={`0 0 ${VIEW_W} ${BAND_H}`}
        preserveAspectRatio="none"
        style={{ height: `${BAND_H / 16}rem` }}
        aria-hidden="true"
      >
        {reference !== undefined && (
          <line
            className="strip-row__ref"
            x1={x(fraction(domain, reference))}
            x2={x(fraction(domain, reference))}
            y1="0"
            y2={BAND_H}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <path
          className={`strip-row__dots is-${tone}`}
          d={path}
          vectorEffect="non-scaling-stroke"
        />
        <line
          className="strip-row__tick"
          x1={x(at)}
          x2={x(at)}
          y1="0"
          y2={BAND_H}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="strip-row__value">
        <span style={{ left: pct(at) }}>{tickLabel}</span>
      </p>
    </div>
  );
}
