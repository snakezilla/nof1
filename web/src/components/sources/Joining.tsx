import { fusionLines } from "../../lib/sources-text";
import type { Fusion } from "../../lib/types";

/** How the streams became one row per day. What comes next is in the Next chapter. Renders nothing until prep/ writes the counts. */
export function Joining({ fusion }: { fusion?: Fusion }) {
  if (!fusion) return null;
  return (
    <section className="section" aria-labelledby="joining-title">
      <h3 className="section__title" id="joining-title">
        Joining it
      </h3>
      <ul className="joining">
        {fusionLines(fusion).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
