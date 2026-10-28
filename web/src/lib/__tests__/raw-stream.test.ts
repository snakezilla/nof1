import { describe, expect, it } from "vitest";
import {
  isRawStream,
  parseRawStreamOrNull,
  rawSignalText,
  type RawStream,
} from "../raw-stream";
import { publicData } from "../../test/fixtures";

const stream: RawStream = {
  readings: 66658,
  hours: 18.5,
  with_rr: 38917,
  first: "2026-05-10",
  last: "2026-05-11",
  fields: [
    "heart rate",
    "beat-to-beat intervals",
    "skin temperature",
    "motion",
  ],
};

describe("raw stream", () => {
  it("reads the shipped raw-stream.json", () => {
    expect(publicData().rawStream).toEqual(stream);
  });

  it("rejects a wrong shape", () => {
    [
      null,
      [],
      { ...stream, readings: "66658" },
      { ...stream, readings: 1.5 },
      { ...stream, hours: 0 },
      { ...stream, with_rr: stream.readings + 1 },
      { ...stream, first: "May 10" },
      { ...stream, fields: [1] },
    ].forEach((v) => {
      expect(isRawStream(v)).toBe(false);
      expect(parseRawStreamOrNull(v)).toBeNull();
    });
    expect(parseRawStreamOrNull(undefined)).toBeNull();
  });

  it("rounds the hours down and formats the counts", () => {
    expect(rawSignalText(stream)).toBe(
      "WHOOP's app gives you summaries. I wanted the raw signal, so I built a Bluetooth reader on my Mac on top of an open-source decoder of the strap's protocol. One night of it: 66,658 readings in 18 hours, one a second: heart rate, beat-to-beat intervals on 38,917 of them, skin temperature and motion. It is not on this page yet. It covers one night, and its HRV does not match WHOOP's. Next: make it run every night.",
    );
    expect(rawSignalText({ ...stream, hours: 1.9 })).toContain("in 1 hour,");
  });
});
