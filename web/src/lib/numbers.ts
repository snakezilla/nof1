/** The true minus sign. Data files use a hyphen; the page prints this. */
export const MINUS = "−";

/** Rounds to one decimal and folds negative zero into zero, so "-0.0" cannot exist. */
const tenths = (v: number): number => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? 0 : r;
};

/** 6.64 -> "6.6", -0.04 -> "0.0", -1.06 -> "−1.1". */
export const formatTenths = (v: number): string => {
  const r = tenths(v);
  return `${r < 0 ? MINUS : ""}${Math.abs(r).toFixed(1)}`;
};

/** Hours with one decimal: "7.6 h". */
export const formatHours = (h: number): string => `${formatTenths(h)} h`;

/** Whole minutes: "12 min". Never signed. */
export const formatMinutes = (m: number): string =>
  `${Math.round(Math.abs(m))} min`;

/** "-0.2 h" or "6.4 h" -> number of hours; null when the text holds no number. */
export const parseHours = (text: string | undefined): number | null => {
  const m = text?.replace(MINUS, "-").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/** "-0.9 to -0.2 h" -> [-0.9, -0.2]; null when it is not a range. */
export const parseInterval = (
  text: string | undefined,
): readonly [number, number] | null => {
  const nums = text?.replace(/−/g, "-").match(/-?\d+(?:\.\d+)?/g);
  return nums && nums.length >= 2 ? [Number(nums[0]), Number(nums[1])] : null;
};

/**
 * Prints the numbers inside prose from the data files: hyphen minus signs become true minus
 * signs, and a negative zero such as "-0.0" becomes "0.0".
 */
export const cleanNumbers = (text: string): string =>
  text
    .replace(/(^|[\s(])-(?=\d)/g, `$1${MINUS}`)
    .replace(/[-−](0(?:\.0+)?)(?![\d.])/g, "$1");
