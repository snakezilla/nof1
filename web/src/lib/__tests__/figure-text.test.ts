import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  YEAR_CAPTION,
  calendarSpan,
  emptyMonths,
  stripLabel,
  stripSummary,
  underShare,
  yearLabel,
  yearSummary,
} from "../figure-text";
import { parseFigures } from "../validate-figures";

const figures = parseFigures(
  JSON.parse(
    readFileSync(join(process.cwd(), "public/data/figures.json"), "utf8"),
  ),
);

describe("figure text from figures.json", () => {
  it("summarises the year with the counts and the weekend gap", () => {
    expect(calendarSpan(figures.calendar)).toBe("May 2024 to April 2025");
    expect(yearLabel(figures)).toContain("May 2024 to April 2025");
    expect(yearSummary(figures)).toBe(
      "240 of 365 nights have a reading. Weekend nights average 5.9 h against 6.3 h for weekday nights. December 2024 has no readings.",
    );
    expect(YEAR_CAPTION.split(". ")).toHaveLength(2);
  });

  it("states each strip pair with n, mean and nights under 6 h", () => {
    const pair = figures.sleep_groups.weekend_vs_weekday;
    expect(underShare(pair[0])).toBe("44% under 6 h");
    expect(stripLabel(pair)).toBe(
      "Hours asleep, one dot per night: weekend nights against weekday nights",
    );
    expect(stripSummary(pair)).toBe(
      "Weekend nights, 64 nights, mean 5.9 h, 28 under 6 h; weekday nights, 176 nights, mean 6.3 h, 55 under 6 h.",
    );
  });

  it("names the empty month", () => {
    expect(emptyMonths(figures.months)).toBe("December 2024");
  });
});

describe("figure text edge cases", () => {
  it("handles no empty months, two empty months and no data", () => {
    const month = (m: string, nights: number) => ({
      month: m,
      label: m,
      nights,
      median_sleep: null,
      training_days: 0,
      training_min: {},
    });
    expect(emptyMonths([month("2024-05", 3)])).toBeNull();
    expect(emptyMonths([month("2024-05", 0), month("2024-06", 0)])).toBe(
      "May 2024 and June 2024",
    );
    expect(calendarSpan({ ...figures.calendar, cells: [] })).toBe("the year");
  });

  it("does not divide by zero for an empty group", () => {
    expect(
      underShare({
        label: "x",
        n: 0,
        mean: 0,
        median: 0,
        under_6: 0,
        values: [],
      }),
    ).toBe("0% under 6 h");
  });
});
