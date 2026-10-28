/**
 * The words around the figures: aria labels, the visually hidden summaries and the captions.
 * Every number comes from figures.json, so the prose cannot drift from the drawing.
 */
import { formatMonthYearLong } from "./dates";
import type {
  Calendar,
  Figures,
  GroupPair,
  MonthRow,
  SleepGroup,
} from "./figure-types";
import { formatHours } from "./numbers";

const capitalise = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const share = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((part / whole) * 100);

/** "20% under 6 h". */
export const underShare = (g: SleepGroup): string =>
  `${share(g.under_6, g.n)}% under 6 h`;

/** "May 2024 to April 2025", from the first and last cell. */
export const calendarSpan = (c: Calendar): string => {
  const first = c.cells[0]?.date;
  const last = c.cells[c.cells.length - 1]?.date;
  return first && last
    ? `${formatMonthYearLong(first)} to ${formatMonthYearLong(last)}`
    : "the year";
};

/** "December 2024", or "December 2024 and January 2025": the months with no nights at all. */
export const emptyMonths = (months: readonly MonthRow[]): string | null => {
  const names = months
    .filter((m) => m.nights === 0)
    .map((m) => formatMonthYearLong(`${m.month}-01`));
  if (names.length === 0) return null;
  return names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export const yearLabel = (f: Figures): string =>
  `Every night from ${calendarSpan(f.calendar)}, one square per night, shaded by hours asleep`;

export const yearSummary = (f: Figures): string => {
  const read = f.calendar.cells.filter((c) => c.sleep_h !== null).length;
  const [weekend, weekday] = f.sleep_groups.weekend_vs_weekday;
  const empty = emptyMonths(f.months);
  return [
    `${read} of ${f.calendar.cells.length} nights have a reading.`,
    `${capitalise(weekend.label)} average ${formatHours(weekend.mean)} against ${formatHours(weekday.mean)} for ${weekday.label}.`,
    empty ? `${empty} has no readings.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export const YEAR_CAPTION =
  "One square per night; the stronger the green, the more sleep. The bracket marks Saturday and Sunday.";

const groupLine = (g: SleepGroup): string =>
  `${g.label}, ${g.n} nights, mean ${formatHours(g.mean)}, ${g.under_6} under 6 h`;

export const stripLabel = ([a, b]: GroupPair): string =>
  `Hours asleep, one dot per night: ${a.label} against ${b.label}`;

export const stripSummary = ([a, b]: GroupPair): string =>
  `${capitalise(groupLine(a))}; ${groupLine(b)}.`;
