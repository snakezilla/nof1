// Renders the page into dist/index.html at build time, so it reads without JavaScript, and
// embeds the data for hydration. Also writes dist/og.html for the social card.
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../..");
const dist = join(root, "dist");
const FILES = ["daily", "patterns", "test", "meta"];

const readData = async () => {
  const entries = await Promise.all(
    FILES.map(async (name) => {
      const path = join(root, "public/data", `${name}.json`);
      try {
        return [name, JSON.parse(await readFile(path, "utf8"))];
      } catch (err) {
        throw new Error(`Could not read ${path}: ${err.message}`);
      }
    }),
  );
  return Object.fromEntries(entries);
};

// figures.json, raw-stream.json and mask.json are optional to the page; mask.json is required to publish.
const readOptional = async (name, without) => {
  const path = join(root, "public/data", `${name}.json`);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT")
      throw new Error(`Could not read ${path}: ${err.message}`);
    process.stderr.write(
      `prerender: no ${name}.json, the page renders without ${without}\n`,
    );
    return undefined;
  }
};

const escapeAttr = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const main = async () => {
  const server = await import(
    pathToFileURL(join(root, "dist-ssr/entry-server.js")).href
  );
  const figures = await readOptional("figures", "figures");
  const rawStream = await readOptional("raw-stream", "the raw signal");
  const mask = await readOptional("mask", "the masking note");
  const raw = {
    ...(await readData()),
    ...(figures === undefined ? {} : { figures }),
    ...(rawStream === undefined ? {} : { raw_stream: rawStream }),
    ...(mask === undefined ? {} : { mask }),
  };
  // Never publish real values: the build stops unless prep/ masked the data.
  server.assertMasked(raw);
  const template = await readFile(join(dist, "index.html"), "utf8");
  if (!template.includes('<div id="root"></div>')) {
    throw new Error("dist/index.html has no empty #root to fill");
  }
  const body = server.render(raw);
  const data = `<script id="nof1-data" type="application/json">${server.embedJson(raw)}</script>`;
  const html = template
    .replace('<div id="root"></div>', `<div id="root">${body}</div>${data}`)
    .replaceAll("__HERO_SENTENCE__", escapeAttr(server.heroSentence(raw)))
    .replaceAll("__DESCRIPTION__", escapeAttr(server.description(raw)));
  await writeFile(join(dist, "index.html"), html);
  await writeFile(join(dist, "og.html"), server.renderOg(raw));
  process.stdout.write(
    `prerender: dist/index.html (${Math.round(html.length / 1024)} KB), dist/og.html\n`,
  );
};

main().catch((err) => {
  process.stderr.write(`prerender failed: ${err.message}\n`);
  process.exit(1);
});
