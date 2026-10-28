import { describe, expect, it } from "vitest";
import {
  SHORT_ROWS,
  gapLabel,
  isHidden,
  nightCells,
  nightRows,
  toggleLabel,
  windowNightCount,
} from "../nights";
import { day, publicData } from "../../test/fixtures";

describe("nightCells", () => {
  it("formats a full night", () => {
    const row = nightCells(
      day("2025-04-23", {
        sleep_h: 6.39,
        awake_min: 37,
        bed_h: 25.3,
        workout_min: 28,
        workout_types: ["other", "traditional_strength_training"],
      }),
    );
    expect(row).toEqual({
      kind: "night",
      date: "2025-04-23",
      weekday: "Wed",
      day: "Apr 23",
      sleep: "6.4 h",
      awake: "37 min",
      bedtime: "1:18 am",
      training: "28 min",
      trainingKind: "traditional strength training",
    });
  });

  it("leaves missing values empty, never 'none'", () => {
    const row = nightCells(
      day("2025-03-16", { sleep_h: null, awake_min: null, bed_h: null }),
    );
    expect([row.sleep, row.awake, row.bedtime, row.training]).toEqual([
      "",
      "",
      "",
      "",
    ]);
    expect(
      nightCells(
        day("2025-01-01", { workout_min: 20, workout_types: ["other"] }),
      ).trainingKind,
    ).toBe("");
  });
});

describe("nightRows on the shipped data", () => {
  const { daily } = publicData();
  const rows = nightRows(daily);

  it("runs newest first from the last night", () => {
    expect(rows[0]).toMatchObject({ kind: "night", date: "2025-04-23" });
    expect(rows[rows.length - 1]).toMatchObject({ date: "2025-02-18" });
  });

  it("folds empty days into gap rows", () => {
    const gaps = rows.filter((r) => r.kind === "gap");
    expect(gaps.map((g) => g.label)).toEqual([
      "No data for 1 night",
      "No data for 2 nights",
    ]);
  });

  it("keeps a day with training but no sleep as a row with an empty sleep cell", () => {
    const row = rows.find((r) => r.kind === "night" && r.date === "2025-04-20");
    expect(row).toMatchObject({ sleep: "", training: "133 min" });
  });

  it("never prints 'none' or a negative zero", () => {
    const text = JSON.stringify(rows);
    expect(text).not.toMatch(/none/i);
    expect(text).not.toMatch(/-0\.0/);
  });

  it("counts the 60 nights the toggle offers", () => {
    expect(windowNightCount(daily)).toBe(60);
  });
});

describe("the 14 and 60 toggle", () => {
  it("hides rows past the first 14 until expanded", () => {
    expect(SHORT_ROWS).toBe(14);
    expect(isHidden(13, false)).toBe(false);
    expect(isHidden(14, false)).toBe(true);
    expect(isHidden(59, true)).toBe(false);
  });

  it("labels both states", () => {
    expect(toggleLabel(false, 60)).toBe("Show all 60 nights");
    expect(toggleLabel(true, 60)).toBe("Show the last 14");
    expect(gapLabel(3)).toBe("No data for 3 nights");
  });
});
