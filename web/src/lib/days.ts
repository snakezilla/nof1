import { addDays, daysBetween } from "./dates";
import type { Day } from "./types";

export type TimelineRow =
  | { readonly kind: "day"; readonly day: Day }
  | {
      readonly kind: "gap";
      readonly from: string;
      readonly to: string;
      readonly count: number;
    };

export const hasData = (d: Day): boolean =>
  d.hrv_ms !== null ||
  d.sleep_h !== null ||
  d.workout_min > 0 ||
  d.mindful_min > 0;

export const emptyDay = (date: string): Day => ({
  date,
  hrv_ms: null,
  hrv_n: 0,
  sleep_h: null,
  deep_h: null,
  rem_h: null,
  workout_min: 0,
  workout_types: [],
  mindful_min: 0,
});

/** Every calendar day from the first to the last input day, with empty days filled in. */
export const fillCalendar = (days: readonly Day[]): readonly Day[] => {
  if (days.length === 0) return [];
  const byDate = new Map(days.map((d) => [d.date, d]));
  const first = days[0].date;
  const span = daysBetween(first, days[days.length - 1].date);
  return Array.from({ length: span + 1 }, (_, i) => {
    const date = addDays(first, i);
    return byDate.get(date) ?? emptyDay(date);
  });
};

export const hasSleep = (d: Day): boolean => d.sleep_h !== null;

/**
 * The n most recent nights with sleep data, first to last. The window ends on the last night,
 * not on the last day with any data, so a lone workout a year later does not stretch it.
 * Falls back to days with any data when no night has sleep.
 */
export const recentWindow = (
  days: readonly Day[],
  n: number,
): { from: string; to: string } | null => {
  const withData = days.filter(hasData);
  if (withData.length === 0) return null;
  const nights = days.filter(hasSleep);
  const pool = nights.length > 0 ? nights : withData;
  const from = pool[Math.max(0, pool.length - n)].date;
  return { from, to: pool[pool.length - 1].date };
};

/** Newest-first rows for a window, with runs of empty days collapsed into one gap row. */
export const timelineRows = (
  days: readonly Day[],
  n: number,
): readonly TimelineRow[] => {
  const win = recentWindow(days, n);
  if (!win) return [];
  const span = fillCalendar(days).filter(
    (d) => d.date >= win.from && d.date <= win.to,
  );
  return [...span].reverse().reduce<readonly TimelineRow[]>((rows, day) => {
    if (hasData(day)) return [...rows, { kind: "day", day }];
    const last = rows[rows.length - 1];
    if (last && last.kind === "gap") {
      return [
        ...rows.slice(0, -1),
        { ...last, from: day.date, count: last.count + 1 },
      ];
    }
    return [...rows, { kind: "gap", from: day.date, to: day.date, count: 1 }];
  }, []);
};

export type ListRow =
  TimelineRow | { readonly kind: "year"; readonly year: string };

const rowYear = (row: TimelineRow): string =>
  (row.kind === "day" ? row.day.date : row.to).slice(0, 4);

/** Adds a year marker before the first row and wherever the year changes. */
export const withYearMarkers = (
  rows: readonly TimelineRow[],
): readonly ListRow[] =>
  rows.flatMap((row, i): readonly ListRow[] => {
    const year = rowYear(row);
    const changed = i === 0 || rowYear(rows[i - 1]) !== year;
    return changed ? [{ kind: "year", year }, row] : [row];
  });
