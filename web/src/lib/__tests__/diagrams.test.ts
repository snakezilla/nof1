import { describe, expect, it } from "vitest";
import { funnel, funnelDiagram, funnelNames, funnelSummary } from "../funnel";
import { LAB_DIAGRAM, LAB_SUMMARY } from "../lab-figure";
import {
  COLUMN_MAX,
  ROW_MAX,
  sceneWords,
  type Diagram,
  type Scene,
  type SceneText,
} from "../scene";
import { FOLDOUT, SYNC, WAKE_DIAGRAM, rampPath } from "../wake-timeline";
import { publicData } from "../../test/fixtures";

const shipped = () => funnel(publicData().meta.provenance)!;

/** Mono 11 px is 0.6 em a character; Fraunces 17 px is about 0.5 em. A little slack for the fallback fonts. */
const textWidth = (t: SceneText): number =>
  t.text.length * (t.kind === "name" ? 8.5 : 6.7);

const span = (t: SceneText): readonly [number, number] => {
  const w = textWidth(t);
  if (t.anchor === "middle") return [t.x - w / 2, t.x + w / 2];
  if (t.anchor === "end") return [t.x - w, t.x];
  return [t.x, t.x + w];
};

const boxWords = (s: Scene): readonly SceneText[] =>
  s.boxes.flatMap((b) => [
    {
      x: b.x + b.w / 2,
      y: b.y,
      text: b.name,
      kind: "name",
      anchor: "middle",
    } as const,
    ...(b.note
      ? [
          {
            x: b.x + b.w / 2,
            y: b.y,
            text: b.note,
            kind: "note",
            anchor: "middle",
          } as const,
        ]
      : []),
  ]);

const fits = (s: Scene) => {
  s.texts.forEach((t) => {
    const [a, b] = span(t);
    expect(a, t.text).toBeGreaterThanOrEqual(-1);
    expect(b, t.text).toBeLessThanOrEqual(s.width + 1);
    expect(t.y, t.text).toBeLessThanOrEqual(s.height);
  });
  s.boxes.forEach((b) => {
    expect(b.x + b.w, b.name).toBeLessThanOrEqual(s.width);
    expect(b.y + b.h, b.name).toBeLessThanOrEqual(s.height);
  });
  // Each box's name and note fit inside the box.
  s.boxes.forEach((b) =>
    boxWords({ ...s, boxes: [b] }).forEach((t) =>
      expect(textWidth(t), t.text).toBeLessThanOrEqual(b.w - 8),
    ),
  );
};

const sizes = (d: Diagram) => {
  expect(d.column.width).toBeLessThanOrEqual(COLUMN_MAX);
  expect(d.row.width).toBeLessThanOrEqual(ROW_MAX);
  fits(d.column);
  fits(d.row);
};

describe("the lab diagram", () => {
  it("draws two lanes in both drawings: the tools with their loop, and the slide AI with its fork", () => {
    [LAB_DIAGRAM.column, LAB_DIAGRAM.row].forEach((s) => {
      const words = sceneWords(s);
      [
        "Lab tools I wrote",
        "requisition",
        "Intake",
        "Calculator",
        "Reports",
        "runs itself",
      ].forEach((w) => expect(words).toContain(w));
      [
        "Slide-scoring AI I built",
        "AI scores it",
        "Report",
        "if confident",
        "Pathologist",
        "if unsure",
      ].forEach((w) => expect(words).toContain(w));
      expect(words.join(" ")).toMatch(/breast cancer/);
      expect(s.lines.filter((l) => l.kind === "loop")).toHaveLength(1);
    });
    expect(LAB_SUMMARY).toMatch(/If the AI is confident.*If it is unsure/);
  });

  it("fits a 320 px phone and a 768 px laptop at 1:1", () =>
    sizes(LAB_DIAGRAM));
});

describe("the fusion funnel", () => {
  it("names the twelve apps from the headline's filter, WHOOP flagged, with the counts from meta.json", () => {
    const f = shipped();
    expect(f.names).toHaveLength(12);
    expect(f.names[0]).toBe("WHOOP");
    expect(f.flagged).toBe("WHOOP");
    expect(f.names).toContain("VeSync");
    expect(f.names).toContain("VeSync, newer app");
    expect(f.names).not.toContain("ECG app on Apple Watch");
    expect(f.counts).toEqual({
      records: "267,399",
      repeats: "363,564",
      days: "365 days",
    });
  });

  it("draws the chain and puts the counts on the arrows, in both drawings", () => {
    const d = funnelDiagram(shipped());
    [d.column, d.row].forEach((s) => {
      expect(s.boxes.map((b) => b.name)).toEqual([
        "Apple Health",
        "Export app",
        "One row per day",
      ]);
      expect(s.boxes.map((b) => b.tone)).toEqual(["other", "mine", "other"]);
      const words = sceneWords(s).join(" ");
      ["267,399", "363,564", "365 days", "repeats", "records"].forEach((w) =>
        expect(words).toContain(w),
      );
      expect(words).toMatch(/hacked: raw signal/);
      shipped().names.forEach((n) => expect(sceneWords(s)).toContain(n));
    });
  });

  it("fits a 320 px phone and a 768 px laptop at 1:1", () =>
    sizes(funnelDiagram(shipped())));

  it("says every app and count in the hidden summary", () => {
    const text = funnelSummary(shipped());
    shipped().names.forEach((n) => expect(text).toContain(n));
    expect(text).toContain("hacked the WHOOP strap");
    expect(text).toContain("removes 363,564 repeats");
  });

  it("keeps two apps of one name apart, and drops the diagram without the counts", () => {
    expect(funnelNames(["A (x)", "B", "A (x, newer app)"])).toEqual([
      "A",
      "B",
      "A, newer app",
    ]);
    const p = publicData().meta.provenance!;
    expect(funnel({ ...p, fusion: undefined })).toBeNull();
    expect(funnel(undefined)).toBeNull();
  });
});

describe("the wake timeline", () => {
  it("runs light sleep, lamp starts, a 30-minute ramp, awake, with the two marks", () => {
    [WAKE_DIAGRAM.column, WAKE_DIAGRAM.row].forEach((s) => {
      const words = sceneWords(s).join(" ");
      expect(words).toMatch(/light sleep.*lamp starts/);
      ["dim", "daylight white", "awake", SYNC, FOLDOUT].forEach((w) =>
        expect(words).toContain(w),
      );
      expect(words).toMatch(/30/);
      expect(
        s.lines.filter((l) => l.kind === "curve" && l.tone === "mine").length,
      ).toBeGreaterThan(0);
      expect(s.lines.some((l) => l.kind === "dashed")).toBe(true);
      expect(s.dots).toHaveLength(3);
    });
  });

  it("draws the ramp slow at first, then faster", () => {
    expect(rampPath(0, 100, 100, 0)).toBe("M 0 100 C 50 100, 80 55, 100 0");
  });

  it("fits a 320 px phone and a 768 px laptop at 1:1", () =>
    sizes(WAKE_DIAGRAM));
});
