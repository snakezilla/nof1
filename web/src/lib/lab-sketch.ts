/**
 * The lab chapter's picture: the Delphi box sketch from byahsan.com
 * (byahsan-live/public/project-media/delphi-sketch.svg), redrawn in the page's tokens. Two
 * drawings at 1:1, a row and a column, so the 11 px labels stay 11 px; CSS shows the one that fits.
 */
export interface SketchBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly name: string;
  readonly note: string;
}

export interface Sketch {
  readonly width: number;
  readonly height: number;
  readonly boxes: readonly SketchBox[];
  /** Straight arrows from one box to the next. */
  readonly arrows: readonly (readonly [number, number, number, number])[];
  /** The loop from the last box back to the first, as an SVG path, and its arrowhead tip. */
  readonly loop: {
    readonly d: string;
    readonly tip: readonly [number, number];
    readonly angle: number;
  };
  readonly loopLabel: {
    readonly x: number;
    readonly y: number;
    readonly anchor: "start" | "middle";
  };
}

const STEPS = [
  { name: "Intake", note: "logs the samples" },
  { name: "Calculator", note: "runs the numbers" },
  { name: "Reports", note: "sends results out" },
] as const;

export const LOOP_LABEL = "runs itself";

export const SKETCH_LABEL =
  "A hand-drawn sketch of the lab's tools: intake, then the calculator, then reports, with a loop from reports back to intake.";

const ROW_W = 176;
const ROW_H = 92;
const ROW_GAP = 36;

export const ROW: Sketch = {
  width: 3 * ROW_W + 2 * ROW_GAP + 8,
  height: 200,
  boxes: STEPS.map((s, i) => ({
    ...s,
    x: 4 + i * (ROW_W + ROW_GAP),
    y: 8,
    w: ROW_W,
    h: ROW_H,
  })),
  arrows: [0, 1].map((i) => {
    const x = 4 + (i + 1) * ROW_W + i * ROW_GAP;
    return [x + 6, 54, x + ROW_GAP - 6, 54] as const;
  }),
  loop: {
    d: `M ${4 + 2.5 * ROW_W + 2 * ROW_GAP} ${ROW_H + 18} C ${4 + 2.5 * ROW_W + 2 * ROW_GAP - 30} 196, ${4 + 0.5 * ROW_W + 30} 196, ${4 + 0.5 * ROW_W} ${ROW_H + 18}`,
    tip: [4 + 0.5 * ROW_W, ROW_H + 18],
    angle: -110,
  },
  loopLabel: {
    x: (3 * ROW_W + 2 * ROW_GAP + 8) / 2,
    y: 192,
    anchor: "middle",
  },
};

const COL_W = 168;
const COL_H = 76;
const COL_GAP = 36;

export const COLUMN: Sketch = {
  width: 300,
  height: 3 * COL_H + 2 * COL_GAP + 16,
  boxes: STEPS.map((s, i) => ({
    ...s,
    x: 4,
    y: 8 + i * (COL_H + COL_GAP),
    w: COL_W,
    h: COL_H,
  })),
  arrows: [0, 1].map((i) => {
    const y = 8 + (i + 1) * COL_H + i * COL_GAP;
    return [4 + COL_W / 2, y + 6, 4 + COL_W / 2, y + COL_GAP - 6] as const;
  }),
  loop: {
    d: `M ${COL_W + 14} ${8 + 2.5 * COL_H + 2 * COL_GAP} C 300 ${8 + 2.5 * COL_H + 2 * COL_GAP - 20}, 300 ${8 + 0.5 * COL_H + 20}, ${COL_W + 14} ${8 + 0.5 * COL_H}`,
    tip: [COL_W + 14, 8 + 0.5 * COL_H],
    angle: 190,
  },
  loopLabel: {
    x: COL_W + 22,
    y: 8 + 1.5 * COL_H + COL_GAP + 4,
    anchor: "start",
  },
};

/**
 * A marker box: four strokes that overshoot a little, so the corners do not meet cleanly, as in
 * the original sketch. The offsets are fixed, so the server and the browser draw the same thing.
 */
export const markerBox = ({
  x,
  y,
  w,
  h,
}: Pick<SketchBox, "x" | "y" | "w" | "h">): string =>
  [
    `M ${x - 2} ${y + 3} L ${x + w + 3} ${y - 1}`,
    `M ${x + w - 1} ${y - 3} L ${x + w + 1} ${y + h + 2}`,
    `M ${x + w + 3} ${y + h - 1} L ${x - 1} ${y + h + 2}`,
    `M ${x + 2} ${y + h + 4} L ${x} ${y - 2}`,
  ].join(" ");

/** An open arrowhead at (x, y), pointing along `angle` degrees. */
export const arrowHead = (
  x: number,
  y: number,
  angle: number,
  size = 8,
): string => {
  const a = (angle * Math.PI) / 180;
  const wing = (turn: number) => {
    const t = a + Math.PI + turn;
    return `${(x + size * Math.cos(t)).toFixed(1)} ${(y + size * Math.sin(t)).toFixed(1)}`;
  };
  return `M ${wing(-0.5)} L ${x} ${y} L ${wing(0.5)}`;
};
