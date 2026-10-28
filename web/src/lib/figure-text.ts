/**
 * The words around the figures: aria labels, the visually hidden summaries and the captions.
 * Every number comes from figures.json, so the prose cannot drift from the drawing.
 */
import { formatMonthYearLong } from "./dates";
import type {
  Bedtime,
  Calendar,
  Figures,
  GroupPair,
  MonthRow,
  SleepGroup,
  TypicalNight,
} from "./figure-types";
import {
  BED_DOMAIN,
  countOutside,
  hourTick,
  minutesBetween,
  totalMinutes,
} from "./figures";
import { clockLabel } from "./format";
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

export const yearCaption = (f: Figures): string => {
  const [weekend, weekday] = f.sleep_groups.weekend_vs_weekday;
  return `The stronger the green, the more sleep. Outlined squares are nights with no reading. The bracket marks Saturday and Sunday nights, which average ${formatHours(weekend.mean)} against ${formatHours(weekday.mean)} on weekdays.`;
};

const groupLine = (g: SleepGroup): string =>
  `${g.label}, ${g.n} nights, mean ${formatHours(g.mean)}, ${g.under_6} under 6 h`;

export const stripLabel = ([a, b]: GroupPair): string =>
  `Hours asleep, one dot per night: ${a.label} against ${b.label}`;

export const stripSummary = ([a, b]: GroupPair): string =>
  `${capitalise(groupLine(a))}; ${groupLine(b)}.`;

export const typicalLabel = (t: TypicalNight): string =>
  `A typical night from ${clockLabel(t.bed_h)} to ${clockLabel(t.wake_h)}`;

export const typicalSummary = (t: TypicalNight): string =>
  `Lights out at ${clockLabel(t.bed_h)}, ${formatHours(t.sleep_h)} asleep, ${t.awake_min} min awake, up at ${clockLabel(t.wake_h)}; medians of ${t.n} nights.`;

export const bedGap = (b: Bedtime): number =>
  minutesBetween(b.weekend.median, b.weekday.median);

export const bedLabel = (): string =>
  "Bedtimes, one dot per night: weekend nights against weekday nights";

export const bedSummary = (b: Bedtime): string =>
  `Median bedtime ${clockLabel(b.weekend.median)} on weekend nights and ${clockLabel(b.weekday.median)} on weekdays, ${bedGap(b)} minutes apart; ${b.after_1am} of ${b.n} nights started after 1 am.`;

export const bedCaption = (b: Bedtime): string => {
  const outside = countOutside(
    [...b.weekend.values, ...b.weekday.values],
    BED_DOMAIN,
  );
  const ends =
    outside > 0
      ? ` ${outside} bedtimes before ${hourTick(BED_DOMAIN[0])} or after ${hourTick(BED_DOMAIN[1])} sit at the ends of the axis.`
      : "";
  return `Each dot is one night. The ticks are the medians, ${bedGap(b)} minutes apart. ${b.after_1am} of ${b.n} nights started after 1 am.${ends}`;
};

export const monthsLabel = (months: readonly MonthRow[]): string => {
  const first = months[0]?.month;
  const last = months[months.length - 1]?.month;
  return first && last
    ? `Training minutes by month and type, ${formatMonthYearLong(`${first}-01`)} to ${formatMonthYearLong(`${last}-01`)}`
    : "Training minutes by month and type";
};

export const monthsSummary = (months: readonly MonthRow[]): string => {
  const busiest = months.reduce<MonthRow | null>(
    (best, m) =>
      !best || totalMinutes(m.training_min) > totalMinutes(best.training_min)
        ? m
        : best,
    null,
  );
  const empty = emptyMonths(months);
  return [
    busiest
      ? `The most training was in ${formatMonthYearLong(`${busiest.month}-01`)}, ${totalMinutes(busiest.training_min).toLocaleString("en-US")} minutes over ${busiest.training_days} days.`
      : "",
    empty ? `${empty} has no readings.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

export const monthsCaption = (months: readonly MonthRow[]): string => {
  const empty = emptyMonths(months);
  return `Bar length is training time in the month. Nights and the median are for nights with a sleep reading.${empty ? ` ${empty} has no readings, so its row is outlined.` : ""}`;
};
