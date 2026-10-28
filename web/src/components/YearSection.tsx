import type { Figures } from "../lib/figure-types";
import { YearGrid } from "./figures/YearGrid";

/** "Could not read figures.json": the one sentence the page shows when the figures are missing. */
export const FIGURES_MISSING =
  "The figures could not be read, so they are left out. The repo has the raw JSON.";

/** F1, the year of nights, or one sentence when figures.json is missing. */
export function YearSection({ figures }: { figures: Figures | null }) {
  return figures ? (
    <YearGrid figures={figures} />
  ) : (
    <p className="section__intro">{FIGURES_MISSING}</p>
  );
}
