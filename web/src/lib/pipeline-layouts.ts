import {
  CH,
  LH,
  PAD_X,
  bottom,
  box,
  center,
  finish,
  parts,
  right,
  size,
  wire,
  wrap,
  type Box,
  type EdgeLabel,
  type Layout,
  type Wire,
} from "./pipeline-layout";
import type { Pipeline } from "./provenance";

const GAP = 28;
const ROW_GAP = 10;
const LABEL_GAP = 5;
const NONE = Number.POSITIVE_INFINITY;

const labelBlock = (text: string | undefined, max: number) => {
  const lines = text ? wrap(text, max) : [];
  return {
    lines,
    w: Math.ceil(Math.max(0, ...lines.map((l) => l.length)) * CH),
    h: lines.length * LH,
  };
};

interface Wide {
  /** Wrap node labels past this many characters. */
  readonly nodeChars: number;
  /** Wrap edge labels past this many characters. */
  readonly labelChars: number;
}

/**
 * Sources on the left feed a tall hub, the hub feeds my exporter; the exporter returns to a second
 * row that runs to this page. The dashed way in sits alone on a third row, under the strap.
 */
export const horizontal = (
  pl: Pipeline,
  o: Wide = { nodeChars: NONE, labelChars: NONE },
): Layout => {
  const p = parts(pl);
  const lines = (label: string) => wrap(label, o.nodeChars);
  const appLines = p.apps.map((a) => lines(a.label));
  const appW = Math.max(...appLines.map((l) => size(l).w));
  const appH = Math.max(...appLines.map((l) => size(l).h));
  const appEdges = p.apps.map((a) => p.edge(a.id, p.hub.id));
  const labels = appEdges.map((e) => labelBlock(e.label, o.labelChars));
  const labelH = Math.max(0, ...labels.map((l) => l.h));
  const step = Math.max(appH + ROW_GAP, labelH + 2 * LABEL_GAP + ROW_GAP);
  const cy0 = Math.max(appH / 2, labelH + LABEL_GAP + 2);

  const devLines = p.device ? lines(p.device.label) : [];
  const dev = p.device
    ? box(
        p.device,
        devLines,
        0,
        cy0 - size(devLines).h / 2,
        size(devLines).w,
        size(devLines).h,
      )
    : null;
  const appX = dev ? right(dev) + GAP : 0;
  const apps = p.apps.map((a, i) =>
    box(a, appLines[i], appX, cy0 + i * step - appH / 2, appW, appH),
  );
  const gapW = Math.max(GAP * 2, ...labels.map((l) => l.w + 2 * PAD_X));
  const hubLines = lines(p.hub.label);
  const hubTop = apps[0].y;
  const hubH = Math.max(
    size(hubLines).h,
    bottom(apps[apps.length - 1]) - hubTop,
  );
  const hub = box(
    p.hub,
    hubLines,
    right(apps[0]) + gapW,
    hubTop,
    size(hubLines).w,
    hubH,
  );
  const [, hubCy] = center(hub);

  const [mineNode, ...stepNodes] = p.chain;
  const mineLines = lines(mineNode.label);
  const mineSize = size(mineLines);
  const mine = box(
    mineNode,
    mineLines,
    right(hub) + GAP,
    hubCy - mineSize.h / 2,
    mineSize.w,
    mineSize.h,
  );

  const stepLines = stepNodes.map((n) => lines(n.label));
  const stepSizes = stepLines.map(size);
  const rowH = Math.max(...stepSizes.map((s) => s.h));
  const rowW =
    stepSizes.reduce((sum, s) => sum + s.w, 0) + GAP * (stepSizes.length - 1);
  const rowTop =
    Math.max(bottom(hub), bottom(mine), bottom(apps[apps.length - 1])) +
    2 * GAP;
  const rowX = Math.max(0, right(mine) - rowW);
  const steps = stepNodes.reduce<readonly Box[]>((acc, n, i) => {
    const x = i === 0 ? rowX : right(acc[i - 1]) + GAP;
    return [
      ...acc,
      box(
        n,
        stepLines[i],
        x,
        rowTop + (rowH - stepSizes[i].h) / 2,
        stepSizes[i].w,
        stepSizes[i].h,
      ),
    ];
  }, []);

  const dashed = p.excluded && dev ? p.edge(dev.id, p.excluded.id) : null;
  const dashLabel = labelBlock(dashed?.label, o.labelChars);
  const exLines = p.excluded ? lines(p.excluded.label) : [];
  const exSize = size(exLines);
  const [devCx] = dev ? center(dev) : [0];
  const exCy = rowTop + rowH + GAP + dashLabel.h + LABEL_GAP + exSize.h / 2;
  const excluded =
    p.excluded && dev
      ? box(
          p.excluded,
          exLines,
          devCx + PAD_X + dashLabel.w + 2 * PAD_X,
          exCy - exSize.h / 2,
          exSize.w,
          exSize.h,
        )
      : null;

  const flat = (b: Box, to: Box): Wire =>
    wire(p.edge(b.id, to.id), [
      [right(b), center(b)[1]],
      [to.x, center(b)[1]],
    ]);
  const appWires = apps.map((a, i) => {
    const y = center(a)[1];
    const label: EdgeLabel = {
      lines: labels[i].lines,
      x: right(a) + gapW / 2,
      y: y - LABEL_GAP - labels[i].h,
      anchor: "middle",
      knockout: false,
      w: labels[i].w,
    };
    return wire(
      appEdges[i],
      [
        [right(a), y],
        [hub.x, y],
      ],
      label,
    );
  });
  const [mineCx] = center(mine);
  const [stepCx] = center(steps[0]);
  const turnY = rowTop - GAP;
  const wires: readonly Wire[] = [
    ...(dev ? [flat(dev, apps[0])] : []),
    ...appWires,
    flat(hub, mine),
    wire(
      p.edge(mine.id, steps[0].id),
      mineCx === stepCx
        ? [
            [mineCx, bottom(mine)],
            [stepCx, steps[0].y],
          ]
        : [
            [mineCx, bottom(mine)],
            [mineCx, turnY],
            [stepCx, turnY],
            [stepCx, steps[0].y],
          ],
    ),
    ...steps.slice(1).map((s, i) => flat(steps[i], s)),
    ...(dev && excluded && dashed
      ? [
          wire(
            dashed,
            [
              [devCx, bottom(dev)],
              [devCx, exCy],
              [excluded.x, exCy],
            ],
            {
              lines: dashLabel.lines,
              x: devCx + PAD_X,
              y: exCy - LABEL_GAP - dashLabel.h,
              anchor: "start",
              knockout: false,
              w: dashLabel.w,
            },
          ),
        ]
      : []),
  ];
  return finish(
    [
      ...(dev ? [dev] : []),
      ...apps,
      hub,
      mine,
      ...steps,
      ...(excluded ? [excluded] : []),
    ],
    wires,
  );
};

const COL_GAP = 8;
const V_GAP = 24;

/** Under 640 px: the same graph top to bottom, every node inside the given width. */
export const vertical = (pl: Pipeline, width: number): Layout => {
  const p = parts(pl);
  const devLines = p.device ? wrap(p.device.label, 16) : [];
  const dev = p.device
    ? box(p.device, devLines, 0, 0, size(devLines).w, size(devLines).h)
    : null;

  const dashed = p.excluded && dev ? p.edge(dev.id, p.excluded.id) : null;
  const dashLabel = labelBlock(dashed?.label, 10);
  const exLines = p.excluded ? wrap(p.excluded.label, 14) : [];
  const exSize = size(exLines);
  const labelTop = dev ? bottom(dev) + LABEL_GAP : 0;
  const excluded =
    p.excluded && dev
      ? box(
          p.excluded,
          exLines,
          width - exSize.w,
          labelTop + dashLabel.h + LABEL_GAP + 4,
          exSize.w,
          exSize.h,
        )
      : null;

  const n = p.apps.length;
  const colW = (width - COL_GAP * (n - 1)) / n;
  const chars = Math.floor((colW - 2 * PAD_X) / CH);
  const appLines = p.apps.map((a) => wrap(a.label, chars));
  const appH = Math.max(...appLines.map((l) => size(l).h));
  const appsTop =
    Math.max(dev ? bottom(dev) : 0, excluded ? bottom(excluded) : 0) +
    (dev ? V_GAP : 0);
  const apps = p.apps.map((a, i) =>
    box(a, appLines[i], i * (colW + COL_GAP), appsTop, colW, appH),
  );
  const appEdges = p.apps.map((a) => p.edge(a.id, p.hub.id));
  const labels = appEdges.map((e) => labelBlock(e.label, Math.max(chars, 12)));
  const labelH = Math.max(0, ...labels.map((l) => l.h));

  const hubTop = bottom(apps[0]) + LABEL_GAP * 2 + labelH + V_GAP / 2;
  const full = (node: (typeof p.chain)[number], y: number): Box => {
    const lines = wrap(node.label, Math.floor((width - 2 * PAD_X) / CH));
    return box(node, lines, 0, y, width, size(lines).h);
  };
  const hub = full(p.hub, hubTop);
  const chain = p.chain.reduce<readonly Box[]>(
    (acc, node) => [
      ...acc,
      full(node, bottom(acc[acc.length - 1] ?? hub) + V_GAP),
    ],
    [],
  );
  const mid = width / 2;
  const down = (a: Box, b: Box): Wire =>
    wire(p.edge(a.id, b.id), [
      [mid, bottom(a)],
      [mid, b.y],
    ]);
  const [exCx] = excluded ? center(excluded) : [0];

  const wires: readonly Wire[] = [
    ...(dev
      ? [
          wire(p.edge(dev.id, apps[0].id), [
            [center(apps[0])[0], bottom(dev)],
            [center(apps[0])[0], appsTop],
          ]),
        ]
      : []),
    ...apps.map((a, i) => {
      const [cx] = center(a);
      return wire(
        appEdges[i],
        [
          [cx, bottom(a)],
          [cx, hub.y],
        ],
        {
          lines: labels[i].lines,
          x: cx,
          y: bottom(a) + LABEL_GAP,
          anchor: "middle",
          knockout: true,
          w: labels[i].w,
        },
      );
    }),
    down(hub, chain[0]),
    ...chain.slice(1).map((b, i) => down(chain[i], b)),
    ...(dev && excluded && dashed
      ? [
          wire(
            dashed,
            [
              [right(dev), center(dev)[1]],
              [exCx, center(dev)[1]],
              [exCx, excluded.y],
            ],
            {
              lines: dashLabel.lines,
              x: exCx - PAD_X,
              y: labelTop,
              anchor: "end",
              knockout: false,
              w: dashLabel.w,
            },
          ),
        ]
      : []),
  ];
  return finish(
    [
      ...(dev ? [dev] : []),
      ...(excluded ? [excluded] : []),
      ...apps,
      hub,
      ...chain,
    ],
    wires,
  );
};

/** The three drawings the figure carries; CSS shows the one that fits. */
export const layouts = (pl: Pipeline) => ({
  narrow: vertical(pl, 280),
  medium: horizontal(pl, { nodeChars: 14, labelChars: 12 }),
  wide: horizontal(pl),
});
