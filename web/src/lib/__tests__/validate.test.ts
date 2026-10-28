import { describe, expect, it } from "vitest";
import {
  DataShapeError,
  isCheckinQuestion,
  parseDaily,
  parseExperiment,
  parseMeta,
  parsePatterns,
} from "../validate";
import { day, rawFixtures } from "../../test/fixtures";

describe("fixtures match the schema", () => {
  it("parses all four files", () => {
    expect(parseDaily(rawFixtures.daily).length).toBeGreaterThan(1300);
    expect(parsePatterns(rawFixtures.patterns)).toHaveLength(3);
    expect(parseExperiment(rawFixtures.test).duration_days).toBe(14);
    expect(parseMeta(rawFixtures.meta).range.from).toBe("2022-07-15");
  });
});

describe("parseDaily", () => {
  it("sorts ascending without changing the input", () => {
    const input = [day("2024-01-02"), day("2024-01-01")];
    expect(parseDaily(input).map((d) => d.date)).toEqual([
      "2024-01-01",
      "2024-01-02",
    ]);
    expect(input[0].date).toBe("2024-01-02");
  });

  it("rejects non-arrays and bad rows with the row number", () => {
    expect(() => parseDaily({})).toThrow(DataShapeError);
    expect(() =>
      parseDaily([day("2024-01-01"), { ...day("2024-01-02"), hrv_ms: "54" }]),
    ).toThrow(/row 1/);
    expect(() => parseDaily([{ ...day("2024-01-02"), date: "Jan 2" }])).toThrow(
      /row 0/,
    );
    expect(() =>
      parseDaily([{ ...day("2024-01-02"), workout_types: [1] }]),
    ).toThrow();
  });
});

describe("parsePatterns", () => {
  it("rejects missing numbers", () => {
    const [p] = rawFixtures.patterns;
    expect(() => parsePatterns("x")).toThrow(/expected an array/);
    expect(() =>
      parsePatterns([{ ...p, numbers: { ...p.numbers, n_a: "83" } }]),
    ).toThrow(/item 0/);
    expect(() => parsePatterns([{ ...p, numbers: null }])).toThrow();
  });
});

describe("parseExperiment and checkin questions", () => {
  it("accepts the three question types", () => {
    expect(
      isCheckinQuestion({ id: "a", q: "?", type: "scale", min: 1, max: 5 }),
    ).toBe(true);
    expect(isCheckinQuestion({ id: "a", q: "?", type: "yesno" })).toBe(true);
    expect(isCheckinQuestion({ id: "a", q: "?", type: "number" })).toBe(true);
  });

  it("rejects unknown types and bad bounds", () => {
    expect(isCheckinQuestion({ id: "a", q: "?", type: "text" })).toBe(false);
    expect(
      isCheckinQuestion({ id: "a", q: "?", type: "scale", min: 5, max: 1 }),
    ).toBe(false);
    expect(
      isCheckinQuestion({ id: "a", q: "?", type: "number", min: "0" }),
    ).toBe(false);
    expect(isCheckinQuestion({ q: "?", type: "yesno" })).toBe(false);
  });

  it("rejects a test without a baseline", () => {
    expect(() =>
      parseExperiment({ ...rawFixtures.test, baseline: undefined }),
    ).toThrow(/test.json/);
  });
});

describe("parseMeta", () => {
  it("rejects a bad range", () => {
    expect(() =>
      parseMeta({ ...rawFixtures.meta, range: { from: "x", to: "y" } }),
    ).toThrow(/meta.json/);
  });
});

describe("optional fields from the prep step", () => {
  it("accepts null baselines, extra numbers and a tagline", () => {
    const t = parseExperiment({
      ...rawFixtures.test,
      baseline: { label: "x", sleep_h: 6.2, hrv_ms: null, weekday_sleep_h: 7 },
    });
    expect(t.baseline.hrv_ms).toBeNull();
    const [p] = rawFixtures.patterns;
    expect(
      parsePatterns([
        {
          ...p,
          numbers: { ...p.numbers, diff: "-0.8 h", ci95: "-1.4 to -0.3 h" },
        },
      ]),
    ).toHaveLength(1);
    expect(
      parseMeta({
        ...rawFixtures.meta,
        tagline: "A year of nights.",
        days_with_data: 261,
      }).tagline,
    ).toBe("A year of nights.");
    expect(
      isCheckinQuestion({ id: "a", q: "?", type: "number", step: 0.1 }),
    ).toBe(true);
  });

  it("rejects wrong types in optional fields", () => {
    const [p] = rawFixtures.patterns;
    expect(() =>
      parsePatterns([{ ...p, numbers: { ...p.numbers, diff: 1 } }]),
    ).toThrow();
    expect(() => parseMeta({ ...rawFixtures.meta, tagline: 3 })).toThrow();
    expect(() =>
      parseExperiment({
        ...rawFixtures.test,
        baseline: { label: "x", sleep_h: "6", hrv_ms: null },
      }),
    ).toThrow();
  });
});

describe("night fields and meta counts", () => {
  it("accepts awake_min and bed_h as numbers, null or absent", () => {
    expect(
      parseDaily([day("2024-01-01", { awake_min: 20, bed_h: 24.5 })]),
    ).toHaveLength(1);
    expect(
      parseDaily([day("2024-01-01", { awake_min: null, bed_h: null })]),
    ).toHaveLength(1);
    expect(() => parseDaily([{ ...day("2024-01-01"), bed_h: "1am" }])).toThrow(
      /row 0/,
    );
  });

  it("accepts nights and workout_days in meta", () => {
    expect(
      parseMeta({ ...rawFixtures.meta, nights: 246, workout_days: 157 }).nights,
    ).toBe(246);
    expect(() => parseMeta({ ...rawFixtures.meta, nights: "246" })).toThrow();
  });
});
