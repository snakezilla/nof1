const DAY_MS = 86_400_000;

const toUtc = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

export const addDays = (iso: string, n: number): string =>
  new Date(toUtc(iso) + n * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (from: string, to: string): number =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS);

export const localIsoDate = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const formatDay = (iso: string): { weekday: string; label: string } => {
  const d = new Date(toUtc(iso));
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    label: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`,
  };
};

export const formatMonthYear = (iso: string): string => {
  const d = new Date(toUtc(iso));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2025-04-30" -> "April 2025". */
export const formatMonthYearLong = (iso: string): string => {
  const d = new Date(toUtc(iso));
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** "2025-04-23" -> "23 April 2025". */
export const formatDateLong = (iso: string): string => {
  const d = new Date(toUtc(iso));
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
