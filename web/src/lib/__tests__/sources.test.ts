import { describe, expect, it } from "vitest";
import {
  MASK_NOTE,
  isMaskInfo,
  maskParagraphs,
  parseMaskOrNull,
} from "../mask";
import { shortNames, sourceYears } from "../source-years";
import {
  appsThatMeasured,
  countWord,
  DECK,
  flowLabel,
  fusionLines,
  headline,
  headlineText,
  sourceLine,
  sourceStats,
  yearsCovered,
} from "../sources-text";
import type { MaskInfo } from "../mask";
import type { HealthSource, Provenance } from "../types";
import { publicData } from "../../test/fixtures";

const source = (
  name: string,
  over: Partial<HealthSource> = {},
): HealthSource => ({
  name,
  types: ["sleep"],
  records: 10,
  first: "2024-01-01",
  last: "2024-12-31",
  in_window: 0,
  status: "outside the window",
  reason: "",
  ...over,
});

const prov = (sources: HealthSource[]): Provenance => ({
  ...publicData().meta.provenance!,
  all_sources: sources,
});

describe("headline", () => {
  it("counts the apps from the shipped data, leaving out the ECG app and unknown apps", () => {
    const p = publicData().meta.provenance;
    expect(p?.all_sources).toHaveLength(14);
    expect(appsThatMeasured(p)).toBe(12);
    expect(headlineText(headline(p))).toBe(
      "Twelve apps measured me. None of them talked to each other.",
    );
  });

  it("writes a count under ten as a word", () => {
    const p = prov(
      [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "ECG app on Apple Watch",
        "Unwind (unknown app)",
      ].map((n) => source(n)),
    );
    expect(headline(p)).toEqual({
      figure: "Seven",
      rest: " apps measured me. None of them talked to each other.",
    });
    expect(headline(prov([source("A")])).rest).toMatch(/^ app measured/);
    expect(countWord(9)).toBe("nine");
    expect(countWord(12)).toBe("twelve");
    expect(countWord(21)).toBe("21");
  });

  it("falls back to a sentence with no number without all_sources", () => {
    expect(headlineText(headline(undefined))).toBe(
      "My apps measured me. None of them talked to each other.",
    );
  });
});

describe("source stats", () => {
  it("sums records and spans years across every source", () => {
    expect(
      sourceStats(publicData().meta.provenance)?.map((s) => s.value),
    ).toEqual(["12", "267,399", "6", "1"]);
    expect(yearsCovered("2024-01-01", "2024-03-01")).toBe(1);
    expect(sourceStats(undefined)).toBeNull();
  });
});

describe("hero copy", () => {
  it("keeps the deck to two sentences", () => {
    expect(DECK).toBe(
      "WHOOP had my sleep, Strava my rides, my phone my steps, a scale my weight. I got them out and joined them into one row per day.",
    );
  });

  it("dates the window in words and lists the four steps, only mine accented", () => {
    const line = sourceLine(prov([]));
    expect(line?.window).toBe("May 2024 to April 2025");
    expect(line?.steps.map((s) => s.label)).toEqual([
      "WHOOP strap",
      "Apple Health",
      "Export app I wrote",
      "This page",
    ]);
    expect(line?.steps.filter((s) => s.mine).map((s) => s.label)).toEqual([
      "Export app I wrote",
    ]);
    expect(
      sourceLine({
        ...prov([]),
        window: { from: "2023-01-01", to: "2023-12-31" },
      })?.window,
    ).toBe("January 2023 to December 2023");
    expect(sourceLine(undefined)).toBeNull();
  });

  it("names the flow as one sentence for screen readers", () => {
    expect(flowLabel(sourceLine(prov([]))?.steps ?? [])).toBe(
      "How the data got here: WHOOP strap, which I also hacked to read the raw signal over Bluetooth, then Apple Health, then an export app I wrote, then this page",
    );
  });

  it("branches once, from the strap, with a note that obeys the copy rules", () => {
    const steps = sourceLine(prov([]))?.steps ?? [];
    expect(steps.map((s) => s.branch ?? null)).toEqual([
      "Hacked: raw signal over Bluetooth",
      null,
      null,
      null,
    ]);
  });
});

describe("fusion lines", () => {
  it("states the counts, and plural streams read right", () => {
    const lines = fusionLines({
      raw_lines: 1000,
      repeats: 400,
      records: 600,
      dropped_streams: 2,
      days: 1,
    });
    expect(lines).toEqual([
      "1,000 lines in the raw export.",
      "400 repeats across sync batches, matched by sample ID.",
      "Two streams dropped for the wrong units.",
      "One row per day: 1 day.",
    ]);
  });
});

describe("source years", () => {
  it("places bars on a 2020 to 2026 axis, used first, the window as a band", () => {
    const f = sourceYears(publicData().meta.provenance)!;
    expect(f.ticks.map((t) => t.label)).toEqual([
      "2020",
      "2021",
      "2022",
      "2023",
      "2024",
      "2025",
      "2026",
    ]);
    expect(f.ticks[0].at).toBe(0);
    expect(f.rows.slice(0, 3).every((r) => r.kind === "used")).toBe(true);
    expect(f.rows.find((r) => r.name === "Unstrap")?.kind).toBe("excluded");
    f.rows.forEach((r) => {
      expect(r.left).toBeGreaterThanOrEqual(0);
      expect(r.left + r.width).toBeLessThanOrEqual(100);
    });
    expect(f.window.left).toBeGreaterThan(60);
    expect(f.window.width).toBeGreaterThan(13);
    expect(f.window.width).toBeLessThan(15);
  });

  it("shortens names unless two would read the same", () => {
    expect(
      shortNames([
        "Unstrap (open-source reader)",
        "VeSync (smart scale)",
        "VeSync (smart scale, newer app)",
        "WHOOP",
      ]),
    ).toEqual([
      "Unstrap",
      "VeSync (smart scale)",
      "VeSync (smart scale, newer app)",
      "WHOOP",
    ]);
  });

  it("is null without sources", () => {
    expect(sourceYears(undefined)).toBeNull();
    expect(sourceYears(prov([]))).toBeNull();
  });
});

describe("mask", () => {
  const info: MaskInfo = {
    masked: true,
    method: "shifted by a seed.",
    ranges: { sleep: "x0.85 to x1.15" },
    real: ["dates", "workout types"],
  };

  it("accepts only a mask that says masked: true", () => {
    expect(isMaskInfo(info)).toBe(true);
    expect(parseMaskOrNull({ ...info, masked: false })).toBeNull();
    expect(parseMaskOrNull({ ...info, ranges: { sleep: 3 } })).toBeNull();
    expect(parseMaskOrNull(undefined)).toBeNull();
  });

  it("says how the masking works in two sentences, the method from the file", () => {
    expect(maskParagraphs(info)).toEqual([
      "Shifted by a seed.",
      "The seed stays on my machine, so the shifts cannot be undone.",
    ]);
  });

  it("says the mask in one sentence in the hero", () => {
    expect(MASK_NOTE).toBe(
      "Health numbers here are masked with a private seed; apps, counts and dates are real.",
    );
  });
});
