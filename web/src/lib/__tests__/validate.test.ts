import { describe, expect, it } from "vitest";
import { parseMeta, parsePatterns } from "../validate";
import { rawFixtures } from "../../test/fixtures";

describe("fixtures match the schema", () => {
  it("parses both files", () => {
    expect(parsePatterns(rawFixtures.patterns)).toHaveLength(3);
    expect(parseMeta(rawFixtures.meta).range.from).toBe("2022-07-15");
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

describe("parseMeta", () => {
  it("rejects a bad range", () => {
    expect(() =>
      parseMeta({ ...rawFixtures.meta, range: { from: "x", to: "y" } }),
    ).toThrow(/meta.json/);
  });
});

describe("optional fields from the prep step", () => {
  it("accepts extra numbers and a tagline", () => {
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
  });

  it("rejects wrong types in optional fields", () => {
    const [p] = rawFixtures.patterns;
    expect(() =>
      parsePatterns([{ ...p, numbers: { ...p.numbers, diff: 1 } }]),
    ).toThrow();
    expect(() => parseMeta({ ...rawFixtures.meta, tagline: 3 })).toThrow();
  });
});

describe("meta counts", () => {
  it("accepts nights and workout_days in meta", () => {
    expect(
      parseMeta({ ...rawFixtures.meta, nights: 246, workout_days: 157 }).nights,
    ).toBe(246);
    expect(() => parseMeta({ ...rawFixtures.meta, nights: "246" })).toThrow();
  });
});
