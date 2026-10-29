/**
 * The drawing kit for the three chapter diagrams. A scene is plain data in viewBox units at 1:1:
 * marker boxes, wires, dots and text. One renderer (components/story/SceneSvg.tsx) draws every
 * scene, so the three diagrams share one hand. Each diagram has a column scene (at most 272 wide,
 * for phones) and a row scene (at most 720 wide); CSS shows the one that fits.
 */

/** "mine": drawn in the accent, a thing I built. "other": drawn in --muted. */
export type Tone = "mine" | "other";

export interface SceneBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly name: string;
  readonly note?: string;
  readonly tone: Tone;
}

/**
 * name: Fraunces, --text. label: mono, --text (counts, lane titles). note: mono, --muted.
 * flag: mono, --text, with an accent mark before it.
 */
export type TextKind = "name" | "label" | "note" | "flag";

export interface SceneText {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly kind: TextKind;
  readonly anchor?: "start" | "middle" | "end";
}

/** arrow and curve end in an open arrowhead when `head` is set. wire: thin, no head. dashed: a mark, not a path. axis: the --rule baseline. */
export type LineKind = "arrow" | "wire" | "loop" | "curve" | "dashed" | "axis";

export interface SceneLine {
  readonly d: string;
  readonly kind: LineKind;
  readonly tone: Tone;
  /** The arrowhead tip and the direction it points, in degrees (0 is right, 90 is down). */
  readonly head?: readonly [number, number, number];
}

export interface SceneDot {
  readonly x: number;
  readonly y: number;
  readonly tone: Tone;
}

export interface Scene {
  readonly width: number;
  readonly height: number;
  readonly boxes: readonly SceneBox[];
  readonly lines: readonly SceneLine[];
  readonly texts: readonly SceneText[];
  readonly dots: readonly SceneDot[];
}

/** The two drawings of one diagram. */
export interface Diagram {
  readonly column: Scene;
  readonly row: Scene;
}

export const COLUMN_MAX = 272;
export const ROW_MAX = 720;

/**
 * A marker box: four strokes that overshoot a little, so the corners do not meet cleanly, as in
 * the byahsan.com sketch. The offsets are fixed, so the server and the browser draw the same thing.
 */
export const markerBox = ({
  x,
  y,
  w,
  h,
}: Pick<SceneBox, "x" | "y" | "w" | "h">): string =>
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
  size = 7,
): string => {
  const a = (angle * Math.PI) / 180;
  const wing = (turn: number) => {
    const t = a + Math.PI + turn;
    return `${(x + size * Math.cos(t)).toFixed(1)} ${(y + size * Math.sin(t)).toFixed(1)}`;
  };
  return `M ${wing(-0.5)} L ${x} ${y} L ${wing(0.5)}`;
};

/** A straight arrow from (x1, y1) to (x2, y2), with its head at the end. */
export const arrow = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tone: Tone = "other",
): SceneLine => ({
  d: `M ${x1} ${y1} L ${x2} ${y2}`,
  kind: "arrow",
  tone,
  head: [x2, y2, Math.round((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI)],
});

/** The name and note of a box, centred in it. */
export const boxTexts = (b: SceneBox): readonly SceneText[] => {
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  return b.note
    ? [
        { x: cx, y: cy - 2, text: b.name, kind: "name", anchor: "middle" },
        { x: cx, y: cy + 15, text: b.note, kind: "note", anchor: "middle" },
      ]
    : [{ x: cx, y: cy + 6, text: b.name, kind: "name", anchor: "middle" }];
};

/** Every word a scene draws, in order, for tests and the hidden summary checks. */
export const sceneWords = (s: Scene): readonly string[] => [
  ...s.boxes.flatMap((b) => (b.note ? [b.name, b.note] : [b.name])),
  ...s.texts.map((t) => t.text),
];
