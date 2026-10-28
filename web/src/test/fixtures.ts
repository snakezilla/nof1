import meta from "../fixtures/meta.json";
import patterns from "../fixtures/patterns.json";
import { parseMeta, parsePatterns } from "../lib/validate";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseDataset, type RawDataset } from "../lib/dataset";
import type { Dataset } from "../lib/types";

export const fixturePatterns = parsePatterns(patterns);
export const fixtureMeta = parseMeta(meta);
export const rawFixtures = { meta, patterns } as const;

/** The files that ship with the site, read from disk, for tests that pin real copy. */
export const publicRaw = (): RawDataset => {
  const read = (name: string): unknown =>
    JSON.parse(
      readFileSync(join(process.cwd(), "public/data", `${name}.json`), "utf8"),
    );
  return {
    patterns: read("patterns"),
    meta: read("meta"),
    figures: read("figures"),
    raw_stream: read("raw-stream"),
    mask: read("mask"),
    projects: read("projects"),
  };
};

export const publicData = (): Dataset => parseDataset(publicRaw());
