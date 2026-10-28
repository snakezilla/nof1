import { FUSION_NEXT, fusionLines } from "../../lib/sources-text";
import type { Fusion } from "../../lib/types";

/** How the streams became one row per day. Renders nothing until prep/ writes the counts. */
export function Joining({ fusion }: { fusion?: Fusion }) {
  if (!fusion) return null;
  return (
    <section className="section" aria-labelledby="joining-title">
      <h2 className="section__title" id="joining-title">
        Joining it
      </h2>
      <ul className="joining">
        {fusionLines(fusion).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="joining__next">{FUSION_NEXT}</p>
    </section>
  );
}
