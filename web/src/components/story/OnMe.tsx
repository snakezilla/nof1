import type { ReactNode } from "react";
import {
  FUNNEL_LABEL,
  funnelDiagram,
  funnelSummary,
  type Funnel,
} from "../../lib/funnel";
import { MASK_NOTE } from "../../lib/mask";
import type { Headline } from "../../lib/sources-text";
import { ME_LABEL } from "../../lib/story";
import { Chapter } from "./Chapter";
import { DiagramFigure } from "./Diagram";

function MaskNote() {
  return (
    <div className="mask-note">
      <p className="mask-note__label">Masked</p>
      <p className="mask-note__text">{MASK_NOTE}</p>
    </div>
  );
}

/** The n-of-1 chapter: the computed title, the mask, the fusion funnel, then the results. */
export function OnMe({
  headline,
  masked,
  funnel,
  children,
}: {
  headline: Headline;
  /** Off when the data is not masked, so the page never claims it is. */
  masked: boolean;
  /** Null without all_sources or fusion; the chapter then has no diagram. */
  funnel: Funnel | null;
  /** The results under the diagram. */
  children: ReactNode;
}) {
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
      {masked && <MaskNote />}
      {funnel && (
        <DiagramFigure
          name="funnel"
          diagram={funnelDiagram(funnel)}
          label={FUNNEL_LABEL}
          summary={funnelSummary(funnel)}
        />
      )}
      {children}
    </Chapter>
  );
}
