import { useMemo } from "react";
import { sourceYears, sourceYearsSummary } from "../../lib/source-years";
import type { Provenance } from "../../lib/types";
import { FigureFrame, Key } from "../figures/FigureFrame";

const CAPTION =
  "Each app kept its own years. The page uses the one year where WHOOP, Strava and SnoreLab overlap.";

/** F8: where my data lived. Text is HTML placed by percent, so labels never scale. */
export function SourceYearsFigure({ provenance }: { provenance: Provenance }) {
  const f = useMemo(() => sourceYears(provenance), [provenance]);
  if (!f) return null;
  const band = { left: `${f.window.left}%`, width: `${f.window.width}%` };
  return (
    <FigureFrame
      className="fig--wide fig--years"
      kicker="One bar per app, first record to last, with its record count"
      label="When each app wrote to my Health store, 2020 to 2026"
      summary={sourceYearsSummary(provenance, f)}
      caption={CAPTION}
      legend={
        <>
          <Key swatch="is-used">Used on this page</Key>
          <Key swatch="is-other">Not used</Key>
          <Key swatch="is-excluded">Left out</Key>
          <Key swatch="is-window">The year on this page</Key>
        </>
      }
    >
      <div className="years">
        <ol className="years__rows">
          {f.rows.map((r) => (
            <li
              key={`${r.name}-${r.dates}`}
              className={`years__row is-${r.kind}`}
            >
              <span className="years__name">{r.name}</span>
              <span className="years__track">
                <span className="years__band" style={band} />
                <span
                  className="years__bar"
                  style={{ left: `${r.left}%`, width: `${r.width}%` }}
                />
              </span>
              <span className="years__count">{r.records}</span>
            </li>
          ))}
        </ol>
        <div className="years__axis">
          <span className="years__ticks">
            {f.ticks.map((t) => (
              <span
                key={t.label}
                className="years__tick"
                style={{ left: `${t.at}%` }}
              >
                {t.label}
              </span>
            ))}
          </span>
        </div>
      </div>
    </FigureFrame>
  );
}
