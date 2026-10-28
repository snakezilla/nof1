import type { Figures } from "../lib/figure-types";
import { YearGrid } from "./figures/YearGrid";

/** "Could not read figures.json": the one sentence the page shows when the figures are missing. */
export const FIGURES_MISSING =
  "The figures could not be read, so they are left out. The repo has the raw JSON.";

export function YearSection({ figures }: { figures: Figures | null }) {
  return (
    <section className="section" aria-labelledby="year-title">
      <h3 className="section__title" id="year-title">
        A year of nights
      </h3>
      {figures ? (
        <YearGrid figures={figures} />
      ) : (
        <p className="section__intro">{FIGURES_MISSING}</p>
      )}
    </section>
  );
}
