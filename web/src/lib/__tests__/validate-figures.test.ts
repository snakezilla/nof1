import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseFigures, parseFiguresOrNull } from "../validate-figures";

const real = (): Record<string, unknown> =>
  JSON.parse(
    readFileSync(join(process.cwd(), "public/data/figures.json"), "utf8"),
  );

describe("parseFigures", () => {
  it("accepts the shipped file", () => {
    const f = parseFigures(real());
    expect(f.stats).toHaveLength(4);
    expect(f.calendar.cells).toHaveLength(365);
    expect(f.months).toHaveLength(12);
  });

  it("names the first part that is wrong", () => {
    expect(() => parseFigures([])).toThrow("figures.json: expected an object");
    expect(() => parseFigures({ ...real(), stats: [{ value: 1 }] })).toThrow(
      "figures.json: stats does not match the schema",
    );
    const cal = real().calendar as Record<string, unknown>;
    expect(() =>
      parseFigures({
        ...real(),
        calendar: { ...cal, cells: [{ date: "x", week: 0, weekday: 9 }] },
      }),
    ).toThrow("calendar");
    expect(() =>
      parseFigures({ ...real(), sleep_groups: { weekend_vs_weekday: [] } }),
    ).toThrow("sleep_groups.weekend_vs_weekday");
    expect(() => parseFigures({ ...real(), sleep_groups: 3 })).toThrow(
      "sleep_groups does not",
    );
    expect(() => parseFigures({ ...real(), bedtime: {} })).toThrow("bedtime");
    expect(() => parseFigures({ ...real(), typical_night: {} })).toThrow(
      "typical_night",
    );
    expect(() =>
      parseFigures({ ...real(), months: [{ month: "x", label: "x" }] }),
    ).toThrow("months");
    expect(() => parseFigures({ ...real(), claims: [{ id: 1 }] })).toThrow(
      "claims",
    );
  });
});

describe("parseFiguresOrNull", () => {
  it("returns null when the file is missing or wrong, so the page still renders", () => {
    expect(parseFiguresOrNull(undefined)).toBeNull();
    expect(parseFiguresOrNull(null)).toBeNull();
    expect(parseFiguresOrNull({ stats: "no" })).toBeNull();
    expect(parseFiguresOrNull(real())?.claims).toHaveLength(3);
  });
});
