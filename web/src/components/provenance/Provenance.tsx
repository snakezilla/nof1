import { SECTION_ID } from "../../lib/provenance";
import { FLOW_STEPS } from "../../lib/provenance-text";
import type { RawStream } from "../../lib/raw-stream";
import type { Provenance as Source } from "../../lib/types";
import { HowIGotIt } from "./HowIGotIt";
import { LeftOut } from "./LeftOut";
import { OtherSources } from "./OtherSources";
import { PipelineFigure } from "./PipelineFigure";
import { RawSignal } from "./RawSignal";
import { SourcesTable } from "./SourcesTable";

const TITLE_ID = "provenance-title";
const FALLBACK_REPO = "https://github.com/snakezilla/nof1";

const safeRepo = (url: string): string =>
  /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(url) ? url : FALLBACK_REPO;

function Closing({ repo }: { repo: string }) {
  const url = safeRepo(repo);
  return (
    <p className="prov__closing">
      Every cut is code: <code>prep/load.py</code> in{" "}
      <a href={url}>{url.replace(/^https:\/\//, "")}</a>.
    </p>
  );
}

/** How every record got out: the three steps, the pipeline, the sources, the raw signal, what was left out. */
export function Provenance({
  provenance,
  repo,
  mindfulDays,
  rawStream,
}: {
  provenance?: Source;
  repo: string;
  /** Days in the window with mindful minutes, from daily.json. */
  mindfulDays: number | null;
  /** One night off the strap over Bluetooth, from raw-stream.json. */
  rawStream: RawStream | null;
}) {
  return (
    <section
      className="section prov"
      id={SECTION_ID}
      aria-labelledby={TITLE_ID}
    >
      <h2 className="section__title" id={TITLE_ID}>
        How I got it out
      </h2>
      {provenance ? (
        <>
          <ol className="prov__flow">
            {FLOW_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <PipelineFigure provenance={provenance} />
          <SourcesTable provenance={provenance} />
          <OtherSources provenance={provenance} mindfulDays={mindfulDays} />
          <HowIGotIt provenance={provenance} />
          <RawSignal stream={rawStream} />
          <LeftOut provenance={provenance} />
          <Closing repo={repo} />
        </>
      ) : (
        <p className="section__intro">
          Could not read where the data comes from. The repo has the raw JSON.
        </p>
      )}
    </section>
  );
}
