import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseDaily,
  parseExperiment,
  parseMeta,
  parsePatterns,
} from "../validate";
import { parseFigures } from "../validate-figures";

// Guards the files that ship with the site, sample or real.
const dir = join(process.cwd(), "public/data");
const read = (name: string): unknown =>
  JSON.parse(readFileSync(join(dir, name), "utf8"));
const present = ["daily", "patterns", "test", "meta"].every((n) =>
  existsSync(join(dir, `${n}.json`)),
);

describe.runIf(present)("public/data", () => {
  it("matches the schema", () => {
    expect(parseDaily(read("daily.json")).length).toBeGreaterThan(0);
    expect(parsePatterns(read("patterns.json")).length).toBeGreaterThan(0);
    expect(parseExperiment(read("test.json")).checkin.length).toBeGreaterThan(
      0,
    );
    expect(parseMeta(read("meta.json")).repo).toMatch(/^https:/);
    expect(parseFigures(read("figures.json")).claims.length).toBeGreaterThan(0);
  });
});
