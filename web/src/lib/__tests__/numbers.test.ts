import { describe, expect, it } from "vitest";
import {
  MINUS,
  cleanNumbers,
  formatHours,
  formatMinutes,
  formatTenths,
  parseHours,
  parseInterval,
} from "../numbers";
import { publicData } from "../../test/fixtures";

describe("formatTenths and formatHours", () => {
  it("prints one decimal with a true minus sign", () => {
    expect(formatHours(7.61)).toBe("7.6 h");
    expect(formatHours(7)).toBe("7.0 h");
    expect(formatTenths(-1.26)).toBe(`${MINUS}1.3`);
  });

  it("never prints a negative zero", () => {
    const values = Array.from({ length: 99 }, (_, i) => (i - 49) / 1000);
    values.forEach((v) => {
      expect(formatHours(v)).toBe("0.0 h");
      expect(formatTenths(v)).not.toMatch(/[-−]0\.0/);
    });
    expect(formatHours(-0)).toBe("0.0 h");
  });

  it("prints whole minutes without a sign", () => {
    expect(formatMinutes(12.4)).toBe("12 min");
    expect(formatMinutes(-3)).toBe("3 min");
  });
});

describe("parseHours and parseInterval", () => {
  it("reads numbers from the data strings", () => {
    expect(parseHours("-0.2 h")).toBe(-0.2);
    expect(parseHours(`${MINUS}1.3 h`)).toBe(-1.3);
    expect(parseHours("6.4 h")).toBe(6.4);
    expect(parseHours(undefined)).toBeNull();
    expect(parseHours("none")).toBeNull();
    expect(parseInterval("-0.9 to -0.2 h")).toEqual([-0.9, -0.2]);
    expect(parseInterval("6.4 h")).toBeNull();
  });
});

describe("cleanNumbers", () => {
  it("turns hyphen minus signs into true minus signs", () => {
    expect(cleanNumbers("-0.9 to -0.2 h")).toBe(`${MINUS}0.9 to ${MINUS}0.2 h`);
    expect(cleanNumbers("interval (-1.6 to -0.4 h)")).toBe(
      `interval (${MINUS}1.6 to ${MINUS}0.4 h)`,
    );
  });

  it("folds a negative zero into zero", () => {
    expect(cleanNumbers("-0.6 to -0.0 h")).toBe(`${MINUS}0.6 to 0.0 h`);
    expect(cleanNumbers(`${MINUS}0 h`)).toBe("0 h");
    expect(cleanNumbers("-0.05 h")).toBe(`${MINUS}0.05 h`);
  });

  it("leaves hyphenated words, dates and times alone", () => {
    const text = "wake-ups on 2025-04-23 at 12:40 am, a two-week test";
    expect(cleanNumbers(text)).toBe(text);
  });

  it("leaves no negative zero anywhere in the shipped patterns", () => {
    publicData().patterns.forEach((p) => {
      const all = [p.finding, p.caveat, p.numbers.diff, p.numbers.ci95]
        .filter((s): s is string => s !== undefined)
        .map(cleanNumbers)
        .join(" ");
      expect(all).not.toMatch(/[-−]0\.0(?!\d)/);
      expect(all).not.toMatch(/(^|[\s(])-\d/);
    });
  });
});
