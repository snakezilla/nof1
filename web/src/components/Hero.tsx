import type { Stat } from "../lib/figure-types";
import { MASK_ID, MASK_NOTE } from "../lib/mask";
import { SECTION_ID } from "../lib/provenance";
import { flowLabel, type Headline, type SourceLine } from "../lib/sources-text";
import { StatRow } from "./figures/StatRow";

interface Props {
  headline: Headline;
  deck: string;
  /** Off when the data is not masked, so the page never claims it is. */
  masked: boolean;
  stats?: readonly Stat[] | null;
  /** Under the counts: the window and the way the records came. */
  source?: SourceLine | null;
}

function MaskNote() {
  return (
    <div className="mask-note">
      <p className="mask-note__label">Masked</p>
      <p className="mask-note__text">
        {MASK_NOTE} <a href={`#${MASK_ID}`}>How the masking works</a>
      </p>
    </div>
  );
}

/** The window, the four steps joined by drawn arrows, any side branch, and the link to how. */
function SourceFlow({ source }: { source: SourceLine }) {
  return (
    <div className="hero__source">
      <p className="hero__window">{source.window}</p>
      <ol className="flow" role="list" aria-label={flowLabel(source.steps)}>
        {source.steps.map((step, i) => (
          <li className="flow__step" key={step.label}>
            {i > 0 && <span className="flow__arrow" aria-hidden="true" />}
            <span className="flow__node">
              <span
                className={step.mine ? "flow__label is-mine" : "flow__label"}
              >
                {step.label}
              </span>
              {step.branch && (
                <span className="flow__branch">{step.branch}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
      <p className="hero__how">
        <a href={`#${SECTION_ID}`}>How the data got here</a>
      </p>
    </div>
  );
}

export function Hero({ headline, deck, masked, stats, source }: Props) {
  return (
    <section className="hero" aria-label="Summary">
      <h1 className="hero__line">
        {headline.figure && (
          <span className="hero__figure">{headline.figure}</span>
        )}
        {headline.rest}
      </h1>
      <p className="hero__deck">{deck}</p>
      {masked && <MaskNote />}
      {stats && stats.length > 0 && (
        <StatRow
          stats={stats}
          label="Where the data came from, in four numbers"
        />
      )}
      {source && <SourceFlow source={source} />}
    </section>
  );
}
