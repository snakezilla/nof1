import { describe, expect, it } from "vitest";
import {
  BED_DOMAIN,
  BED_TICKS,
  CELL,
  CELL_GAP,
  HOURS_DOMAIN,
  STEP_OPACITY,
  SLEEP_STEPS,
  cellOrigin,
  clamp,
  countOutside,
  fraction,
  gridSize,
  groupForPattern,
  hourTick,
  laneFraction,
  minutesBetween,
  monthSegments,
  nightAxis,
  pct,
  sleepStep,
  stripDots,
  tintFor,
  ticks,
  totalMinutes,
  verdictTone,
} from "../figures";

describe("axis scaling", () => {
  it("maps a value to its place on the domain and pins the ends", () => {
    expect(fraction(HOURS_DOMAIN, 6)).toBe(0.5);
    expect(fraction(HOURS_DOMAIN, 0)).toBe(0);
    expect(fraction(HOURS_DOMAIN, 15)).toBe(1);
    expect(fraction(HOURS_DOMAIN, -2)).toBe(0);
    expect(fraction([3, 3], 3)).toBe(0);
    expect(clamp(5, 0, 1)).toBe(1);
  });

  it("prints CSS percentages and builds tick lists with both ends", () => {
    expect(pct(0.25)).toBe("25.00%");
    expect(ticks(0, 12, 3)).toEqual([0, 3, 6, 9, 12]);
    expect(ticks(0, 3600, 1200)).toEqual([0, 1200, 2400, 3600]);
  });

  it("counts the values drawn pinned at the ends", () => {
    expect(countOutside([21, 22, 24.5, 27, 28.75], BED_DOMAIN)).toBe(2);
  });
});

describe("calendar placement", () => {
  const pitch = CELL + CELL_GAP;

  it("puts weeks across and weekdays down when wide, Sunday in the bottom row", () => {
    expect(cellOrigin({ week: 0, weekday: 0 }, "wide")).toEqual({ x: 0, y: 0 });
    expect(cellOrigin({ week: 3, weekday: 6 }, "wide")).toEqual({
      x: 3 * pitch,
      y: 6 * pitch,
    });
    expect(gridSize(53, "wide")).toEqual({
      width: 53 * pitch - CELL_GAP,
      height: 7 * pitch - CELL_GAP,
    });
  });

  it("turns the grid when tall: weeks down, weekdays across", () => {
    expect(cellOrigin({ week: 3, weekday: 6 }, "tall")).toEqual({
      x: 6 * pitch,
      y: 3 * pitch,
    });
    expect(gridSize(53, "tall")).toEqual({
      width: 7 * pitch - CELL_GAP,
      height: 53 * pitch - CELL_GAP,
    });
  });

  it("places labels at the start of a row", () => {
    expect(laneFraction(0, 7)).toBe(0);
    expect(laneFraction(5, 7)).toBeCloseTo(
      (5 * pitch) / (7 * pitch - CELL_GAP),
    );
  });

  it("shades in five steps and leaves no reading unfilled", () => {
    expect(SLEEP_STEPS).toHaveLength(5);
    expect(STEP_OPACITY).toHaveLength(5);
    expect(sleepStep(null)).toBeNull();
    expect(sleepStep(4.9)).toBe(0);
    expect(sleepStep(5)).toBe(1);
    expect(sleepStep(6.5)).toBe(2);
    expect(sleepStep(7.99)).toBe(3);
    expect(sleepStep(9.76)).toBe(4);
  });
});

describe("strip-plot dot positions", () => {
  const opts = { domain: HOURS_DOMAIN, width: 120, dot: 6, lanes: 3 };

  it("keeps every value, in order, at its place on the axis", () => {
    const dots = stripDots([6, 0, 12], opts);
    expect(dots.map((d) => d.x)).toEqual([0, 0.5, 1]);
  });

  it("puts spread-out dots in the middle lane", () => {
    expect(stripDots([1, 4, 8], opts).map((d) => d.lane)).toEqual([0, 0, 0]);
  });

  it("stacks touching dots middle out: 0, 1, -1, then the lane free longest", () => {
    expect(stripDots([6, 6, 6, 6], opts).map((d) => d.lane)).toEqual([
      0, 1, -1, 0,
    ]);
  });

  it("is deterministic and does not change its input", () => {
    const values = Object.freeze([7, 6.9, 7.1, 7]);
    expect(stripDots(values, opts)).toEqual(stripDots(values, opts));
    expect(values).toEqual([7, 6.9, 7.1, 7]);
  });
});

describe("bedtime clock labels", () => {
  it("names whole hours on a clock that runs past midnight", () => {
    expect(BED_TICKS.map(hourTick)).toEqual([
      "10 pm",
      "11 pm",
      "12 am",
      "1 am",
      "2 am",
      "3 am",
    ]);
    expect(hourTick(12)).toBe("12 pm");
    expect(hourTick(32)).toBe("8 am");
  });

  it("gives a typical night an hour of air and even-hour ticks", () => {
    expect(nightAxis(24.23, 32.22)).toEqual({
      domain: [23, 34],
      ticks: [24, 26, 28, 30, 32, 34],
    });
  });

  it("measures the gap between two medians in minutes", () => {
    expect(minutesBetween(24.54, 24.19)).toBe(21);
  });
});

describe("tint assignment", () => {
  it("maps raw workout types to cycling, strength and everything else", () => {
    expect(tintFor("cycling")).toBe("cycling");
    expect(tintFor("traditional_strength_training")).toBe("strength");
    expect(tintFor("running")).toBe("other");
    expect(tintFor("walking")).toBe("other");
  });

  it("stacks a month in tint order and drops empty segments", () => {
    const minutes = {
      running: 100,
      cycling: 300,
      traditional_strength_training: 50,
      hiking: 20,
    };
    expect(monthSegments(minutes)).toEqual([
      { tint: "cycling", minutes: 300, offset: 0 },
      { tint: "strength", minutes: 50, offset: 300 },
      { tint: "other", minutes: 120, offset: 350 },
    ]);
    expect(monthSegments({ other: 40 })).toEqual([
      { tint: "other", minutes: 40, offset: 0 },
    ]);
    expect(monthSegments({})).toEqual([]);
    expect(totalMinutes(minutes)).toBe(470);
  });
});

describe("verdict mapping", () => {
  it("reads holds plainly and marks at the edge", () => {
    expect(verdictTone("holds")).toBe("holds");
    expect(verdictTone(" Holds ")).toBe("holds");
    expect(verdictTone("at the edge")).toBe("edge");
    expect(verdictTone("not shown")).toBe("other");
  });

  it("pairs each finding with its strip plot", () => {
    expect(groupForPattern("weekend-sleep")).toBe("weekend_vs_weekday");
    expect(groupForPattern("rebound")).toBe("after_short_vs_long");
    expect(groupForPattern("workout-sleep")).toBe("training_vs_rest");
    expect(groupForPattern("unknown")).toBeNull();
  });
});
