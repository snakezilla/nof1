import { describe, expect, it } from "vitest";
import { layouts } from "../pipeline-layouts";
import { pipeline, pipelineSummary } from "../provenance";
import { DROPPED, FLOW_STEPS, sourceRows } from "../provenance-text";
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
  it("says what was dropped in one line", () => {
    expect(DROPPED).toBe(
      "Dropped: one stream with the wrong units, and nights under an hour.",
    );
  });

  it("never says hacked, never uses contractions or em dashes", () => {
    const text = [
      ...FLOW_STEPS,
      rawSignalText(publicData().rawStream!),
      DROPPED,
    ].join(" ");
    expect(text).not.toMatch(/hack/i);
    // Possessives ("WHOOP's app") are fine; contractions are not.
    expect(text).not.toMatch(/\b\w+'(t|re|ve|ll|d)\b/);
    expect(text).not.toMatch(/\b(it|that|there|what|he|she)'s\b/i);
    expect(text).not.toContain("—");
    expect(text).not.toContain("!");
  });
});

describe("sourceRows", () => {
  it("names the types an app wrote that the page does not use", () => {
    const [whoop, strava] = sourceRows(real());
    expect(whoop.wrote).toBe(
      "Sleep and workouts. Also heart rate, resting heart rate, breathing rate, blood oxygen, not used here.",
    );
    expect(strava.wrote).toBe("Workouts. Also routes, not used here.");
  });
});
