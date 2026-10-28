import { formatDay } from "./dates";
import { recentWindow, timelineRows } from "./days";
import { clockLabel } from "./format";
import { formatHours, formatMinutes } from "./numbers";
import type { Day } from "./types";

/** Nights in the table when expanded, and rows shown before that. */
export const WINDOW_NIGHTS = 60;
export const SHORT_ROWS = 14;

export interface NightCells {
  readonly kind: "night";
  readonly date: string;
  readonly weekday: string;
  readonly day: string;
  readonly sleep: string;
  readonly awake: string;
  readonly bedtime: string;
  readonly training: string;
  readonly trainingKind: string;
}

export interface GapCells {
  readonly kind: "gap";
  readonly from: string;
  readonly label: string;
}

export type NightRow = NightCells | GapCells;

const typeLabel = (types: readonly string[]): string =>
  types
    .filter((t) => t !== "other")
    .map((t) => t.replace(/_/g, " "))
    .join(", ");

/** One table row. Missing values stay empty strings, never "none". */
export const nightCells = (d: Day): NightCells => {
  const { weekday, label } = formatDay(d.date);
  return {
    kind: "night",
    date: d.date,
    weekday,
    day: label,
    sleep: d.sleep_h === null ? "" : formatHours(d.sleep_h),
    awake: d.awake_min == null ? "" : formatMinutes(d.awake_min),
    bedtime: d.bed_h == null ? "" : clockLabel(d.bed_h),
    training: d.workout_min > 0 ? formatMinutes(d.workout_min) : "",
    trainingKind: d.workout_min > 0 ? typeLabel(d.workout_types) : "",
  };
};

export const gapLabel = (count: number): string =>
  `No data for ${count} ${count === 1 ? "night" : "nights"}`;

/** Newest first, with runs of empty days folded into one gap row. */
export const nightRows = (
  days: readonly Day[],
  n = WINDOW_NIGHTS,
): readonly NightRow[] =>
  timelineRows(days, n).map((row) =>
    row.kind === "day"
      ? nightCells(row.day)
      : { kind: "gap", from: row.from, label: gapLabel(row.count) },
  );

/** Nights with sleep inside the window, which is what "Show all N nights" counts. */
export const windowNightCount = (
  days: readonly Day[],
  n = WINDOW_NIGHTS,
): number => {
  const win = recentWindow(days, n);
  return win
    ? days.filter(
        (d) => d.sleep_h !== null && d.date >= win.from && d.date <= win.to,
      ).length
    : 0;
};

/** Rows past the first SHORT_ROWS are hidden until the reader expands the table. */
export const isHidden = (index: number, expanded: boolean): boolean =>
  !expanded && index >= SHORT_ROWS;

export const toggleLabel = (expanded: boolean, total: number): string =>
  expanded ? `Show the last ${SHORT_ROWS}` : `Show all ${total} nights`;
