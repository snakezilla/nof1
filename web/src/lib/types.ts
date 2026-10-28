import type { Figures } from "./figure-types";
import type { MaskInfo } from "./mask";
import type { RawStream } from "./raw-stream";

export interface Day {
  readonly date: string;
  readonly hrv_ms: number | null;
  readonly hrv_n: number;
  readonly sleep_h: number | null;
  readonly deep_h: number | null;
  readonly rem_h: number | null;
  readonly workout_min: number;
  readonly workout_types: readonly string[];
  readonly mindful_min: number;
  /** Minutes awake during the night. */
  readonly awake_min?: number | null;
  /** Bedtime as a decimal hour that runs past midnight: 23.5 = 11:30 pm, 25 = 1:00 am. */
  readonly bed_h?: number | null;
}

export interface PatternNumbers {
  readonly a_label: string;
  readonly a_value: string;
  readonly b_label: string;
  readonly b_value: string;
  readonly n_a: number;
  readonly n_b: number;
  readonly window: string;
  readonly diff?: string;
  readonly ci95?: string;
}

export interface Pattern {
  readonly id: string;
  readonly title: string;
  readonly finding: string;
  readonly numbers: PatternNumbers;
  readonly caveat: string;
}

export type CheckinQuestion =
  | {
      readonly id: string;
      readonly q: string;
      readonly type: "scale";
      readonly min: number;
      readonly max: number;
    }
  | { readonly id: string; readonly q: string; readonly type: "yesno" }
  | {
      readonly id: string;
      readonly q: string;
      readonly type: "number";
      readonly min?: number;
      readonly max?: number;
      readonly step?: number;
    };

export interface Experiment {
  readonly title: string;
  readonly hypothesis: string;
  readonly why: string;
  readonly pattern_id: string;
  readonly duration_days: number;
  readonly protocol: readonly string[];
  readonly checkin: readonly CheckinQuestion[];
  readonly baseline: {
    readonly label: string;
    readonly sleep_h: number | null;
    readonly hrv_ms: number | null;
    readonly weekday_sleep_h?: number | null;
  };
  readonly success: string;
}

export interface Meta {
  readonly range: { readonly from: string; readonly to: string };
  readonly days: number;
  readonly days_with_data?: number;
  readonly nights?: number;
  readonly workout_days?: number;
  readonly tagline?: string;
  readonly sources: readonly string[];
  readonly built: string;
  readonly repo: string;
  /** True when prep/ masked the health values before writing. */
  readonly masked?: boolean;
  /** Where the records came from. Absent when meta.json has none or it has the wrong shape. */
  readonly provenance?: Provenance;
}

/** How the streams were joined into one row per day. Counts of records, not health values. */
export interface Fusion {
  readonly raw_lines: number;
  readonly repeats: number;
  readonly records: number;
  readonly dropped_streams: number;
  readonly days: number;
}

export interface Exclusion {
  readonly what: string;
  readonly rows: number;
  readonly why: string;
}

export interface Provenance {
  /** "Apple Health (HealthKit) on my iPhone" */
  readonly hub: string;
  /** "HealthExporter, my own iOS app: what it does, as a list" */
  readonly exporter: string;
  readonly nights_by_app: Readonly<Record<string, number>>;
  readonly workouts_by_app: Readonly<Record<string, number>>;
  readonly excluded: readonly Exclusion[];
  readonly window: { readonly from: string; readonly to: string };
  /** Every app that ever wrote into Apple Health. Absent until prep/ writes it. */
  readonly all_sources?: readonly HealthSource[];
  /** Absent until prep/ writes it, or when it has the wrong shape. */
  readonly fusion?: Fusion;
}

export interface HealthSource {
  readonly name: string;
  readonly types: readonly string[];
  readonly records: number;
  readonly first: string;
  readonly last: string;
  readonly in_window: number;
  /** "used", "excluded", "outside the window" or "not used". */
  readonly status: string;
  readonly reason: string;
}

export interface Dataset {
  readonly daily: readonly Day[];
  readonly patterns: readonly Pattern[];
  readonly test: Experiment;
  readonly meta: Meta;
  /** Null when figures.json is missing or has the wrong shape; the page says so in one sentence. */
  readonly figures: Figures | null;
  /** Null when raw-stream.json is missing or has the wrong shape; the subsection is dropped. */
  readonly rawStream: RawStream | null;
  /** Null when mask.json is missing or wrong; the page then makes no masked claims. */
  readonly mask: MaskInfo | null;
}
