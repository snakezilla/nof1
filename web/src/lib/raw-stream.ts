import { fmt } from "./provenance";

/** One night read straight off the strap over Bluetooth. Not used on the page yet. */
export interface RawStream {
  readonly readings: number;
  readonly hours: number;
  /** Readings that carry beat-to-beat intervals. */
  readonly with_rr: number;
  readonly first: string;
  readonly last: string;
  readonly fields: readonly string[];
}

type Rec = Record<string, unknown>;

const isObj = (v: unknown): v is Rec =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0;
const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

export const isRawStream = (v: unknown): v is RawStream =>
  isObj(v) &&
  isCount(v.readings) &&
  typeof v.hours === "number" &&
  Number.isFinite(v.hours) &&
  v.hours > 0 &&
  isCount(v.with_rr) &&
  v.with_rr <= v.readings &&
  isIsoDate(v.first) &&
  isIsoDate(v.last) &&
  Array.isArray(v.fields) &&
  v.fields.every((f) => typeof f === "string");

/** raw-stream.json is optional: a missing or wrong file drops the subsection. */
export const parseRawStreamOrNull = (v: unknown): RawStream | null =>
  isRawStream(v) ? v : null;

/** "The raw signal": what the Bluetooth reader got, with the counts from raw-stream.json. */
export const rawSignalText = (s: RawStream): string => {
  const hours = Math.floor(s.hours);
  return [
    "WHOOP's app gives you summaries. I wanted the raw signal, so I built a Bluetooth reader on my Mac on top of an open-source decoder of the strap's protocol.",
    `One night of it: ${fmt(s.readings)} readings in ${hours} ${hours === 1 ? "hour" : "hours"}, one a second: heart rate, beat-to-beat intervals on ${fmt(s.with_rr)} of them, skin temperature and motion.`,
    "It is not on this page yet. It covers one night, and its HRV does not match WHOOP's. Next: make it run every night.",
  ].join(" ");
};
