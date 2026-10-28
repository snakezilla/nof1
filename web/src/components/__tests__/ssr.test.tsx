import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import App from "../../App";
import { embedJson, readEmbedded } from "../../lib/dataset";
import {
  assertMasked,
  description,
  heroSentence,
  render,
  renderOg,
} from "../../entry-server";
import { publicRaw } from "../../test/fixtures";

describe("prerender", () => {
  it("renders the whole page to a string", () => {
    const html = render(publicRaw());
    expect(html).toContain(
      '<span class="hero__figure">Twelve</span> apps measured me.',
    );
    expect(html).toContain("Weekends cost me 24 minutes of sleep.");
    expect(html).toContain("Three findings");
    expect(html).toContain("Show all 60 nights");
    expect(html.replace(/<[^>]+>/g, " ")).not.toMatch(/\bnone\b/);
    expect(html).toContain("Masked data.");
  });

  it("refuses to render when the data shape is wrong, so the build fails", () => {
    expect(() => render({ ...publicRaw(), test: {} })).toThrow("test.json");
  });

  it("hydrates the server markup without a mismatch", async () => {
    const raw = publicRaw();
    const root = document.createElement("div");
    root.innerHTML = render(raw);
    document.body.append(root);
    const data = document.createElement("script");
    data.id = "nof1-data";
    data.type = "application/json";
    data.textContent = embedJson(raw);
    document.body.append(data);

    const state = readEmbedded(document);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(root, <App state={state!} />, {
        onRecoverableError: recoverable,
      });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    root.remove();
    data.remove();
  });

  it("builds the social card and the alt text from the data", () => {
    expect(heroSentence(publicRaw())).toBe(
      "Twelve apps measured me. None of them talked to each other.",
    );
    expect(description(publicRaw())).toBe(
      "Twelve apps measured me. None of them talked to each other. How I got my health data out of each app and joined it into one row per day.",
    );
    expect(description(publicRaw()).length).toBeLessThanOrEqual(160);
    expect(renderOg(publicRaw())).toMatch(/^<!doctype html><html lang="en">/);
  });

  it("refuses to publish unless prep/ masked the data", () => {
    expect(() => assertMasked(publicRaw())).not.toThrow();
    const { mask: _, ...raw } = publicRaw();
    expect(() => assertMasked(raw)).toThrow("mask.json");
    expect(() =>
      assertMasked({ ...publicRaw(), mask: { masked: false } }),
    ).toThrow("mask.json");
    const meta = { ...(publicRaw().meta as object), masked: false };
    expect(() => assertMasked({ ...publicRaw(), meta })).toThrow("meta.json");
    expect(() => render({ ...publicRaw(), mask: { masked: "yes" } })).toThrow(
      "mask.json does not match the schema",
    );
  });

  it("puts the headline on the social card", () => {
    const og = renderOg(publicRaw());
    expect(og).toContain("<span>Twelve</span> apps measured me.");
    expect(og).toContain("health values masked");
  });
});
