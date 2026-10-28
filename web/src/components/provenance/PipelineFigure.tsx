import { useMemo } from "react";
import { layouts } from "../../lib/pipeline-layouts";
import { pipeline, pipelineSummary } from "../../lib/provenance";
import type { Provenance } from "../../lib/types";
import { FigureFrame } from "../figures/FigureFrame";
import { PipelineSvg } from "./PipelineSvg";

/** F7: from the strap to this page. Three drawings, one shown per width; no script needed. */
export function PipelineFigure({ provenance }: { provenance: Provenance }) {
  const drawn = useMemo(() => layouts(pipeline(provenance)), [provenance]);
  return (
    <FigureFrame
      className="fig--wide fig--pipe"
      label="How the data got from the strap to this page"
      summary={pipelineSummary(provenance)}
      caption="Solid lines are the data on this page; the dashed line is the raw signal, not joined yet."
    >
      <div className="pipe">
        <PipelineSvg layout={drawn.narrow} className="is-narrow" />
        <PipelineSvg layout={drawn.medium} className="is-medium" />
        <PipelineSvg layout={drawn.wide} className="is-wide" />
      </div>
    </FigureFrame>
  );
}
