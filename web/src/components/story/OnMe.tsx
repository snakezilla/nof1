import type { ReactNode } from "react";
import type { Stat } from "../../lib/figure-types";
import { MASK_ID, MASK_NOTE } from "../../lib/mask";
import { SECTION_ID } from "../../lib/provenance";
import {
  flowLabel,
  type Headline,
  type SourceLine,
} from "../../lib/sources-text";
import { ME_LABEL } from "../../lib/story";
import { StatRow } from "../figures/StatRow";
import { Chapter } from "./Chapter";

interface Props {
  headline: Headline;
  deck: string;
  /** Off when the data is not masked, so the page never claims it is. */
  masked: boolean;
  stats?: readonly Stat[] | null;
  /** Under the counts: the window and the way the records came. */
  source?: SourceLine | null;
  /** The sections of the chapter, each under an h3. */
  children: ReactNode;
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
    <div className="intro__source">
      <p className="intro__window">{source.window}</p>
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
      <p className="intro__how">
        <a href={`#${SECTION_ID}`}>How the data got here</a>
      </p>
    </div>
  );
}

/** The n-of-1 chapter: the computed title, the deck, the mask, the counts, the flow, then its sections. */
export function OnMe({
  headline,
  deck,
  masked,
  stats,
  source,
  children,
}: Props) {
  return (
    <Chapter
      chapter="me"
      label={ME_LABEL}
      title={
        <>
          {headline.figure && (
            <span className="chapter__em">{headline.figure}</span>
          )}
          {headline.rest}
        </>
      }
    >
      <div className="intro">
        <p className="intro__deck">{deck}</p>
        {masked && <MaskNote />}
        {stats && stats.length > 0 && (
          <StatRow
            stats={stats}
            label="Where the data came from, in four numbers"
          />
        )}
        {source && <SourceFlow source={source} />}
      </div>
      {children}
    </Chapter>
  );
}
