import { describe, expect, it } from "vitest";
import {
  extent,
  linePath,
  mean,
  rollingMean,
  summaryLabel,
  countPresent,
  MIN_DAYS_FOR_LINE,
  xAt,
  yAt,
} from "../sparkline";

describe("rollingMean", () => {
  it("averages a centered window and skips nulls", () => {
    expect(rollingMean([1, 2, 3, null, 5], 3)).toEqual([1.5, 2, 2.5, 4, 5]);
  });

  it("returns null where the window has no values", () => {
    expect(rollingMean([null, null, null], 1)).toEqual([null, null, null]);
  });
});

describe("extent and mean", () => {
  it("handle all-null input", () => {
    expect(extent([null])).toBeNull();
    expect(mean([null])).toBeNull();
  });

  it("compute min, max and mean over numbers", () => {
    expect(extent([3, null, 1, 7])).toEqual([1, 7]);
    expect(mean([2, null, 4])).toBe(3);
  });
});

describe("scaling", () => {
  it("maps index to x across the width", () => {
    expect(xAt(0, 5, 100)).toBe(0);
    expect(xAt(4, 5, 100)).toBe(100);
    expect(xAt(0, 1, 100)).toBe(50);
  });

  it("maps the max to the top padding and the min to the bottom", () => {
    expect(yAt(10, [0, 10], 50, 5)).toBe(5);
    expect(yAt(0, [0, 10], 50, 5)).toBe(45);
    expect(yAt(3, [3, 3], 50, 5)).toBe(25);
  });
});

describe("linePath", () => {
  it("is empty for a series with no numbers", () => {
    expect(linePath([null, null], 100, 10)).toBe("");
  });

  it("starts a new segment after a null", () => {
    const d = linePath([0, 10, null, 10], 30, 10, 0);
    expect(d).toBe("M0 10 L10 0 M30 0");
  });
});

describe("summaryLabel", () => {
  const f = (v: number) => `${v} ms`;
  it("covers full, missing recent and missing overall", () => {
    expect(summaryLabel(50, 52, f)).toBe("50 ms recent, 52 ms overall");
    expect(summaryLabel(null, 52, f)).toBe(
      "52 ms overall, none in the listed days",
    );
    expect(summaryLabel(null, null, f)).toBe("no readings");
  });
});

describe("countPresent", () => {
  it("counts non-null values", () => {
    expect(countPresent([1, null, 0, null])).toBe(2);
    expect(MIN_DAYS_FOR_LINE).toBe(30);
  });
});
