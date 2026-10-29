import { describe, expect, it } from "vitest";
import {
  MASK_NOTE,
  isMaskInfo,
  maskParagraphs,
  parseMaskOrNull,
} from "../mask";
import {
  appsThatMeasured,
  countWord,
  headline,
  headlineText,
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
