import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  formatDay,
  formatMonthYear,
  localIsoDate,
} from "../dates";
import { clockLabel, countLabel, hoursLabel, workoutLabel } from "../format";

describe("dates", () => {
  it("adds days and counts between dates across leap days", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(daysBetween("2022-07-15", "2026-05-13")).toBe(1398);
  });

  it("formats days and months", () => {
    expect(formatDay("2026-05-12")).toEqual({
      weekday: "Tue",
      label: "May 12",
    });
    expect(formatMonthYear("2022-07-15")).toBe("Jul 2022");
    expect(localIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("format", () => {
  it("formats hours as h and m", () => {
    expect(hoursLabel(6.4)).toBe("6 h 24 m");
    expect(hoursLabel(7)).toBe("7 h");
    expect(hoursLabel(0.25)).toBe("0 h 15 m");
  });

  it("formats workouts and counts", () => {
    expect(workoutLabel([])).toBe("workout");
    expect(workoutLabel(["running", "functional_strength"])).toBe(
      "Running, functional strength",
    );
    expect(countLabel(1, "day", "days")).toBe("1 day");
    expect(countLabel(1400, "day", "days")).toBe("1,400 days");
  });
});

describe("clockLabel", () => {
  it("reads a clock that runs past midnight", () => {
    expect(clockLabel(23.5)).toBe("11:30 pm");
    expect(clockLabel(25)).toBe("1:00 am");
    expect(clockLabel(24)).toBe("12:00 am");
    expect(clockLabel(12.25)).toBe("12:15 pm");
    expect(clockLabel(21.999)).toBe("10:00 pm");
    expect(clockLabel(23.9999)).toBe("12:00 am");
  });
});
