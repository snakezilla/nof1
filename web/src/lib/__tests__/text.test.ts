import { describe, expect, it } from "vitest";
import { heroParts, heroText, patternDiffHours } from "../text";
import type { Pattern } from "../types";
import { publicData } from "../../test/fixtures";

const pattern = (over: Partial<Pattern> = {}, numbers = {}): Pattern => ({
  id: "p",
  title: "Weekends cost me sleep",
  finding: "",
  caveat: "",
  ...over,
  numbers: {
    a_label: "a",
    a_value: "6.3 h",
    b_label: "b",
    b_value: "6.7 h",
    n_a: 1,
    n_b: 1,
    window: "",
    ...numbers,
  },
});

describe("heroParts", () => {
  it("builds the first finding title from the shipped (masked) data", () => {
    const parts = heroParts(publicData().patterns);
    expect(parts).toEqual({
      before: "Weekends cost me ",
      figure: "24 minutes",
      after: " of sleep.",
    });
    expect(parts && heroText(parts)).toBe(
      "Weekends cost me 24 minutes of sleep.",
    );
  });

  it("uses the stated difference, else a minus b", () => {
    expect(patternDiffHours(pattern({}, { diff: "-0.25 h" }))).toBe(-0.25);
    expect(patternDiffHours(pattern())).toBeCloseTo(-0.4);
    expect(heroParts([pattern({}, { diff: "-0.25 h" })])?.figure).toBe(
      "15 minutes",
    );
    expect(heroParts([pattern({}, { diff: "0.02 h" })])?.figure).toBe(
      "1 minute",
    );
  });

  it("falls back when the title has no 'cost me' or there are no numbers", () => {
    expect(heroText(heroParts([pattern({ title: "Late dinners" })])!)).toBe(
      "Late dinners: 24 minutes.",
    );
    expect(
      heroParts([pattern({}, { a_value: "lots", b_value: "few" })]),
    ).toEqual({ before: "Weekends cost me sleep.", figure: "", after: "" });
    expect(heroParts([])).toBeNull();
  });
});
