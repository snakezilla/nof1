import type { Stat } from "./figure-types";
import { fmt, plural } from "./provenance";
import type { Fusion, HealthSource, Provenance } from "./types";

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

/** Apps that wrote anything into Apple Health, apart from the ECG app and unknown apps. */
export const appsThatMeasured = (p?: Provenance): number | null =>
  p?.all_sources ? p.all_sources.filter(measuredMe).length : null;

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

export const DECK =
  "WHOOP had my sleep. Strava had my rides. My phone had my steps. A scale had my weight. Each kept its own piece. I got them out and joined them into one row per day. This page shows how.";

/** The short form of the deck, for the meta description. */
export const SUMMARY =
  "How I got my health data out of each app and joined it into one row per day.";

const YEAR_MS = 365.25 * 86_400_000;

/** First to last record across every source. */
export const sourceSpan = (
  sources: readonly HealthSource[],
): { readonly first: string; readonly last: string } | null =>
  sources.length === 0
    ? null
    : {
        first: sources.map((s) => s.first).reduce((a, b) => (a < b ? a : b)),
        last: sources.map((s) => s.last).reduce((a, b) => (a > b ? a : b)),
      };

export const yearsCovered = (first: string, last: string): number =>
  Math.max(1, Math.round((Date.parse(last) - Date.parse(first)) / YEAR_MS));

/** The four counts under the deck. Null without all_sources. */
export const sourceStats = (p?: Provenance): readonly Stat[] | null => {
  const sources = p?.all_sources;
  const span = sources ? sourceSpan(sources) : null;
  const apps = appsThatMeasured(p);
  if (!sources || !span || apps === null) return null;
  const records = sources.reduce((sum, s) => sum + s.records, 0);
  const years = yearsCovered(span.first, span.last);
  return [
    {
      value: fmt(apps),
      label:
        apps === 1
          ? "app that wrote to my Health store"
          : "apps that wrote to my Health store",
    },
    { value: fmt(records), label: "records in my Health store" },
    {
      value: fmt(years),
      label: years === 1 ? "year covered" : "years covered",
    },
    { value: "1", label: "app I wrote to get them out" },
  ];
};

/** "Joining it": the four lines, with the counts from provenance.fusion. */
export const fusionLines = (f: Fusion): readonly string[] => [
  `${fmt(f.raw_lines)} lines in the raw export, ${fmt(f.repeats)} of them repeats across sync batches, matched by sample ID.`,
  "On nights where two apps recorded sleep, the one with the most minutes asleep wins.",
  `${capitalise(countWord(f.dropped_streams))} ${f.dropped_streams === 1 ? "stream was" : "streams were"} dropped because ${f.dropped_streams === 1 ? "its" : "their"} units did not match.`,
  `Result: one row per day, ${plural(f.days, "day")}.`,
];

export const FUSION_NEXT =
  "Next: fuse the raw strap signal, a second each, with the daily rows.";
