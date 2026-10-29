/**
 * The bedside chapter's diagram: the wake sequence as a timeline. The strap senses light sleep,
 * the lamp starts, its brightness climbs for 30 minutes from dim to full daylight white, and I am
 * awake. Two marks: the lamp syncs to my phone, and the fold-out version reaches 10,000 lux on
 * paper (computed in trifold-10k/calc/optics.py, not measured), drawn as a dashed ceiling.
 */
import type { Diagram, Scene, SceneLine } from "./scene";

export const RAMP_MINUTES = 30;
export const SYNC = "syncs to my phone automatically";
export const FOLDOUT = "fold-out version: 10,000 lux on paper";

export const WAKE_LABEL =
  "Timeline of a wake-up: the strap senses light sleep, the lamp starts, and its light climbs for 30 minutes until I am awake";

export const WAKE_SUMMARY =
  "My strap senses when I am in light sleep, and the lamp starts. Over 30 minutes its light climbs from dim to full daylight white, slowly at first and then faster, until I am awake. The lamp syncs to my phone automatically. A dashed line above the curve marks the fold-out version, which reaches 10,000 lux on paper.";

/** A sunrise ramp: slow at first, then faster, from (x0, y0) to (x1, y1). */
export const rampPath = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): string => {
  const w = x1 - x0;
  return `M ${x0} ${y0} C ${x0 + w * 0.5} ${y0}, ${x0 + w * 0.8} ${y0 + (y1 - y0) * 0.45}, ${x1} ${y1}`;
};

const line = (
  d: string,
  kind: SceneLine["kind"],
  tone: SceneLine["tone"] = "other",
): SceneLine => ({
  d,
  kind,
  tone,
});

/* Row, 720 wide: three dots on the baseline, the curve between the second and the third. */
const row = (): Scene => {
  const base = 176;
  const [light, start, awake] = [6, 150, 600];
  const top = 54;
  return {
    width: 720,
    height: 222,
    boxes: [],
    dots: [
      { x: light, y: base, tone: "other" },
      { x: start, y: base, tone: "mine" },
      { x: awake, y: base, tone: "mine" },
    ],
    lines: [
      line(`M 0 ${base} L 720 ${base}`, "axis"),
      line(`M ${start} 24 L 720 24`, "dashed"),
      line(rampPath(start, base - 6, awake, top), "curve", "mine"),
      line(`M ${awake} ${top} L 720 ${top}`, "curve", "mine"),
      line(`M ${awake} ${top + 8} L ${awake} ${base - 8}`, "dashed"),
      // Ties the sync note to the lamp.
      line(`M ${start} ${base - 58} L ${start} ${base - 30}`, "dashed"),
    ],
    texts: [
      { x: 720, y: 14, text: FOLDOUT, kind: "label", anchor: "end" },
      { x: awake + 12, y: top - 10, text: "daylight white", kind: "note" },
      { x: start + 12, y: base - 18, text: "dim", kind: "note" },
      { x: start - 4, y: base - 64, text: SYNC, kind: "note" },
      {
        x: (start + awake) / 2 + 20,
        y: base + 22,
        text: `${RAMP_MINUTES}-minute ramp`,
        kind: "label",
        anchor: "middle",
      },
      { x: 0, y: base + 22, text: "strap senses", kind: "note" },
      { x: 0, y: base + 36, text: "light sleep", kind: "note" },
      {
        x: start,
        y: base + 22,
        text: "lamp starts",
        kind: "label",
        anchor: "middle",
      },
      {
        x: awake,
        y: base + 22,
        text: "awake",
        kind: "label",
        anchor: "middle",
      },
    ],
  };
};

/* Column, 272 wide: the steps down a rail on the left, the curve as its own small chart. */
const column = (): Scene => {
  const rail = 6;
  const chartTop = 108;
  const base = 252;
  const [x0, x1] = [24, 214];
  const top = chartTop + 34;
  return {
    width: 272,
    height: 316,
    boxes: [],
    dots: [
      { x: rail, y: 10, tone: "other" },
      { x: rail, y: 52, tone: "mine" },
      { x: rail, y: 296, tone: "mine" },
    ],
    lines: [
      line(`M ${rail} 18 L ${rail} 44`, "wire"),
      line(`M ${rail} 60 L ${rail} 288`, "wire"),
      line(`M ${x0} ${chartTop + 12} L 272 ${chartTop + 12}`, "dashed"),
      line(`M ${x0} ${base} L 272 ${base}`, "axis"),
      line(rampPath(x0, base - 4, x1, top), "curve", "mine"),
      line(`M ${x1} ${top} L 272 ${top}`, "curve", "mine"),
    ],
    texts: [
      { x: 20, y: 14, text: "strap senses light sleep", kind: "note" },
      { x: 20, y: 56, text: "lamp starts", kind: "label" },
      { x: 20, y: 72, text: SYNC, kind: "note" },
      { x: 272, y: chartTop + 2, text: FOLDOUT, kind: "label", anchor: "end" },
      {
        x: 272,
        y: top - 7,
        text: "daylight white",
        kind: "note",
        anchor: "end",
      },
      { x: x0 + 8, y: base - 12, text: "dim", kind: "note" },
      { x: x0, y: base + 16, text: "0", kind: "note" },
      {
        x: x1,
        y: base + 16,
        text: `${RAMP_MINUTES} min`,
        kind: "note",
        anchor: "middle",
      },
      { x: 20, y: 300, text: "awake", kind: "label" },
    ],
  };
};

export const WAKE_DIAGRAM: Diagram = { column: column(), row: row() };
