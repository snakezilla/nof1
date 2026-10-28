import {
  appCounts,
  capitalise,
  countLabel,
  deviceOf,
  fmt,
  hubName,
  leadApp,
  parseExporter,
} from "./provenance";
import { formatMonthYear as monthYear } from "./dates";
import type { AppCount } from "./provenance";
import type { Day, HealthSource, Provenance } from "./types";

/** The three steps under the section title, from the strap to this page. */
export const FLOW_STEPS: readonly string[] = [
  "The strap measures. WHOOP's app syncs it and writes sleep and workouts into Apple Health on my iPhone.",
  "I wrote an iPhone app, HealthExporter. It reads Apple Health and saves everything to iCloud as files, twice a day.",
  "Python on my Mac turns those files into one row per day. This page is built from those rows.",
];

/** "How I got it out": two short paragraphs; the times and app names come from the JSON. */
export const howParagraphs = (p: Provenance): readonly string[] => {
  const lead = leadApp(p) ?? "The maker";
  const hub = hubName(p.hub);
  const times = /at ([\d:]+ [ap]m) and ([\d:]+ [ap]m)/.exec(
    parseExporter(p.exporter).does,
  );
  const when = times
    ? `It runs at ${times[1]} and ${times[2]} from a Shortcut, and each time Health changes.`
    : "It runs from a Shortcut, and each time Health changes.";
  return [
    `${lead} shows your data only in its app. Its API is for partners. But the app writes what it measures into ${hub}. So ${hub} is the hub.`,
    `Apple lets an app that you build and sign read your own Health store. I built one. It reads every sample type, backfills the full history on the first run, and writes CSV and JSONL to iCloud. ${when} iCloud moves the files to my Mac.`,
  ];
};

export interface SourceRow {
  readonly app: string;
  readonly wrote: string;
  readonly count: string;
  readonly how: string;
}

/** The sources table: one row per app, then the exporter that reads them all. */
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

export interface LeftOut {
  readonly what: string;
  readonly rows: string;
  readonly why: string;
}

const sentence = (s: string): string =>
  capitalise(s.trim()).replace(/[.]?$/, ".");

/** "{what}: {rows} rows. {why}" */
export const leftOutItems = (p: Provenance): readonly LeftOut[] =>
  p.excluded.map((e) => ({
    what: capitalise(e.what),
    rows: `${fmt(e.rows)} ${e.rows === 1 ? "row" : "rows"}`,
    why: sentence(e.why),
  }));

export const leftOutLine = (item: LeftOut): string =>
  `${item.what}: ${item.rows}. ${item.why}`;

export interface OtherSourceRow {
  readonly app: string;
  readonly wrote: string;
  readonly records: string;
  readonly dates: string;
  readonly why: string;
}

const STATUS_WHY: Readonly<Record<string, string>> = {
  excluded: "Left out, see above",
  "outside the window": "Outside the window",
  "not used": "Not used",
};

const SHOWN_TYPES = 3;

/** "heart rate, sleep, HRV and 4 more". Types keep their own case: HRV, ECG. */
const typeList = (types: readonly string[]): string =>
  types.length > SHOWN_TYPES
    ? `${types.slice(0, SHOWN_TYPES).join(", ")} and ${types.length - SHOWN_TYPES} more`
    : types.join(", ");

const dateRange = (first: string, last: string): string =>
  monthYear(first) === monthYear(last)
    ? monthYear(first)
    : `${monthYear(first)} to ${monthYear(last)}`;

const onPage = (p: Provenance, s: HealthSource): boolean =>
  appCounts(p).some((a) => storeEntry(p, a.app) === s);

/** Why a source is not here. A source marked used but with nothing on the page says why. */
const whyNot = (s: HealthSource, mindfulDays: number | null): string => {
  if (s.status === "used")
    return s.types.every((t) => t === "mindful minutes") && mindfulDays !== null
      ? `Mindful minutes on ${fmt(mindfulDays)} days, too few to show`
      : "Not shown on this page";
  return s.reason
    ? capitalise(s.reason.trim()).replace(/\.$/, "")
    : (STATUS_WHY[s.status] ?? capitalise(s.status));
};

/**
 * Every app in the Health store that is not on this page, and why not. mindfulDays is the number
 * of days in the window with mindful minutes, from daily.json.
 */
export const otherSourceRows = (
  p: Provenance,
  mindfulDays: number | null = null,
): readonly OtherSourceRow[] | null =>
  p.all_sources
    ? p.all_sources
        .filter((s) => !onPage(p, s))
        .map((s) => ({
          app: s.name,
          wrote: typeList(s.types),
          records: fmt(s.records),
          dates: dateRange(s.first, s.last),
          why: whyNot(s, mindfulDays),
        }))
    : null;

/** Days inside the window with any mindful minutes. Null without a window. */
export const mindfulDaysIn = (
  days: readonly Day[],
  window: { readonly from: string; readonly to: string } | undefined,
): number | null =>
  window
    ? days.filter(
        (d) =>
          d.date >= window.from && d.date <= window.to && d.mindful_min > 0,
      ).length
    : null;
