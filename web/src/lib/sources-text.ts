import type { Stat } from "./figure-types";
import { formatMonthYearLong } from "./dates";
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
  "WHOOP had my sleep, Strava my rides, my phone my steps, a scale my weight. I got them out and joined them into one row per day.";

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

export interface FlowStep {
  readonly label: string;
  /** How the step reads inside a sentence, for the list's accessible name. */
  readonly spoken: string;
  /** The app I wrote: the one step outlined in the accent, as in the pipeline figure. */
  readonly mine: boolean;
  /** A side road off this step, drawn under it as a dashed line and a muted note. */
  readonly branch?: string;
}

export interface SourceLine {
  readonly window: string;
  readonly steps: readonly FlowStep[];
}

const FLOW: readonly FlowStep[] = [
  {
    label: "WHOOP strap",
    spoken: "WHOOP strap, which I also hacked to read the raw signal over Bluetooth",
    mine: false,
    branch: "Hacked: raw signal over Bluetooth",
  },
  { label: "Apple Health", spoken: "Apple Health", mine: false },
  { label: "Export app I wrote", spoken: "an export app I wrote", mine: true },
  { label: "This page", spoken: "this page", mine: false },
];

/** The window in words and the four steps the records took to get here. Null without provenance. */
export const sourceLine = (p?: Provenance): SourceLine | null =>
  p
    ? {
        window: `${formatMonthYearLong(p.window.from)} to ${formatMonthYearLong(p.window.to)}`,
        steps: FLOW,
      }
    : null;

/** "How the data got here: WHOOP strap, which I also hacked to read the raw signal over Bluetooth, then Apple Health, then an export app I wrote, then this page" */
export const flowLabel = (steps: readonly FlowStep[]): string =>
  `How the data got here: ${steps.map((s) => s.spoken).join(", then ")}`;

/** "Joining it": four counts from provenance.fusion, one short line each. */
export const fusionLines = (f: Fusion): readonly string[] => [
  `${fmt(f.raw_lines)} lines in the raw export.`,
  `${fmt(f.repeats)} repeats across sync batches, matched by sample ID.`,
  `${capitalise(countWord(f.dropped_streams))} ${f.dropped_streams === 1 ? "stream" : "streams"} dropped for the wrong units.`,
  `One row per day: ${plural(f.days, "day")}.`,
];

export const FUSION_NEXT =
  "Next: fuse the raw strap signal, a second each, with the daily rows.";
