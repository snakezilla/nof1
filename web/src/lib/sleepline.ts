import { fillCalendar, recentWindow } from "./days";
import { linePath, mean, rollingMean, xAt } from "./sparkline";
import type { Day } from "./types";

export const LINE_W = 1000;
export const LINE_H = 120;
const SMOOTH = 7;

export interface SleepLine {
  readonly path: string;
  readonly from: string;
  readonly to: string;
  /** The table's window, as fractions of the width, for the bracket. */
  readonly bracket: {
    readonly from: string;
    readonly to: string;
    readonly start: number;
    readonly end: number;
  } | null;
  readonly yearMean: number | null;
  readonly windowMean: number | null;
}

/** One line: the 7-night average of sleep across every calendar day. Gaps break it. */
export const sleepLine = (
  days: readonly Day[],
  windowNights: number,
): SleepLine | null => {
  const all = fillCalendar(days);
  if (all.length === 0) return null;
  const sleep = all.map((d) => d.sleep_h);
  const win = recentWindow(days, windowNights);
  const at = (date: string) =>
    xAt(
      Math.max(
        0,
        all.findIndex((d) => d.date === date),
      ),
      all.length,
      1,
    );
  return {
    path: linePath(rollingMean(sleep, SMOOTH), LINE_W, LINE_H, 6),
    from: all[0].date,
    to: all[all.length - 1].date,
    bracket: win
      ? { from: win.from, to: win.to, start: at(win.from), end: at(win.to) }
      : null,
    yearMean: mean(sleep),
    windowMean: win
      ? mean(
          all
            .filter((d) => d.date >= win.from && d.date <= win.to)
            .map((d) => d.sleep_h),
        )
      : null,
  };
};
