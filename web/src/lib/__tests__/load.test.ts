import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fetchJson, loadDataset } from "../load";
import { rawFixtures } from "../../test/fixtures";

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });

const fixtureFetch = (url: string) => {
  const name = url
    .split("/")
    .pop()
    ?.replace(".json", "") as keyof typeof rawFixtures;
  return Promise.resolve(ok(rawFixtures[name]));
};

describe("fetchJson", () => {
  it("throws on a non-2xx status", async () => {
    await expect(
      fetchJson(
        () => Promise.resolve(new Response("", { status: 404 })),
        "/data/x.json",
      ),
    ).rejects.toThrow("/data/x.json returned 404");
  });

  it("throws on invalid JSON", async () => {
    await expect(
      fetchJson(() => Promise.resolve(new Response("<html>")), "/data/x.json"),
    ).rejects.toThrow("not valid JSON");
  });
});

describe("loadDataset", () => {
  it("loads and validates all four files", async () => {
    const data = await loadDataset(fixtureFetch, "/data");
    expect(data.patterns).toHaveLength(3);
    expect(data.meta.repo).toMatch(/^https:/);
  });

  it("loads figures.json when it is there, and renders without it when it is not", async () => {
    const figures = JSON.parse(
      readFileSync(join(process.cwd(), "public/data/figures.json"), "utf8"),
    );
    const withFigures = (url: string) =>
      url.endsWith("figures.json")
        ? Promise.resolve(ok(figures))
        : fixtureFetch(url);
    expect((await loadDataset(withFigures)).figures?.claims).toHaveLength(3);
    const missing = (url: string) =>
      url.endsWith("figures.json")
        ? Promise.resolve(new Response("", { status: 404 }))
        : fixtureFetch(url);
    expect((await loadDataset(missing)).figures).toBeNull();
  });

  it("rejects when one file has the wrong shape", async () => {
    const bad = (url: string) =>
      url.endsWith("meta.json") ? Promise.resolve(ok({})) : fixtureFetch(url);
    await expect(loadDataset(bad)).rejects.toThrow(/meta.json/);
  });
});
