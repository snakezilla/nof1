import type { NodeKind, PipeEdge, PipeNode, Pipeline } from "./provenance";
import { squirclePath } from "./squircle";

/** Mono 11 px: advance per character, line height, and the padding inside a node. */
const CH = 6.8;
const LH = 15;
const PAD_X = 12;
const PAD_Y = 10;
const MIN_W = 72;
const CORNER = 12;
const ARROW = 6;

type Pt = readonly [number, number];

export interface Box {
  readonly id: string;
  readonly kind: NodeKind;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly lines: readonly string[];
  readonly path: string;
}

export interface EdgeLabel {
  readonly lines: readonly string[];
  readonly x: number;
  /** Top of the first line. */
  readonly y: number;
  readonly anchor: "start" | "middle" | "end";
  /** Paint the page colour behind the words, so the line breaks around them. */
  readonly knockout: boolean;
  readonly w: number;
}

export interface Wire {
  readonly key: string;
  readonly points: readonly Pt[];
  readonly arrow: string;
  readonly dashed: boolean;
  readonly label: EdgeLabel | null;
}

export interface Layout {
  readonly width: number;
  readonly height: number;
  readonly boxes: readonly Box[];
  readonly wires: readonly Wire[];
}

/** Greedy word wrap; a word longer than the limit gets a line to itself. */
export const wrap = (text: string, max: number): readonly string[] =>
  text.split(" ").reduce<readonly string[]>((lines, word) => {
    const last = lines[lines.length - 1];
    return last !== undefined && `${last} ${word}`.length <= max
      ? [...lines.slice(0, -1), `${last} ${word}`]
      : [...lines, word];
  }, []);

const textW = (lines: readonly string[]): number =>
  Math.ceil(Math.max(0, ...lines.map((l) => l.length)) * CH);

const size = (lines: readonly string[]) => ({
  w: Math.max(MIN_W, textW(lines) + 2 * PAD_X),
  h: lines.length * LH + 2 * PAD_Y,
});

const box = (
  node: PipeNode,
  lines: readonly string[],
  x: number,
  y: number,
  w: number,
  h: number,
): Box => ({
  id: node.id,
  kind: node.kind,
  x,
  y,
  w,
  h,
  lines,
  path: squirclePath(x, y, w, h, CORNER),
});

/** A small filled triangle whose tip sits on the last point of the wire. */
export const arrowHead = (points: readonly Pt[]): string => {
  const [x1, y1] = points[points.length - 2];
  const [x2, y2] = points[points.length - 1];
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const [ux, uy] = [(x2 - x1) / len, (y2 - y1) / len];
  const [bx, by] = [x2 - ux * ARROW, y2 - uy * ARROW];
  const half = ARROW / 2;
  return `M${x2} ${y2}L${bx - uy * half} ${by + ux * half}L${bx + uy * half} ${by - ux * half}Z`;
};

const wire = (
  edge: PipeEdge,
  points: readonly Pt[],
  label: EdgeLabel | null = null,
): Wire => ({
  key: `${edge.from}-${edge.to}`,
  points,
  arrow: arrowHead(points),
  dashed: Boolean(edge.dashed),
  label,
});

const center = (b: Box): Pt => [b.x + b.w / 2, b.y + b.h / 2];
const bottom = (b: Box): number => b.y + b.h;
const right = (b: Box): number => b.x + b.w;

interface Parts {
  readonly device: PipeNode | undefined;
  readonly apps: readonly PipeNode[];
  readonly hub: PipeNode;
  readonly chain: readonly PipeNode[];
  readonly excluded: PipeNode | undefined;
  readonly edge: (from: string, to: string) => PipeEdge;
}

const parts = (pl: Pipeline): Parts => {
  const of = (kind: NodeKind) => pl.nodes.filter((n) => n.kind === kind);
  return {
    device: of("device")[0],
    apps: of("app"),
    hub: of("hub")[0],
    chain: [...of("mine"), ...of("step")],
    excluded: of("excluded")[0],
    edge: (from, to) =>
      pl.edges.find((e) => e.from === from && e.to === to) ?? { from, to },
  };
};

const finish = (boxes: readonly Box[], wires: readonly Wire[]): Layout => ({
  width: Math.ceil(Math.max(...boxes.map(right))) + 1,
  height: Math.ceil(Math.max(...boxes.map(bottom))) + 1,
  boxes,
  wires,
});

export { CH, LH, PAD_X, center, finish, parts, box, size, wire, bottom, right };
export type { Parts, Pt };
