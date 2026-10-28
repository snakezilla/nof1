import type { Exclusion, Provenance } from "./types";

/** Records an app wrote into Apple Health inside the window. */
export interface AppCount {
  readonly app: string;
  readonly nights: number;
  readonly workouts: number;
}

export type NodeKind = "device" | "app" | "hub" | "mine" | "step" | "excluded";

export interface PipeNode {
  readonly id: string;
  readonly label: string;
  readonly kind: NodeKind;
}

export interface PipeEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  /** The one way in that was built and then left out. */
  readonly dashed?: boolean;
}

export interface Pipeline {
  readonly nodes: readonly PipeNode[];
  readonly edges: readonly PipeEdge[];
}

/** The hardware behind an app, where there is one. Apps not listed are phone apps. */
const DEVICES: Readonly<Record<string, string>> = {
  WHOOP: "WHOOP 4.0 strap",
};

/** What happens after the exporter, in order. These are this repo's own steps. */
const DOWNSTREAM = ["iCloud", "CSV on my Mac", "prep/, Python", "this page"];

export const SECTION_ID = "how-i-got-it-out";

export const fmt = (n: number): string => n.toLocaleString("en-US");
export const plural = (n: number, one: string): string =>
  `${fmt(n)} ${one}${n === 1 ? "" : "s"}`;
export const capitalise = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

/** Every app with records in the window, most records first. */
export const appCounts = (p: Provenance): readonly AppCount[] => {
  const apps = [
    ...new Set([
      ...Object.keys(p.nights_by_app),
      ...Object.keys(p.workouts_by_app),
    ]),
  ];
  return apps
    .map((app) => ({
      app,
      nights: p.nights_by_app[app] ?? 0,
      workouts: p.workouts_by_app[app] ?? 0,
    }))
    .filter((a) => a.nights + a.workouts > 0)
    .sort((a, b) => b.nights + b.workouts - (a.nights + a.workouts));
};

/** "250 nights, 226 workouts", "27 workouts", "3 nights". */
export const countLabel = ({ nights, workouts }: AppCount): string =>
  [
    nights > 0 ? plural(nights, "night") : "",
    workouts > 0 ? plural(workouts, "workout") : "",
  ]
    .filter(Boolean)
    .join(", ");

/** "Apple Health (HealthKit) on my iPhone" -> "Apple Health". */
export const hubName = (hub: string): string =>
  hub
    .replace(/\s*\(.*?\)/g, "")
    .replace(/\s+on my .*$/, "")
    .trim();

export interface Exporter {
  readonly name: string;
  readonly what: string;
  readonly does: string;
}

/** "HealthExporter, my own iOS app: a, b, c" -> name, what it is, what it does. */
export const parseExporter = (exporter: string): Exporter => {
  const [head, ...rest] = exporter.split(":");
  const [name, ...what] = head.split(",");
  return {
    name: name.trim(),
    what: what.join(",").trim(),
    does: rest.join(":").trim(),
  };
};

export const deviceOf = (app: string | null): string | null =>
  app ? (DEVICES[app] ?? null) : null;

/** The excluded stream read straight off the device, if any. */
export const directStream = (p: Provenance): Exclusion | null =>
  p.excluded.find((e) => /bluetooth/i.test(e.why)) ?? null;

/** The pipeline as nodes and edges. Only the raw Bluetooth signal, not used yet, is dashed. */
export const pipeline = (p: Provenance): Pipeline => {
  const apps = appCounts(p);
  const lead = apps[0]?.app ?? null;
  const device = deviceOf(lead);
  const stream = device ? directStream(p) : null;
  const exporter = parseExporter(p.exporter);
  const downstream = DOWNSTREAM.map((label, i) => ({
    id: `step-${i}`,
    label,
    kind: "step" as const,
  }));
  const chain = ["hub", "mine", ...downstream.map((n) => n.id)];
  const nodes: readonly PipeNode[] = [
    ...(device
      ? [{ id: "device", label: device, kind: "device" as const }]
      : []),
    ...apps.map((a) => ({
      id: `app-${a.app}`,
      label: a.app === lead && device ? `${a.app} app` : a.app,
      kind: "app" as const,
    })),
    { id: "hub", label: hubName(p.hub), kind: "hub" },
    { id: "mine", label: `${exporter.name}, I wrote it`, kind: "mine" },
    ...downstream,
    ...(stream
      ? [
          {
            id: "excluded",
            label: "raw signal, one night, not used yet",
            kind: "excluded" as const,
          },
        ]
      : []),
  ];
  const edges: readonly PipeEdge[] = [
    ...(device && lead ? [{ from: "device", to: `app-${lead}` }] : []),
    ...apps.map((a) => ({
      from: `app-${a.app}`,
      to: "hub",
      label: countLabel(a),
    })),
    ...chain.slice(1).map((to, i) => ({ from: chain[i], to })),
    ...(stream
      ? [
          {
            from: "device",
            to: "excluded",
            label: "Bluetooth",
            dashed: true,
          },
        ]
      : []),
  ];
  return { nodes, edges };
};

/** One sentence a screen reader reads in place of the drawing. */
export const pipelineSummary = (p: Provenance): string => {
  const apps = appCounts(p);
  const device = deviceOf(apps[0]?.app ?? null);
  const stream = device ? directStream(p) : null;
  const into = apps.map((a) => `${a.app} (${countLabel(a)})`).join(", ");
  const head = device ? `A ${device} syncs to its app. ` : "";
  const tail = stream
    ? " A second way in reads the raw signal off the strap over Bluetooth. It covers one night and is not used yet."
    : "";
  return `${head}${into} write into ${hubName(p.hub)}. ${parseExporter(p.exporter).name}, my app, reads it out to ${DOWNSTREAM.join(", then ")}.${tail}`;
};
