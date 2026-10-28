import { formatMonthYear } from "./dates";
import { fmt } from "./provenance";
import type { HealthSource, Provenance } from "./types";

/** F8: one row per source, a bar from its first to its last record, on a 2020 to 2026 axis. */
export type SourceKind = "used" | "excluded" | "other";

export interface SourceBar {
  readonly name: string;
  readonly kind: SourceKind;
  /** Percent of the axis, from its left edge. */
  readonly left: number;
  readonly width: number;
  readonly records: string;
  readonly dates: string;
}

export interface SourceYears {
  readonly rows: readonly SourceBar[];
  readonly ticks: readonly { readonly label: string; readonly at: number }[];
  /** The year the page uses, as a band across every row. */
  readonly window: { readonly left: number; readonly width: number };
}

const FIRST_YEAR = 2020;
const LAST_YEAR = 2026;
const START = Date.UTC(FIRST_YEAR, 0, 1);
const END = Date.UTC(LAST_YEAR + 1, 0, 1);

const at = (iso: string): number => {
  const t = Date.parse(`${iso}T00:00:00Z`);
  const clamped = Math.min(END, Math.max(START, t));
  return Math.round(((clamped - START) / (END - START)) * 10_000) / 100;
};

/** A source with one day of records still gets a mark you can see; CSS sets its least width. */
const span = (first: string, last: string) => {
  const left = at(first);
  return { left, width: Math.max(0, at(last) - left) };
};

const kindOf = (s: HealthSource): SourceKind =>
  s.status === "used" ? "used" : s.status === "excluded" ? "excluded" : "other";

/** "Unstrap (open-source WHOOP Bluetooth reader)" -> "Unstrap", unless two rows would read the same. */
export const shortNames = (names: readonly string[]): readonly string[] => {
  const short = names.map((n) => n.replace(/\s*\(.*\)$/, ""));
  return short.map((s, i) =>
    short.filter((x) => x === s).length > 1 ? names[i] : s,
  );
};

const dates = (s: HealthSource): string => {
  const a = formatMonthYear(s.first);
  const b = formatMonthYear(s.last);
  return a === b ? a : `${a} to ${b}`;
};

/** Null without all_sources. Used sources first, then by first record, so the years read down the page. */
export const sourceYears = (p?: Provenance): SourceYears | null => {
  const sources = p?.all_sources;
  if (!sources || sources.length === 0) return null;
  const ordered = [...sources].sort(
    (a, b) =>
      Number(kindOf(b) === "used") - Number(kindOf(a) === "used") ||
      a.first.localeCompare(b.first),
  );
  const names = shortNames(ordered.map((s) => s.name));
  const rows = ordered.map((s, i) => ({
    name: names[i],
    kind: kindOf(s),
    ...span(s.first, s.last),
    records: fmt(s.records),
    dates: dates(s),
  }));
  const ticks = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => ({
    label: String(FIRST_YEAR + i),
    at: at(`${FIRST_YEAR + i}-01-01`),
  }));
  return { rows, ticks, window: span(p.window.from, p.window.to) };
};

/** The sentence a screen reader hears in place of the drawing. */
export const sourceYearsSummary = (p: Provenance, f: SourceYears): string => {
  const used = f.rows.filter((r) => r.kind === "used").map((r) => r.name);
  const sources = p.all_sources ?? [];
  const first = sources.reduce((a, b) => (a.first < b.first ? a : b));
  const last = sources.reduce((a, b) => (a.last > b.last ? a : b));
  return `${fmt(sources.length)} sources wrote to my Health store, from ${formatMonthYear(first.first)} to ${formatMonthYear(last.last)}. The page uses ${used.join(", ")}, inside ${formatMonthYear(p.window.from)} to ${formatMonthYear(p.window.to)}.`;
};
