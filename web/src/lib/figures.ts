/**
 * Shared geometry for the figures. Pure functions only: data in, positions and labels out, so the
 * components stay small and render the same on the server and in the browser.
 */
import type { CalendarCell, GroupKey } from "./figure-types";

export type Domain = readonly [number, number];

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/** Where v sits on the domain, 0 to 1, pinned to the ends when it falls outside. */
export const fraction = ([lo, hi]: Domain, v: number): number =>
  hi === lo ? 0 : clamp((v - lo) / (hi - lo), 0, 1);

/** 0.25 -> "25.00%", for CSS positions. */
export const pct = (f: number): string => `${(f * 100).toFixed(2)}%`;

/** Values from lo to hi in steps, both ends included. */
export const ticks = (lo: number, hi: number, step: number): number[] =>
  Array.from(
    { length: Math.floor((hi - lo) / step) + 1 },
    (_, i) => lo + i * step,
  );

/** How many values fall outside the domain (they are drawn pinned to its ends). */
export const countOutside = (
  values: readonly number[],
  [lo, hi]: Domain,
): number => values.filter((v) => v < lo || v > hi).length;

/* Hours of sleep, F2 */

export const HOURS_DOMAIN: Domain = [0, 12];
export const HOURS_TICKS = ticks(0, 12, 3);
export const SHORT_NIGHT_H = 6;

/* Clock times on a clock that runs past 24 (25.0 = 1:00 am) */

/** 22 -> "10 pm", 24 -> "12 am", 25 -> "1 am". Whole hours, for axis ticks. */
export const hourTick = (h: number): string => {
  const h24 = ((Math.round(h) % 24) + 24) % 24;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12} ${h24 < 12 ? "am" : "pm"}`;
};

export const BED_DOMAIN: Domain = [22, 27];
export const BED_TICKS = ticks(22, 27, 1);

/** The axis for a typical night: an hour of air either side, ticks every two hours. */
export const nightAxis = (
  bed: number,
  wake: number,
): { readonly domain: Domain; readonly ticks: number[] } => {
  const lo = Math.floor(bed) - 1;
  const hi = Math.ceil(wake) + 1;
  return { domain: [lo, hi], ticks: ticks(Math.ceil(lo / 2) * 2, hi, 2) };
};

/** Decimal hours between two clock times, in whole minutes: 24.54 - 24.19 -> 21. */
export const minutesBetween = (a: number, b: number): number =>
  Math.round(Math.abs(a - b) * 60);

/* The calendar, F1 */

export const CELL = 12;
export const CELL_GAP = 2;
const PITCH = CELL + CELL_GAP;
export const WEEKEND_DAYS: readonly number[] = [5, 6];

/** "wide": weeks run left to right, weekdays top to bottom. "tall": turned, for phones. */
export type Orientation = "wide" | "tall";

export const gridSize = (
  weeks: number,
  o: Orientation,
): { readonly width: number; readonly height: number } => {
  const long = weeks * PITCH - CELL_GAP;
  const short = 7 * PITCH - CELL_GAP;
  return o === "wide"
    ? { width: long, height: short }
    : { width: short, height: long };
};

/** Top-left corner of a cell in viewBox units. */
export const cellOrigin = (
  cell: Pick<CalendarCell, "week" | "weekday">,
  o: Orientation,
): { readonly x: number; readonly y: number } =>
  o === "wide"
    ? { x: cell.week * PITCH, y: cell.weekday * PITCH }
    : { x: cell.weekday * PITCH, y: cell.week * PITCH };

/** Start of a row (or column) along the short side, as a fraction, for HTML labels. */
export const laneFraction = (index: number, count: number): number =>
  (index * PITCH) / (count * PITCH - CELL_GAP);

/** Five steps of sleep. Null means no reading: the cell is outlined, not filled. */
export const SLEEP_EDGES: readonly number[] = [5, 6, 7, 8];
export const SLEEP_STEPS: readonly string[] = [
  "under 5 h",
  "5 to 6 h",
  "6 to 7 h",
  "7 to 8 h",
  "8 h or more",
];
export const STEP_OPACITY: readonly number[] = [0.24, 0.4, 0.58, 0.78, 1];

export const sleepStep = (h: number | null): number | null =>
  h === null ? null : SLEEP_EDGES.filter((edge) => h >= edge).length;

/* Strip plots, F2 and F4 */

export interface StripDot {
  /** Position on the axis, 0 to 1. */
  readonly x: number;
  /** 0 is the middle lane; lanes alternate below and above: 0, 1, -1, 2, -2. */
  readonly lane: number;
}

export interface StripOptions {
  readonly domain: Domain;
  /** The width the lanes are packed for, in px. Narrower screens overlap more. */
  readonly width: number;
  readonly dot: number;
  readonly lanes: number;
}

const laneOrder = (lanes: number): number[] =>
  Array.from({ length: lanes }, (_, i) =>
    i % 2 === 0 ? -i / 2 : (i + 1) / 2,
  ).map((l) => (l === 0 ? 0 : l));

/**
 * Packs dots into lanes so they touch rather than pile up: each dot takes the first lane
 * (middle out) where it clears the last dot; when none is clear, the lane that has been free
 * longest. Deterministic, so the server and the browser draw the same thing.
 */
export const stripDots = (
  values: readonly number[],
  { domain, width, dot, lanes }: StripOptions,
): readonly StripDot[] => {
  const order = laneOrder(Math.max(1, lanes));
  const sorted = [...values].sort((a, b) => a - b);
  const start: {
    dots: readonly StripDot[];
    last: ReadonlyMap<number, number>;
  } = {
    dots: [],
    last: new Map(),
  };
  return sorted.reduce((acc, v) => {
    const x = fraction(domain, v);
    const px = x * width;
    const free = order.find((l) => (acc.last.get(l) ?? -Infinity) <= px - dot);
    const lane =
      free ??
      order.reduce((best, l) =>
        (acc.last.get(l) ?? -Infinity) < (acc.last.get(best) ?? -Infinity)
          ? l
          : best,
      );
    return {
      dots: [...acc.dots, { x, lane }],
      last: new Map([...acc.last, [lane, px]]),
    };
  }, start).dots;
};

/* Training tints, F5 */

export type Tint = "cycling" | "strength" | "other";

export const TINTS: readonly {
  readonly key: Tint;
  readonly label: string;
  readonly opacity: number;
}[] = [
  { key: "cycling", label: "cycling", opacity: 1 },
  { key: "strength", label: "strength", opacity: 0.58 },
  { key: "other", label: "everything else", opacity: 0.26 },
];

/** Raw workout types to the three tints: traditional_strength_training -> "strength". */
export const tintFor = (type: string): Tint =>
  type === "cycling" ? "cycling" : /strength/.test(type) ? "strength" : "other";

export interface Segment {
  readonly tint: Tint;
  readonly minutes: number;
  /** Minutes before this segment in the bar. */
  readonly offset: number;
}

/** A month's minutes as three stacked segments in tint order, empty ones left out. */
export const monthSegments = (
  minutes: Readonly<Record<string, number>>,
): readonly Segment[] => {
  const totals = TINTS.map(({ key }) =>
    Object.entries(minutes)
      .filter(([type]) => tintFor(type) === key)
      .reduce((sum, [, m]) => sum + m, 0),
  );
  return TINTS.map(({ key }, i) => ({
    tint: key,
    minutes: totals[i],
    offset: totals.slice(0, i).reduce((a, b) => a + b, 0),
  })).filter((s) => s.minutes > 0);
};

export const totalMinutes = (
  minutes: Readonly<Record<string, number>>,
): number => Object.values(minutes).reduce((a, b) => a + b, 0);

/* Which strip plot sits under which finding, F2 */

const GROUP_FOR_PATTERN: Readonly<Record<string, GroupKey>> = {
  "weekend-sleep": "weekend_vs_weekday",
  rebound: "after_short_vs_long",
  "workout-sleep": "training_vs_rest",
};

export const groupForPattern = (id: string): GroupKey | null =>
  GROUP_FOR_PATTERN[id] ?? null;

/* Verdicts, F6 */

export type VerdictTone = "holds" | "edge" | "other";

/** "holds" reads in text; "at the edge" carries the accent mark. */
export const verdictTone = (verdict: string): VerdictTone => {
  const v = verdict.trim().toLowerCase();
  if (v === "holds") return "holds";
  if (v.includes("edge")) return "edge";
  return "other";
};
