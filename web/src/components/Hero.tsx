import type { Stat } from "../lib/figure-types";
import { MASK_ID, MASK_NOTE } from "../lib/mask";
import { SECTION_ID } from "../lib/provenance";
import type { Headline } from "../lib/sources-text";
import { StatRow } from "./figures/StatRow";

interface Props {
  headline: Headline;
  deck: string;
  /** Off when the data is not masked, so the page never claims it is. */
  masked: boolean;
  stats?: readonly Stat[] | null;
  /** The mono line under the counts: the window and the way the records came. */
  source?: string | null;
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
      {source && (
        <p className="hero__source">
          {source} <a href={`#${SECTION_ID}`}>How the data got here</a>
        </p>
      )}
    </section>
  );
}
