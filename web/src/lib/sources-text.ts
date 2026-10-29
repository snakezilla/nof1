import { fmt } from "./provenance";
import type { HealthSource, Provenance } from "./types";

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

/** A word up to twenty, else the numeral. */
export const countWord = (n: number): string => WORDS[n] ?? fmt(n);

const capitalise = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** The ECG app is part of the watch, and an unknown app is not one I can name. */
const measuredMe = (s: HealthSource): boolean =>
  !/^ECG\b/.test(s.name) && !/\(unknown app\)$/.test(s.name);

/** The apps that wrote anything into Apple Health, apart from the ECG app and unknown apps. */
export const measuredSources = (p: Provenance): readonly HealthSource[] =>
  (p.all_sources ?? []).filter(measuredMe);

export const appsThatMeasured = (p?: Provenance): number | null =>
  p?.all_sources ? measuredSources(p).length : null;

export interface Headline {
  readonly figure: string;
  readonly rest: string;
}

const REST = "measured me. None of them talked to each other.";

/** "Twelve apps measured me. None of them talked to each other." with the count set apart. */
export const headline = (p?: Provenance): Headline => {
  const n = appsThatMeasured(p);
  if (n === null || n === 0) return { figure: "", rest: `My apps ${REST}` };
  return {
    figure: capitalise(countWord(n)),
    rest: ` ${n === 1 ? "app" : "apps"} ${REST}`,
  };
};

export const headlineText = (h: Headline): string => `${h.figure}${h.rest}`;
