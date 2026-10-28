import { describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  answeredDates,
  dayLabel,
  dayNumber,
  firstAnswerDate,
  loadStore,
  parseStore,
  saveStore,
  setAnswer,
  strip,
} from "../checkin";

describe("parseStore", () => {
  it("returns an empty store for missing, broken or wrong-shaped input", () => {
    expect(parseStore(null)).toEqual({});
    expect(parseStore("{not json")).toEqual({});
    expect(parseStore("[1,2]")).toEqual({});
  });

  it("drops entries with bad dates or bad values", () => {
    const raw = JSON.stringify({
      "2026-10-01": { energy: 3 },
      nope: { a: 1 },
      "2026-10-02": { a: "x" },
    });
    expect(parseStore(raw)).toEqual({ "2026-10-01": { energy: 3 } });
  });
});

describe("loadStore and saveStore", () => {
  it("round-trips through storage", () => {
    const store = { "2026-10-01": { energy: 4, lights: true } };
    expect(saveStore(window.localStorage, store)).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      JSON.stringify(store),
    );
    expect(loadStore(window.localStorage)).toEqual(store);
  });

  it("survives storage that throws or is missing", () => {
    const broken = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    expect(loadStore(broken)).toEqual({});
    expect(saveStore(broken, {})).toBe(false);
    expect(loadStore(undefined)).toEqual({});
    expect(saveStore(undefined, {})).toBe(false);
  });
});

describe("setAnswer", () => {
  it("returns a new store and leaves the old one alone", () => {
    const a = Object.freeze({ "2026-10-01": Object.freeze({ energy: 2 }) });
    const b = setAnswer(a, "2026-10-01", "lights", true);
    const c = setAnswer(b, "2026-10-02", "energy", 5);
    expect(a).toEqual({ "2026-10-01": { energy: 2 } });
    expect(b).toEqual({ "2026-10-01": { energy: 2, lights: true } });
    expect(c["2026-10-02"]).toEqual({ energy: 5 });
  });
});

describe("day counting", () => {
  const store = {
    "2026-10-03": { energy: 3 },
    "2026-10-01": { energy: 4 },
    "2026-10-02": {},
  };

  it("finds answered dates in order, ignoring empty days", () => {
    expect(answeredDates(store)).toEqual(["2026-10-01", "2026-10-03"]);
    expect(firstAnswerDate(store)).toBe("2026-10-01");
    expect(firstAnswerDate({})).toBeNull();
  });

  it("counts days from the first answer, across a month end", () => {
    expect(dayNumber({}, "2026-10-01")).toBeNull();
    expect(dayNumber(store, "2026-10-01")).toBe(1);
    expect(dayNumber({ "2026-09-28": { e: 1 } }, "2026-10-04")).toBe(7);
  });

  it("labels not started, in progress and finished", () => {
    expect(dayLabel({}, "2026-10-01", 14, 4)).toBe(
      "No check-ins yet. Answer today's four questions to start.",
    );
    expect(dayLabel({}, "2026-10-01", 14, 1)).toBe(
      "No check-ins yet. Answer today's question to start.",
    );
    expect(dayLabel(store, "2026-10-05", 14, 4)).toBe(
      "Day 5 of 14. Saved on this device.",
    );
    expect(dayLabel(store, "2026-10-20", 14, 4)).toBe(
      "Finished. 2 of 14 days logged.",
    );
  });

  it("builds a strip from the first answer, marking filled days and today", () => {
    const dots = strip(store, "2026-10-03", 14);
    expect(dots).toHaveLength(14);
    expect(dots[0]).toEqual({ date: "2026-10-01", filled: true, today: false });
    expect(dots[1].filled).toBe(false);
    expect(dots[2]).toEqual({ date: "2026-10-03", filled: true, today: true });
  });

  it("starts the strip today when nothing is stored", () => {
    expect(strip({}, "2026-10-26", 14)[0]).toEqual({
      date: "2026-10-26",
      filled: false,
      today: true,
    });
  });
});
