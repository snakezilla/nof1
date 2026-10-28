import {
  appCounts,
  capitalise,
  countLabel,
  deviceOf,
  parseExporter,
} from "./provenance";
import type { AppCount } from "./provenance";
import type { HealthSource, Provenance } from "./types";

/** The three steps under the section title, from the strap to this page. */
export const FLOW_STEPS: readonly string[] = [
  "The strap measures. WHOOP's app syncs it and writes sleep and workouts into Apple Health on my iPhone.",
  "I wrote an iPhone app, HealthExporter. It reads Apple Health and saves everything to iCloud as files, twice a day.",
  "Python on my Mac turns those files into one row per day. This page is built from those rows.",
];

/** The one line under the sources table. */
export const DROPPED =
  "Dropped: one stream with the wrong units, and nights under an hour.";

export interface SourceRow {
  readonly app: string;
  readonly wrote: string;
  readonly count: string;
  readonly how: string;
}

/** The all_sources row for an app on this page: "WHOOP" or "Unstrap (open-source ...)". */
export const storeEntry = (p: Provenance, app: string): HealthSource | null =>
  p.all_sources?.find((s) => s.name === app || s.name.startsWith(`${app} (`)) ??
  null;

const USED_TYPES: Readonly<Record<string, string>> = {
  sleep: "nights",
  workouts: "workouts",
};

/** "Sleep and workouts. Also heart rate, blood oxygen, not used here." */
const wroteCell = (p: Provenance, a: AppCount): string => {
  const used = [
    a.nights > 0 ? "sleep" : "",
    a.workouts > 0 ? "workouts" : "",
  ].filter(Boolean);
  const head = `${capitalise(used.join(" and "))}.`;
  const extra = (storeEntry(p, a.app)?.types ?? []).filter(
    (t) => !(t in USED_TYPES),
  );
  return extra.length > 0
    ? `${head} Also ${extra.join(", ")}, not used here.`
    : head;
};

/** The sources table: one row per app, then the exporter that reads them all. */
export const sourceRows = (p: Provenance): readonly SourceRow[] => {
  const apps = appCounts(p);
  const lead = apps[0]?.app ?? null;
  const total = apps.reduce(
    (sum, a) => ({
      ...sum,
      nights: sum.nights + a.nights,
      workouts: sum.workouts + a.workouts,
    }),
    { app: "", nights: 0, workouts: 0 },
  );
  const rows = apps.map((a) => ({
    app: a.app,
    wrote: wroteCell(p, a),
    count: countLabel(a),
    how:
      a.app === lead && deviceOf(lead)
        ? "Its app syncs to Health"
        : "Writes to Health",
  }));
  return [
    ...rows,
    {
      app: `${parseExporter(p.exporter).name}, mine`,
      wrote: "Nothing, it reads",
      count: countLabel(total),
      how: "CSV to iCloud, twice a day",
    },
  ];
};
