import { parseHours } from "./numbers";
import type { Pattern } from "./types";

/** The first finding's title in three parts: "Weekends cost me ", "36 minutes", " of sleep." */
export interface HeroParts {
  readonly before: string;
  readonly figure: string;
  readonly after: string;
}

/** Hours between the two groups of a pattern: its stated difference, else a minus b. */
export const patternDiffHours = (p: Pattern): number | null => {
  const stated = parseHours(p.numbers.diff);
  if (stated !== null) return stated;
  const a = parseHours(p.numbers.a_value);
  const b = parseHours(p.numbers.b_value);
  return a !== null && b !== null ? a - b : null;
};

const minutesLabel = (m: number): string =>
  `${m} ${m === 1 ? "minute" : "minutes"}`;

/**
 * "Weekends cost me 36 minutes of sleep." from the first pattern. The figure is the stated
 * difference in whole minutes; the words come from the pattern title.
 */
export const heroParts = (patterns: readonly Pattern[]): HeroParts | null => {
  const first = patterns[0];
  if (!first) return null;
  const diff = patternDiffHours(first);
  if (diff === null)
    return { before: `${first.title}.`, figure: "", after: "" };
  const figure = minutesLabel(Math.round(Math.abs(diff) * 60));
  const split = first.title.match(/^(.*\bcosts? me) (.+)$/i);
  return split
    ? { before: `${split[1]} `, figure, after: ` of ${split[2]}.` }
    : { before: `${first.title}: `, figure, after: "." };
};

export const heroText = (parts: HeroParts): string =>
  `${parts.before}${parts.figure}${parts.after}`;
