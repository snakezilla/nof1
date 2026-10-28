import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  bedCaption,
  bedGap,
  bedSummary,
  calendarSpan,
  emptyMonths,
  monthsCaption,
  monthsLabel,
  monthsSummary,
  stripLabel,
  stripSummary,
  typicalLabel,
  typicalSummary,
  underShare,
  yearCaption,
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
    expect(yearCaption(figures)).toContain("5.9 h against 6.3 h");
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

  it("reads a typical night and the bedtimes as clock times", () => {
    expect(typicalLabel(figures.typical_night)).toBe(
      "A typical night from 12:46 am to 7:38 am",
    );
    expect(typicalSummary(figures.typical_night)).toBe(
      "Lights out at 12:46 am, 6.3 h asleep, 36 min awake, up at 7:38 am; medians of 240 nights.",
    );
    expect(bedGap(figures.bedtime)).toBe(22);
    expect(bedSummary(figures.bedtime)).toBe(
      "Median bedtime 1:04 am on weekend nights and 12:42 am on weekdays, 22 minutes apart; 95 of 240 nights started after 1 am.",
    );
    expect(bedCaption(figures.bedtime)).toMatch(
      /^Each dot is one night\. The ticks are the medians, 22 minutes apart\. 95 of 240 nights started after 1 am\. 28 bedtimes before 10 pm or after 3 am sit at the ends of the axis\.$/,
    );
  });

  it("names the busiest month and the empty one", () => {
    expect(emptyMonths(figures.months)).toBe("December 2024");
    expect(monthsLabel(figures.months)).toContain("May 2024 to April 2025");
    expect(monthsSummary(figures.months)).toBe(
      "The most training was in June 2024, 2,399 minutes over 22 days. December 2024 has no readings.",
    );
    expect(monthsCaption(figures.months)).toContain(
      "December 2024 has no readings, so its row is outlined.",
    );
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
    expect(monthsLabel([])).toBe("Training minutes by month and type");
    expect(monthsSummary([])).toBe("");
    expect(monthsCaption([month("2024-05", 3)])).not.toContain("outlined");
    expect(calendarSpan({ ...figures.calendar, cells: [] })).toBe("the year");
  });

  it("drops the ends note when every bedtime is on the axis", () => {
    const b = {
      ...figures.bedtime,
      weekend: { ...figures.bedtime.weekend, values: [24] },
      weekday: { ...figures.bedtime.weekday, values: [25] },
    };
    expect(bedCaption(b)).not.toContain("ends of the axis");
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
