/** The shape of public/data/figures.json, written by prep/figures.py. */

export interface Stat {
  readonly value: string;
  readonly label: string;
}

export interface CalendarCell {
  readonly date: string;
  /** Weeks since the Monday before the first night. */
  readonly week: number;
  /** 0 = Monday, 6 = Sunday. */
  readonly weekday: number;
  /** Null when there is no reading. */
  readonly sleep_h: number | null;
  readonly bed_h: number | null;
  readonly awake_min: number | null;
  readonly workout_min: number;
}

export interface MonthLabel {
  readonly week: number;
  readonly label: string;
}

export interface Calendar {
  readonly start: string;
  readonly weeks: number;
  readonly cells: readonly CalendarCell[];
  readonly months: readonly MonthLabel[];
}

export interface SleepGroup {
  readonly label: string;
  readonly n: number;
  readonly mean: number;
  readonly median: number;
  readonly under_6: number;
  /** Every night's hours, sorted. */
  readonly values: readonly number[];
}

/** The highlighted group first, its comparison second. */
export type GroupPair = readonly [SleepGroup, SleepGroup];

export const GROUP_KEYS = [
  "weekend_vs_weekday",
  "after_short_vs_long",
  "training_vs_rest",
] as const;

export type GroupKey = (typeof GROUP_KEYS)[number];

export type SleepGroups = Readonly<Record<GroupKey, GroupPair>>;

export interface MonthRow {
  readonly month: string;
  readonly label: string;
  readonly nights: number;
  readonly median_sleep: number | null;
  readonly training_days: number;
  /** Minutes by raw workout type, e.g. traditional_strength_training. */
  readonly training_min: Readonly<Record<string, number>>;
}

export interface Claim {
  readonly id: string;
  readonly claim: string;
  readonly a: string;
  readonly b: string;
  readonly n: string;
  readonly difference: string;
  readonly interval: string;
  readonly verdict: string;
}

export interface Figures {
  readonly stats: readonly Stat[];
  readonly calendar: Calendar;
  readonly sleep_groups: SleepGroups;
  readonly months: readonly MonthRow[];
  readonly claims: readonly Claim[];
}
