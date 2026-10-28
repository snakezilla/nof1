/** mask.json: how the health values on the page were masked, and what stayed real. */
export interface MaskInfo {
  readonly masked: true;
  readonly method: string;
  readonly ranges: Readonly<Record<string, string>>;
  readonly real: readonly string[];
}

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string" && v !== "";

export const isMaskInfo = (v: unknown): v is MaskInfo =>
  isObj(v) &&
  v.masked === true &&
  isStr(v.method) &&
  isObj(v.ranges) &&
  Object.values(v.ranges).every(isStr) &&
  Array.isArray(v.real) &&
  v.real.every(isStr);

/** A missing or wrong mask.json drops every masked claim from the page; the build refuses it. */
export const parseMaskOrNull = (v: unknown): MaskInfo | null =>
  isMaskInfo(v) ? v : null;

export const MASK_ID = "how-the-masking-works";

/** The hero block, word for word. */
export const MASK_NOTE =
  "The health numbers on this page are not my real ones. Each day's values are shifted by a random amount from a private seed. The apps, record counts and dates are real.";

const capitalise = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** "x0.85 to x1.15" -> "×0.85 to ×1.15". */
const times = (s: string): string => s.replace(/\bx(?=\d)/g, "×");

/** One line per range: "Sleep: ×0.85 to ×1.15". */
export const rangeLines = (m: MaskInfo): readonly string[] =>
  Object.entries(m.ranges).map(
    ([what, range]) => `${capitalise(what)}: ${times(range)}`,
  );

/** The closing section, from mask.json. */
export const maskParagraphs = (m: MaskInfo): readonly string[] => [
  `The health numbers on this page are masked: ${m.method.replace(/[.]$/, "")}.`,
  `Real, not masked: ${m.real.join("; ")}.`,
  'The seed stays on my machine. The same seed always gives the same page, and without it the shifts cannot be undone. Every figure and finding under "What a joined year looks like" is computed from the masked rows, so it shows the method, not my health.',
];
