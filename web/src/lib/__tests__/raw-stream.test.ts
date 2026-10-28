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

  it("says it in two sentences with the count from the file", () => {
    expect(rawSignalText(stream)).toBe(
      "I also built a Bluetooth reader on an open-source decoder to get the raw signal off the strap: 66,658 readings in one night, one a second. It is not joined yet.",
    );
  });
});
