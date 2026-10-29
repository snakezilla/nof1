/**
 * The On me chapter's diagram: the fusion funnel. The apps that measured me (the headline's own
 * filter, so the count matches the h2) on the left, wires that meet in Apple Health, then the
 * export app I wrote, then one row per day, with the counts on the arrows.
 */
import { fmt } from "./provenance";
import { measuredSources } from "./sources-text";
import {
  arrow,
  type Diagram,
  type Scene,
  type SceneBox,
  type SceneLine,
  type SceneText,
} from "./scene";
import type { Provenance } from "./types";

export const FLAG = "hacked: raw signal over Bluetooth";

export interface FunnelCounts {
  readonly records: string;
  readonly repeats: string;
  readonly days: string;
}

export interface Funnel {
  readonly names: readonly string[];
  /** The app I read the raw signal from, flagged in the drawing. Null when it is not in the list. */
  readonly flagged: string | null;
  readonly counts: FunnelCounts;
}

/**
 * "VeSync (smart scale)" -> "VeSync". When two apps would read the same, the later one keeps the
 * last part of its brackets: "VeSync (smart scale, newer app)" -> "VeSync, newer app".
 */
export const funnelNames = (names: readonly string[]): readonly string[] => {
  const short = names.map((n) => n.replace(/\s*\(.*\)$/, ""));
  return short.map((s, i) => {
    if (short.indexOf(s) === i) return s;
    const inside = /\(([^)]*)\)$/.exec(names[i])?.[1] ?? "";
    const tail = inside.split(",").at(-1)?.trim();
    return tail ? `${s}, ${tail}` : names[i];
  });
};

/** Null without all_sources or fusion: the chapter then drops the diagram. */
export const funnel = (p?: Provenance): Funnel | null => {
  const sources = p ? measuredSources(p) : [];
  const fusion = p?.fusion;
  if (sources.length === 0 || !fusion) return null;
  const names = funnelNames(sources.map((s) => s.name));
  return {
    names,
    flagged: names.find((n) => /^WHOOP\b/.test(n)) ?? null,
    counts: {
      records: fmt(fusion.records),
      repeats: fmt(fusion.repeats),
      days: `${fmt(fusion.days)} days`,
    },
  };
};

export const FUNNEL_LABEL =
  "Diagram of my health apps feeding Apple Health, then my export app, then one row per day";

export const funnelSummary = (f: Funnel): string =>
  [
    `${f.names.length} apps wrote into Apple Health: ${f.names.join(", ")}.`,
    f.flagged
      ? `I also hacked the ${f.flagged} strap to read its raw signal over Bluetooth.`
      : "",
    `An export app I wrote takes ${f.counts.records} records out of Apple Health, removes ${f.counts.repeats} repeats, and joins the rest into one row per day, ${f.counts.days}.`,
  ]
    .filter(Boolean)
    .join(" ");

const box = (
  x: number,
  y: number,
  w: number,
  name: string,
  note: string,
  tone: SceneBox["tone"],
): SceneBox => ({ x, y, w, h: 56, name, note, tone });

const chain = (
  f: Funnel,
): readonly [
  readonly [string, string],
  readonly [string, string],
  readonly [string, string],
] => [
  ["Apple Health", "on my iPhone"],
  ["Export app", "that I wrote"],
  ["One row per day", f.counts.days],
];

/* Row: names in the first 124, wires to 186, then three boxes with 72 between. */
const PITCH = 20;

/** The flagged app takes two more lines for its flag, so every name after it moves down. */
const nameTexts = (f: Funnel, x: number): readonly SceneText[] => {
  const at = f.flagged ? f.names.indexOf(f.flagged) : -1;
  return f.names.flatMap((name, i): SceneText[] => {
    const y = 14 + i * PITCH + (at >= 0 && i > at ? 28 : 0);
    return name === f.flagged
      ? [
          { x, y, text: name, kind: "label" },
          { x, y: y + 15, text: "hacked: raw signal", kind: "flag" },
          { x, y: y + 29, text: "over Bluetooth", kind: "flag" },
        ]
      : [{ x, y, text: name, kind: "note" }];
  });
};

const rowScene = (f: Funnel): Scene => {
  const names = nameTexts(f, 0).filter((t) => t.kind !== "flag");
  const flags = nameTexts(f, 0).filter((t) => t.kind === "flag");
  const bottom = Math.max(...nameTexts(f, 0).map((t) => t.y));
  const mid = Math.round((bottom + 4) / 2);
  const [health, mine, rows] = chain(f);
  const boxes = [
    box(186, mid - 28, 120, health[0], health[1], "other"),
    box(378, mid - 28, 120, mine[0], mine[1], "mine"),
    box(570, mid - 28, 150, rows[0], rows[1], "other"),
  ];
  const wires: SceneLine[] = names.map((t) => ({
    d: `M 128 ${t.y - 4} L 178 ${mid}`,
    kind: "wire",
    tone: "other",
  }));
  const counts: SceneText[] = [
    {
      x: 342,
      y: mid - 8,
      text: f.counts.records,
      kind: "label",
      anchor: "middle",
    },
    { x: 342, y: mid + 18, text: "records", kind: "note", anchor: "middle" },
    {
      x: 534,
      y: mid - 8,
      text: f.counts.repeats,
      kind: "label",
      anchor: "middle",
    },
    { x: 534, y: mid + 18, text: "repeats", kind: "note", anchor: "middle" },
    { x: 534, y: mid + 31, text: "removed", kind: "note", anchor: "middle" },
  ];
  return {
    width: 720,
    height: bottom + 8,
    boxes,
    dots: [],
    lines: [
      ...wires,
      arrow(178, mid, 182, mid),
      arrow(312, mid, 372, mid, "mine"),
      arrow(504, mid, 564, mid, "mine"),
    ],
    texts: [...names, ...flags, ...counts],
  };
};

/* Column, 272 wide: the flagged app across the top, the rest in two columns, a bracket, then the chain down the middle. */
const columnScene = (f: Funnel): Scene => {
  const rest = f.names.filter((n) => n !== f.flagged);
  const head: SceneText[] = f.flagged
    ? [
        { x: 0, y: 14, text: f.flagged, kind: "label" },
        { x: 0, y: 30, text: FLAG, kind: "flag" },
      ]
    : [];
  const top = f.flagged ? 56 : 14;
  const half = Math.ceil(rest.length / 2);
  const grid: SceneText[] = rest.map((name, i) => ({
    x: i < half ? 0 : 140,
    y: top + (i % half) * PITCH,
    text: name,
    kind: "note",
  }));
  const bracket = top + (half - 1) * PITCH + 14;
  const [health, mine, rows] = chain(f);
  const y1 = bracket + 30;
  const y2 = y1 + 56 + 44;
  const y3 = y2 + 56 + 44;
  return {
    width: 272,
    height: y3 + 56 + 6,
    boxes: [
      box(56, y1, 160, health[0], health[1], "other"),
      box(56, y2, 160, mine[0], mine[1], "mine"),
      box(56, y3, 160, rows[0], rows[1], "other"),
    ],
    dots: [],
    lines: [
      {
        d: `M 0 ${bracket - 6} L 0 ${bracket} L 272 ${bracket} L 272 ${bracket - 6}`,
        kind: "wire",
        tone: "other",
      },
      arrow(136, bracket, 136, y1 - 8),
      arrow(136, y1 + 64, 136, y2 - 8, "mine"),
      arrow(136, y2 + 64, 136, y3 - 8, "mine"),
    ],
    texts: [
      ...head,
      ...grid,
      {
        x: 126,
        y: y1 + 82,
        text: f.counts.records,
        kind: "label",
        anchor: "end",
      },
      { x: 146, y: y1 + 82, text: "records", kind: "note" },
      {
        x: 126,
        y: y2 + 82,
        text: f.counts.repeats,
        kind: "label",
        anchor: "end",
      },
      { x: 146, y: y2 + 82, text: "repeats removed", kind: "note" },
    ],
  };
};

export const funnelDiagram = (f: Funnel): Diagram => ({
  column: columnScene(f),
  row: rowScene(f),
});
