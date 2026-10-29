// The page is served under /healthtech/, so a root-absolute path to a public file ("/media/...",
// "/data/...", "/og.png") or the old origin would 404 there. Every such URL goes through asset() or Vite's base.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import config from "../../../vite.config";
import { asset } from "../asset";

const web = resolve(__dirname, "../../..");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "__tests__" || name === "test" ? [] : walk(path);
    return /\.(ts|tsx|css|mjs|html)$/.test(name) ? [path] : [];
  });

const SOURCES = [
  ...walk(join(web, "src")),
  ...walk(join(web, "scripts")),
  join(web, "index.html"),
];

const ROOT_ABSOLUTE = /["'`(]\/(media|data|assets|og\.png|og\.html|favicon)/;

describe("base-aware URLs", () => {
  it.each(SOURCES.map((p) => [p.slice(web.length + 1), p]))(
    "%s has no root-absolute public path and no old origin",
    (_name, path) => {
      const text = readFileSync(path, "utf8");
      expect(text).not.toMatch(ROOT_ABSOLUTE);
      expect(text).not.toMatch(/nof1-mu\.vercel\.app/);
    },
  );

  it("builds public URLs under the configured base", () => {
    expect(config.base).toBe("/healthtech/");
    const base = import.meta.env.BASE_URL;
    expect(asset("media/x.mp4")).toBe(`${base}media/x.mp4`);
    expect(asset("/data")).toBe(`${base}data`);
  });
});
