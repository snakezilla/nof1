import { describe, expect, it } from "vitest";
import {
  emptyDay,
  fillCalendar,
  hasData,
  recentWindow,
  timelineRows,
  withYearMarkers,
} from "../days";
import { day, fixtureDaily } from "../../test/fixtures";

describe("hasData", () => {
  it("is false for an empty day and true when any metric is present", () => {
    expect(hasData(emptyDay("2024-01-01"))).toBe(false);
    expect(hasData({ ...emptyDay("2024-01-01"), mindful_min: 5 })).toBe(true);
    expect(hasData({ ...emptyDay("2024-01-01"), workout_min: 20 })).toBe(true);
    expect(hasData({ ...emptyDay("2024-01-01"), sleep_h: 6 })).toBe(true);
    expect(hasData({ ...emptyDay("2024-01-01"), hrv_ms: 40 })).toBe(true);
  });
});

describe("fillCalendar", () => {
  it("returns an empty list for no input", () => {
    expect(fillCalendar([])).toEqual([]);
  });

  it("inserts missing calendar days as empty days", () => {
    const out = fillCalendar([day("2024-02-27"), day("2024-03-01")]);
    expect(out.map((d) => d.date)).toEqual([
      "2024-02-27",
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
    ]);
    expect(hasData(out[1])).toBe(false);
  });

  it("does not change the input", () => {
    const input = Object.freeze([day("2024-01-01"), day("2024-01-03")]);
    fillCalendar(input);
    expect(input).toHaveLength(2);
  });
});

describe("recentWindow", () => {
  it("is null when no day has data", () => {
    expect(recentWindow([emptyDay("2024-01-01")], 60)).toBeNull();
  });

  it("covers the last n days with data, skipping trailing empty days", () => {
    const days = [
      day("2024-01-01"),
      day("2024-01-02"),
      emptyDay("2024-01-03"),
      day("2024-01-04"),
      emptyDay("2024-01-05"),
    ];
    expect(recentWindow(days, 2)).toEqual({
      from: "2024-01-02",
      to: "2024-01-04",
    });
    expect(recentWindow(days, 10)).toEqual({
      from: "2024-01-01",
      to: "2024-01-04",
    });
  });
});

describe("timelineRows", () => {
  it("is empty without data", () => {
    expect(timelineRows([], 60)).toEqual([]);
  });

  it("lists newest first and collapses runs of empty days into one gap row", () => {
    const days = [
      day("2024-01-01"),
      emptyDay("2024-01-02"),
      emptyDay("2024-01-03"),
      day("2024-01-05"),
      emptyDay("2024-01-06"),
      day("2024-01-07"),
    ];
    const rows = timelineRows(days, 60);
    expect(
      rows.map((r) =>
        r.kind === "day" ? r.day.date : `gap:${r.from}..${r.to}:${r.count}`,
      ),
    ).toEqual([
      "2024-01-07",
      "gap:2024-01-06..2024-01-06:1",
      "2024-01-05",
      "gap:2024-01-02..2024-01-04:3",
      "2024-01-01",
    ]);
  });

  it("covers exactly 60 nights with sleep in the fixture", () => {
    const rows = timelineRows(fixtureDaily, 60);
    const nights = rows.filter(
      (r) => r.kind === "day" && r.day.sleep_h !== null,
    );
    expect(nights).toHaveLength(60);
    expect(rows[0].kind).toBe("day");
  });
});

describe("withYearMarkers", () => {
  it("marks the first row and each change of year, using a gap's newest date", () => {
    const rows = timelineRows(
      [
        day("2024-12-30"),
        emptyDay("2024-12-31"),
        emptyDay("2025-01-01"),
        day("2025-01-02"),
      ],
      60,
    );
    const out = withYearMarkers(rows).map((r) =>
      r.kind === "year" ? `y${r.year}` : r.kind,
    );
    expect(out).toEqual(["y2025", "day", "gap", "y2024", "day"]);
  });

  it("is empty for no rows", () => {
    expect(withYearMarkers([])).toEqual([]);
  });
});

describe("recentWindow by nights", () => {
  it("starts at the n-th last night with sleep and ends at the last night, not a later workout", () => {
    const days = [
      day("2024-01-01"),
      day("2024-01-02", { sleep_h: null }),
      day("2024-01-03"),
      day("2024-01-04", { sleep_h: null, hrv_ms: null, workout_min: 20 }),
    ];
    expect(recentWindow(days, 2)).toEqual({
      from: "2024-01-01",
      to: "2024-01-03",
    });
    expect(recentWindow(days, 1)).toEqual({
      from: "2024-01-03",
      to: "2024-01-03",
    });
  });

  it("falls back to days with any data when no night has sleep", () => {
    const days = [
      day("2024-01-01", { sleep_h: null }),
      day("2024-01-02", { sleep_h: null }),
    ];
    expect(recentWindow(days, 1)).toEqual({
      from: "2024-01-02",
      to: "2024-01-02",
    });
  });
});
