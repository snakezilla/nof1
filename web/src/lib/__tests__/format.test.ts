import { describe, expect, it } from "vitest";
import { formatMonthYear, formatMonthYearLong } from "../dates";

describe("dates", () => {
  it("formats months short and long", () => {
    expect(formatMonthYear("2022-07-15")).toBe("Jul 2022");
    expect(formatMonthYearLong("2025-04-30")).toBe("April 2025");
  });
});
