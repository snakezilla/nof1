import type { Provenance } from "../../lib/types";
import { SourceYearsFigure } from "./SourceYearsFigure";

export function WhereSection({ provenance }: { provenance?: Provenance }) {
  if (!provenance?.all_sources) return null;
  return (
    <section className="section" aria-labelledby="where-title">
      <h3 className="section__title" id="where-title">
        Where my data lived
      </h3>
      <SourceYearsFigure provenance={provenance} />
    </section>
  );
}
