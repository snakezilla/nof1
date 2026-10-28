import { describe, expect, it } from "vitest";
import { layouts } from "../pipeline-layouts";
import { pipeline, pipelineSummary } from "../provenance";
import {
  FLOW_STEPS,
  howParagraphs,
  leftOutItems,
  leftOutLine,
  otherSourceRows,
  sourceRows,
} from "../provenance-text";
import { rawSignalText } from "../raw-stream";
import type { Provenance } from "../types";
import { publicData } from "../../test/fixtures";

const real = (): Provenance => {
  const p = publicData().meta.provenance;
  if (!p) throw new Error("public meta.json has no provenance");
  return p;
};

const base: Provenance = {
  hub: "Apple Health (HealthKit) on my iPhone",
  exporter:
    "HealthExporter, my own iOS app: anchored HealthKit queries, run from an iOS Shortcut at 2:05 am and 2:05 pm",
  nights_by_app: { WHOOP: 250, SnoreLab: 3 },
  workouts_by_app: { WHOOP: 226, Strava: 27 },
  excluded: [
    {
      what: "Unstrap HRV stream",
      rows: 20341,
      why: "read straight from the strap over Bluetooth; its HRV figures are not SDNN in milliseconds",
    },
    { what: "nights under 1 hour", rows: 6, why: "naps or partial syncs" },
  ],
  window: { from: "2024-05-01", to: "2025-04-30" },
};

describe("flow steps", () => {
  it("says the three steps in order, the strap first and this page last", () => {
    expect(FLOW_STEPS).toEqual([
      "The strap measures. WHOOP's app syncs it and writes sleep and workouts into Apple Health on my iPhone.",
      "I wrote an iPhone app, HealthExporter. It reads Apple Health and saves everything to iCloud as files, twice a day.",
      "Python on my Mac turns those files into one row per day. This page is built from those rows.",
    ]);
  });
});

describe("pipeline", () => {
  it("builds the nodes in flow order from provenance", () => {
    expect(pipeline(base).nodes.map((n) => [n.kind, n.label])).toEqual([
      ["device", "WHOOP 4.0 strap"],
      ["app", "WHOOP app"],
      ["app", "Strava"],
      ["app", "SnoreLab"],
      ["hub", "Apple Health"],
      ["mine", "HealthExporter, I wrote it"],
      ["step", "iCloud"],
      ["step", "CSV on my Mac"],
      ["step", "prep/, Python"],
      ["step", "this page"],
      ["excluded", "raw signal, one night, not used yet"],
    ]);
  });

  it("labels app edges with their counts and dashes only the Bluetooth stream", () => {
    const { edges } = pipeline(base);
    const labelled = edges.filter((e) => e.label);
    expect(labelled.map((e) => [e.from, e.label])).toEqual([
      ["app-WHOOP", "250 nights, 226 workouts"],
      ["app-Strava", "27 workouts"],
      ["app-SnoreLab", "3 nights"],
      ["device", "Bluetooth"],
    ]);
    expect(edges.filter((e) => e.dashed)).toEqual([
      {
        from: "device",
        to: "excluded",
        label: "Bluetooth",
        dashed: true,
      },
    ]);
    expect(edges).toHaveLength(1 + 3 + 5 + 1);
  });

  it("has no dashed edge or excluded node without a Bluetooth exclusion", () => {
    const { nodes, edges } = pipeline({ ...base, excluded: [] });
    expect(nodes.some((n) => n.kind === "excluded")).toBe(false);
    expect(edges.some((e) => e.dashed)).toBe(false);
  });

  it("summarises the drawing in one sentence with the counts", () => {
    const s = pipelineSummary(base);
    expect(s).toContain("WHOOP (250 nights, 226 workouts)");
    expect(s).toContain(
      "reads the raw signal off the strap over Bluetooth. It covers one night and is not used yet.",
    );
  });
});

describe("pipeline layouts", () => {
  const all = layouts(pipeline(real()));
  const overlap = (
    a: { x: number; y: number; w: number; h: number },
    b: typeof a,
  ) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it("fits each drawing in its width: 280 under 640 px, 592 to 1024, 880 above", () => {
    expect(all.narrow.width).toBeLessThanOrEqual(281);
    expect(all.medium.width).toBeLessThanOrEqual(592);
    expect(all.wide.width).toBeLessThanOrEqual(880);
  });

  it("never overlaps two nodes, and runs taller than wide only when narrow", () => {
    Object.values(all).forEach((l) =>
      l.boxes.forEach((a, i) =>
        l.boxes.slice(i + 1).forEach((b) => expect(overlap(a, b)).toBe(false)),
      ),
    );
    expect(all.narrow.height).toBeGreaterThan(all.narrow.width);
    expect(all.wide.width).toBeGreaterThan(all.wide.height);
  });

  it("keeps every point and label inside the drawing", () => {
    Object.values(all).forEach((l) =>
      l.wires.forEach((w) => {
        w.points.forEach(([x, y]) => {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(l.width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(l.height);
        });
        if (w.label) {
          const left =
            w.label.anchor === "middle"
              ? w.label.x - w.label.w / 2
              : w.label.anchor === "end"
                ? w.label.x - w.label.w
                : w.label.x;
          expect(left).toBeGreaterThanOrEqual(0);
          expect(left + w.label.w).toBeLessThanOrEqual(l.width);
          expect(w.label.y).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });
});

describe("sources table", () => {
  it("lists each app, then the exporter that reads them all", () => {
    expect(sourceRows(base)).toEqual([
      {
        app: "WHOOP",
        wrote: "Sleep and workouts.",
        count: "250 nights, 226 workouts",
        how: "Its app syncs to Health",
      },
      {
        app: "Strava",
        wrote: "Workouts.",
        count: "27 workouts",
        how: "Writes to Health",
      },
      {
        app: "SnoreLab",
        wrote: "Sleep.",
        count: "3 nights",
        how: "Writes to Health",
      },
      {
        app: "HealthExporter, mine",
        wrote: "Nothing, it reads",
        count: "253 nights, 253 workouts",
        how: "CSV to iCloud, twice a day",
      },
    ]);
  });
});

describe("copy", () => {
  it("writes the two paragraphs with names and times from the JSON", () => {
    const paragraphs = howParagraphs(base);
    expect(paragraphs).toHaveLength(2);
    const [p1, p2] = paragraphs;
    expect(p1).toBe(
      "WHOOP shows your data only in its app. Its API is for partners. But the app writes what it measures into Apple Health. So Apple Health is the hub.",
    );
    expect(p2).toContain("It runs at 2:05 am and 2:05 pm from a Shortcut");
    expect(paragraphs.join(" ")).not.toMatch(/Bluetooth/);
  });

  it("formats each exclusion as what: rows. why.", () => {
    expect(leftOutItems(base).map(leftOutLine)).toEqual([
      "Unstrap HRV stream: 20,341 rows. Read straight from the strap over Bluetooth; its HRV figures are not SDNN in milliseconds.",
      "Nights under 1 hour: 6 rows. Naps or partial syncs.",
    ]);
  });

  it("never says hacked, never uses contractions or em dashes", () => {
    const text = [
      ...FLOW_STEPS,
      ...howParagraphs(real()),
      rawSignalText(publicData().rawStream!),
      ...leftOutItems(real()).map(leftOutLine),
    ].join(" ");
    expect(text).not.toMatch(/hack/i);
    // Possessives ("WHOOP's app") are fine; contractions are not.
    expect(text).not.toMatch(/\b\w+'(t|re|ve|ll|d)\b/);
    expect(text).not.toMatch(/\b(it|that|there|what|he|she)'s\b/i);
    expect(text).not.toContain("—");
    expect(text).not.toContain("!");
  });
});

describe("otherSourceRows", () => {
  it("is null until all_sources exists", () => {
    expect(otherSourceRows(base)).toBeNull();
  });

  it("names the types an app wrote that the page does not use", () => {
    const [whoop, strava] = sourceRows(real());
    expect(whoop.wrote).toBe(
      "Sleep and workouts. Also heart rate, resting heart rate, breathing rate, blood oxygen, not used here.",
    );
    expect(strava.wrote).toBe("Workouts. Also routes, not used here.");
  });

  it("moves a used source with nothing on the page into the second table", () => {
    const rows = otherSourceRows(real(), 19) ?? [];
    const balance = rows.find((r) => r.app.startsWith("Balance"));
    expect(balance?.why).toBe("Mindful minutes on 19 days, too few to show");
    expect(rows.map((r) => r.app)).not.toContain("SnoreLab");
    expect(rows).toHaveLength(11);
  });

  it("reads the shipped list: used rows hidden, reasons split off the status", () => {
    const rows = otherSourceRows(real()) ?? [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.app === "WHOOP")).toBe(false);
    const unstrap = rows.find((r) => r.app.startsWith("Unstrap"));
    expect(unstrap?.why).toBe(
      "HRV is not SDNN in milliseconds, sleep segments overlap",
    );
    expect(rows.every((r) => r.wrote.split(", ").length <= 3)).toBe(true);
  });

  it("lists every source that is not used, with dates and a reason", () => {
    const rows = otherSourceRows({
      ...base,
      all_sources: [
        {
          name: "WHOOP",
          types: ["Sleep"],
          records: 900,
          first: "2023-01-01",
          last: "2026-01-01",
          in_window: 250,
          status: "used",
          reason: "",
        },
        {
          name: "Apple Watch",
          types: ["HRV"],
          records: 30,
          first: "2022-03-01",
          last: "2022-09-01",
          in_window: 0,
          status: "outside the window",
          reason: "",
        },
        {
          name: "Clock",
          types: ["Sleep"],
          records: 1200,
          first: "2024-06-02",
          last: "2024-06-20",
          in_window: 4,
          status: "not used",
          reason: "bedtime alarms, not sleep",
        },
      ],
    });
    expect(rows).toEqual([
      {
        app: "Apple Watch",
        wrote: "HRV",
        records: "30",
        dates: "Mar 2022 to Sep 2022",
        why: "Outside the window",
      },
      {
        app: "Clock",
        wrote: "Sleep",
        records: "1,200",
        dates: "Jun 2024",
        why: "Bedtime alarms, not sleep",
      },
    ]);
  });
});

describe("mindfulDaysIn", () => {
  it("counts days in the window with any mindful minutes", async () => {
    const { mindfulDaysIn } = await import("../provenance-text");
    const { day } = await import("../../test/fixtures");
    const days = [
      day("2024-04-30", { mindful_min: 5 }),
      day("2024-05-01", { mindful_min: 5 }),
      day("2024-05-02"),
      day("2025-04-30", { mindful_min: 1 }),
    ];
    expect(mindfulDaysIn(days, base.window)).toBe(2);
    expect(mindfulDaysIn(days, undefined)).toBeNull();
  });
});
