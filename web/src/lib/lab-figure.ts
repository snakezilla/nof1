/**
 * The lab chapter's diagram: two lanes. Lane 1 is the byahsan.com box sketch
 * (byahsan-live/public/project-media/delphi-sketch.svg), tightened: a requisition goes in, then
 * Intake, Calculator, Reports, and a loop back that says the lab runs itself. Lane 2 is the slide
 * AI: a breast cancer slide is scored, then forks to the report or to a pathologist.
 */
import { arrow, type Diagram, type Scene, type SceneBox } from "./scene";

export const LAB_LABEL =
  "Diagram of the lab's tools and the slide-scoring AI, in two lanes";

export const LAB_SUMMARY =
  "Lane one, the lab tools I wrote: a requisition goes to intake, which logs the samples, then the calculator, which runs the numbers, then reports, which sends results out, and a loop back to intake shows that it runs itself. Lane two, the slide-scoring AI I am building: a breast cancer slide after chemo goes to the AI, which scores it. If the AI is confident, the score goes to the report. If it is unsure, the slide goes to a pathologist.";

const LANE_1 = "Lab tools I wrote";
const LANE_2 = "Slide-scoring AI I'm building";
const LOOP = "runs itself";

const TOOLS = [
  { name: "Intake", note: "logs the samples" },
  { name: "Calculator", note: "runs the numbers" },
  { name: "Reports", note: "sends results out" },
] as const;

const mine = (
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  note?: string,
): SceneBox => ({ x, y, w, h, name, note, tone: "mine" });

const other = (
  x: number,
  y: number,
  w: number,
  h: number,
  name: string,
  note: string,
): SceneBox => ({ x, y, w, h, name, note, tone: "other" });

/* Row, 704 wide: inputs in the first 100, boxes 150 wide with 44 between. */
const R_BOX = 150;
const R_STEP = 200;
const R_X0 = 140;
const R_H = 60;
const R_M1 = 58;
const R_M2 = 268;

const rowLaneOne = (): Scene => {
  const boxes = TOOLS.map((t, i) =>
    mine(R_X0 + i * R_STEP, R_M1 - R_H / 2, R_BOX, R_H, t.name, t.note),
  );
  const first = R_X0 + R_BOX / 2;
  const last = R_X0 + 2 * R_STEP + R_BOX / 2;
  const under = R_M1 + R_H / 2 + 10;
  return {
    width: 0,
    height: 0,
    boxes,
    dots: [],
    lines: [
      arrow(84, R_M1, R_X0 - 8, R_M1),
      ...[0, 1].map((i) =>
        arrow(
          R_X0 + i * R_STEP + R_BOX + 8,
          R_M1,
          R_X0 + (i + 1) * R_STEP - 8,
          R_M1,
          "mine",
        ),
      ),
      {
        d: `M ${last} ${under} C ${last - 40} ${under + 48}, ${first + 40} ${under + 48}, ${first} ${under}`,
        kind: "loop",
        tone: "mine",
        head: [first, under, -115],
      },
    ],
    texts: [
      { x: 0, y: 12, text: LANE_1, kind: "label" },
      { x: 0, y: R_M1 + 4, text: "requisition", kind: "note" },
      {
        x: (first + last) / 2,
        y: under + 52,
        text: LOOP,
        kind: "note",
        anchor: "middle",
      },
    ],
  };
};

const rowLaneTwo = (): Scene => {
  const fork = R_X0 + R_BOX + 8;
  const ends = R_X0 + R_STEP + 40;
  return {
    width: 0,
    height: 0,
    boxes: [
      mine(R_X0, R_M2 - R_H / 2, R_BOX, R_H, "AI scores it", "after chemo"),
      other(ends, R_M2 - 66, R_BOX, 56, "Report", "if confident"),
      other(ends, R_M2 + 10, R_BOX, 56, "Pathologist", "if unsure"),
    ],
    dots: [],
    lines: [
      arrow(98, R_M2, R_X0 - 8, R_M2),
      arrow(fork, R_M2 - 4, ends - 8, R_M2 - 36, "mine"),
      arrow(fork, R_M2 + 4, ends - 8, R_M2 + 36, "mine"),
    ],
    texts: [
      { x: 0, y: R_M2 - 92, text: LANE_2, kind: "label" },
      { x: 0, y: R_M2 - 4, text: "breast cancer", kind: "note" },
      { x: 0, y: R_M2 + 12, text: "slide", kind: "note" },
    ],
  };
};

const merge = (
  width: number,
  height: number,
  parts: readonly Scene[],
): Scene => ({
  width,
  height,
  boxes: parts.flatMap((p) => p.boxes),
  lines: parts.flatMap((p) => p.lines),
  texts: parts.flatMap((p) => p.texts),
  dots: parts.flatMap((p) => p.dots),
});

/* Column, 272 wide: boxes 148 wide on the left, the loop on their right. */
const C_W = 148;
const C_H = 52;
const C_PITCH = 86;
const C_Y0 = 60;
const C_MID = 4 + C_W / 2;

const columnLaneOne = (): Scene => {
  const boxes = TOOLS.map((t, i) =>
    mine(4, C_Y0 + i * C_PITCH, C_W, C_H, t.name, t.note),
  );
  const right = 4 + C_W + 8;
  const top = C_Y0 + C_H / 2;
  const bottom = C_Y0 + 2 * C_PITCH + C_H / 2;
  return {
    width: 0,
    height: 0,
    boxes,
    dots: [],
    lines: [
      arrow(C_MID, 36, C_MID, C_Y0 - 8),
      ...[0, 1].map((i) =>
        arrow(
          C_MID,
          C_Y0 + i * C_PITCH + C_H + 8,
          C_MID,
          C_Y0 + (i + 1) * C_PITCH - 8,
          "mine",
        ),
      ),
      {
        d: `M ${right} ${bottom} C ${right + 40} ${bottom - 30}, ${right + 40} ${top + 30}, ${right} ${top}`,
        kind: "loop",
        tone: "mine",
        head: [right, top, 200],
      },
    ],
    texts: [
      { x: 0, y: 12, text: LANE_1, kind: "label" },
      { x: C_MID, y: 30, text: "requisition", kind: "note", anchor: "middle" },
      { x: right + 36, y: (top + bottom) / 2 + 4, text: LOOP, kind: "note" },
    ],
  };
};

const C_L2 = 314;

const columnLaneTwo = (): Scene => {
  const ai = C_L2 + 46;
  const forkY = ai + C_H + 8;
  const ends = forkY + 34;
  return {
    width: 0,
    height: 0,
    boxes: [
      mine(4, ai, C_W, C_H, "AI scores it", "after chemo"),
      other(4, ends, 128, C_H, "Report", "if confident"),
      other(144, ends, 128, C_H, "Pathologist", "if unsure"),
    ],
    dots: [],
    lines: [
      arrow(C_MID, C_L2 + 24, C_MID, ai - 8),
      arrow(C_MID - 8, forkY, 68, ends - 8, "mine"),
      arrow(C_MID + 8, forkY, 208, ends - 8, "mine"),
    ],
    texts: [
      { x: 0, y: C_L2, text: LANE_2, kind: "label" },
      {
        x: C_MID,
        y: C_L2 + 18,
        text: "breast cancer slide",
        kind: "note",
        anchor: "middle",
      },
    ],
  };
};

export const LAB_DIAGRAM: Diagram = {
  column: merge(272, C_L2 + 46 + C_H + 8 + 34 + C_H + 6, [
    columnLaneOne(),
    columnLaneTwo(),
  ]),
  row: merge(704, R_M2 + 66 + 6, [rowLaneOne(), rowLaneTwo()]),
};
