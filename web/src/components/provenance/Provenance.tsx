import { SECTION_ID } from "../../lib/provenance";
import { DROPPED, FLOW_STEPS } from "../../lib/provenance-text";
import type { RawStream } from "../../lib/raw-stream";
import type { Provenance as Source } from "../../lib/types";
import { PipelineFigure } from "./PipelineFigure";
import { RawSignal } from "./RawSignal";
import { SourcesTable } from "./SourcesTable";

const TITLE_ID = "provenance-title";

/** How every record got out: the three steps, the pipeline, the apps, the raw signal. */
export function Provenance({
  provenance,
  rawStream,
}: {
  provenance?: Source;
  /** One night off the strap over Bluetooth, from raw-stream.json. */
  rawStream: RawStream | null;
}) {
  return (
    <section
      className="section prov"
      id={SECTION_ID}
      aria-labelledby={TITLE_ID}
    >
      <h3 className="section__title" id={TITLE_ID}>
        How I got it out
      </h3>
      {provenance ? (
        <>
          <ol className="prov__flow">
            {FLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <PipelineFigure provenance={provenance} />
          <div className="prov__table">
            <SourcesTable provenance={provenance} />
            <p className="prov__dropped">{DROPPED}</p>
          </div>
          <RawSignal stream={rawStream} />
        </>
      ) : (
        <p className="section__intro">
          Could not read where the data comes from. The repo has the raw JSON.
        </p>
      )}
    </section>
  );
}
