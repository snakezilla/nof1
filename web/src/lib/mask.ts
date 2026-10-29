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

/** Said once, at the head of the part drawn from masked rows. */
export const MASKED_LABEL = "Masked data.";

/** The one-line note at the head of On me, word for word. */
export const MASK_NOTE =
  "Health numbers here are masked with a private seed; apps, counts and dates are real.";
