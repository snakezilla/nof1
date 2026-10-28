const toUtc = (iso: string): number => Date.parse(`${iso}T00:00:00Z`);

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
