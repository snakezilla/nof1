import daily from "../fixtures/daily.json";
import meta from "../fixtures/meta.json";
import patterns from "../fixtures/patterns.json";
import test from "../fixtures/test.json";
import {
  parseDaily,
  parseExperiment,
  parseMeta,
  parsePatterns,
} from "../lib/validate";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDataset, type RawDataset } from "../lib/dataset";
import type { Dataset, Day } from "../lib/types";

export const fixtureDaily = parseDaily(daily);
export const fixturePatterns = parsePatterns(patterns);
export const fixtureTest = parseExperiment(test);
export const fixtureMeta = parseMeta(meta);
export const rawFixtures = { daily, meta, patterns, test } as const;

export const day = (date: string, over: Partial<Day> = {}): Day => ({
  date,
  hrv_ms: 50,
  hrv_n: 8,
  sleep_h: 7,
  deep_h: null,
  rem_h: null,
  workout_min: 0,
  workout_types: [],
  mindful_min: 0,
  ...over,
});

/** The files that ship with the site, read from disk, for tests that pin real copy. */
export const publicRaw = (): RawDataset => {
  const read = (name: string): unknown =>
    JSON.parse(
      readFileSync(join(process.cwd(), "public/data", `${name}.json`), "utf8"),
    );
  return {
    daily: read("daily"),
    patterns: read("patterns"),
    test: read("test"),
    meta: read("meta"),
    figures: read("figures"),
    raw_stream: read("raw-stream"),
    mask: read("mask"),
  };
};

export const publicData = (): Dataset => parseDataset(publicRaw());
