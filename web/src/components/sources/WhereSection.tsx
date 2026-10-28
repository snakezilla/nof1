import type { Provenance } from "../../lib/types";
import { SourceYearsFigure } from "./SourceYearsFigure";

export function WhereSection({ provenance }: { provenance?: Provenance }) {
  if (!provenance?.all_sources) return null;
  return (
    <section className="section" aria-labelledby="where-title">
      <h2 className="section__title" id="where-title">
        Where my data lived
      </h2>
      <SourceYearsFigure provenance={provenance} />
    </section>
  );
}
