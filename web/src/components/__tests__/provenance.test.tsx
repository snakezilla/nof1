import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { toState } from "../../lib/dataset";
import { render as renderPage } from "../../entry-server";
import { publicRaw } from "../../test/fixtures";

const withMeta = (meta: unknown) => toState({ ...publicRaw(), meta });

describe("Sources, joining and masking", () => {
  it("leads with the sources, then the mask note with its link to the end of the page", () => {
    render(<App state={toState(publicRaw())} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Twelve apps measured me. None of them talked to each other.",
    );
    const hero = screen.getByRole("region", { name: "Summary" });
    expect(hero.querySelector(".hero__deck")?.textContent).toBe(
      "WHOOP had my sleep. Strava had my rides. My phone had my steps. A scale had my weight. Each kept its own piece. I got them out and joined them into one row per day. This page shows how.",
    );
    const note = hero.querySelector(".mask-note");
    expect(note?.querySelector(".mask-note__label")).toHaveTextContent(
      /^Masked$/,
    );
    expect(note).toHaveTextContent(
      "The health numbers on this page are not my real ones. Each day's values are shifted by a random amount from a private seed. The apps, record counts and dates are real. How the masking works",
    );
    const link = screen.getByRole("link", { name: "How the masking works" });
    expect(link).toHaveAttribute("href", "#how-the-masking-works");
    expect(document.getElementById("how-the-masking-works")).not.toBeNull();
  });

  it("makes no masked claim when mask.json is missing", () => {
    const { mask: _, ...raw } = publicRaw();
    const { container } = render(<App state={toState(raw)} />);
    expect(container.querySelector(".mask-note")).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "How the masking works" }),
    ).toBeNull();
    expect(container.textContent).not.toContain("Masked data.");
    expect(container.textContent).not.toContain("masked with a private seed");
  });

  it("explains the masking from mask.json at the end, before the footer", () => {
    render(<App state={toState(publicRaw())} />);
    const section = screen.getByRole("region", {
      name: "How the masking works",
    });
    expect(section).toHaveTextContent(
      "The health numbers on this page are masked: each day's values are multiplied or shifted by random amounts drawn from a private seed: one per day, one per month and one for the whole year.",
    );
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "Sleep: ×0.85 to ×1.15 per day, ×0.93 to ×1.07 per month, ×0.85 to ×1.15 for the whole year",
      "Bedtime: plus or minus 45 min per day, 20 min per month, 45 min for the whole year",
      "Awake and training minutes: ×0.7 to ×1.3 per day, ×0.75 to ×1.25 for the whole year",
    ]);
    expect(section).toHaveTextContent(
      "Real, not masked: which apps, what they wrote, record counts, dates; which days have data; workout types.",
    );
    expect(section.nextElementSibling).toBeNull();
  });

  it("joins the streams with the counts from meta.json", () => {
    render(<App state={toState(publicRaw())} />);
    const section = screen.getByRole("region", { name: "Joining it" });
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "609,918 lines in the raw export, 363,564 of them repeats across sync batches, matched by sample ID.",
      "On nights where two apps recorded sleep, the one with the most minutes asleep wins.",
      "One stream was dropped because its units did not match.",
      "Result: one row per day, 365 days.",
    ]);
    expect(section).toHaveTextContent(
      "Next: fuse the raw strap signal, a second each, with the daily rows.",
    );
  });

  it("draws where each source lived, with the window shaded", () => {
    render(<App state={toState(publicRaw())} />);
    const section = screen.getByRole("region", { name: "Where my data lived" });
    const rows = section.querySelectorAll(".years__row");
    expect(rows).toHaveLength(14);
    expect(
      [...rows]
        .slice(0, 3)
        .map((r) => r.querySelector(".years__name")?.textContent),
    ).toEqual(["Strava", "WHOOP", "SnoreLab"]);
    expect(section.querySelectorAll(".years__row.is-used")).toHaveLength(3);
    expect(section.querySelectorAll(".years__row.is-excluded")).toHaveLength(1);
    expect(section.querySelectorAll(".years__band")).toHaveLength(14);
    expect(section).toHaveTextContent(
      "Each app kept its own years. The page uses the one year where WHOOP, Strava and SnoreLab overlap.",
    );
    expect(within(section).getByRole("img")).toHaveAccessibleName(
      "When each app wrote to my Health store, 2020 to 2026",
    );
  });

  it("puts the three steps straight under the title, before the figure", () => {
    render(<App state={toState(publicRaw())} />);
    const title = screen.getByRole("heading", {
      name: "How I got it out",
    });
    const list = title.nextElementSibling;
    expect(list?.tagName).toBe("OL");
    expect(
      within(list as HTMLElement)
        .getAllByRole("listitem")
        .map((li) => li.textContent?.split(".")[0]),
    ).toEqual([
      "The strap measures",
      "I wrote an iPhone app, HealthExporter",
      "Python on my Mac turns those files into one row per day",
    ]);
    expect(list?.nextElementSibling).toHaveClass("fig--pipe");
  });

  it("shows the raw signal with the counts from raw-stream.json", () => {
    render(<App state={toState(publicRaw())} />);
    const heading = screen.getByRole("heading", { name: "The raw signal" });
    const text = heading.nextElementSibling?.textContent ?? "";
    expect(text).toContain(
      "One night of it: 66,658 readings in 18 hours, one a second: heart rate, beat-to-beat intervals on 38,917 of them, skin temperature and motion.",
    );
    expect(text).toMatch(/Next: make it run every night\.$/);
    expect(screen.queryByText(/I also read the strap directly/)).toBeNull();
  });

  it("drops the raw signal when raw-stream.json is missing or wrong", () => {
    const { raw_stream: _, ...raw } = publicRaw();
    [
      toState(raw),
      toState({ ...raw, raw_stream: { readings: "many" } }),
    ].forEach((state) => {
      const { unmount } = render(<App state={state} />);
      expect(
        screen.queryByRole("heading", { name: "The raw signal" }),
      ).toBeNull();
      expect(
        screen.getByRole("heading", { name: "How I got it out" }),
      ).toBeInTheDocument();
      unmount();
    });
  });

  it("fails the build when raw-stream.json is there but wrong", () => {
    expect(() =>
      renderPage({ ...publicRaw(), raw_stream: { readings: -1 } }),
    ).toThrow("raw-stream.json does not match the schema");
    const { raw_stream: _, ...raw } = publicRaw();
    expect(() => renderPage(raw)).not.toThrow();
  });

  it("draws the pipeline as one image with a summary, and the sources as a table", () => {
    render(<App state={toState(publicRaw())} />);
    const section = screen.getByRole("region", {
      name: "How I got it out",
    });
    const img = within(section).getByRole("img");
    expect(img).toHaveAccessibleName(
      "How the data got from the strap to this page",
    );
    expect(img.querySelectorAll("svg")).toHaveLength(3);
    expect(img.querySelectorAll(".pipe__wire.is-dashed")).toHaveLength(3);
    expect(img.querySelectorAll(".pipe__node.is-mine")).toHaveLength(3);
    const table = within(section).getAllByRole("table")[0];
    expect(
      within(table)
        .getAllByRole("row")
        .map((r) => r.querySelector("th")?.textContent),
    ).toEqual(["App", "WHOOP", "Strava", "SnoreLab", "HealthExporter, mine"]);
    expect(img.querySelector(".is-wide .pipe__node.is-mine")).toHaveTextContent(
      "HealthExporter, I wrote it",
    );
    expect(
      img.querySelector(".is-wide .pipe__node.is-excluded"),
    ).toHaveTextContent("raw signal, one night, not used yet");
    expect(
      within(section).getByRole("link", { name: "github.com/snakezilla/nof1" }),
    ).toHaveAttribute("href", "https://github.com/snakezilla/nof1");
    expect(section).toHaveTextContent(
      "Every cut is code: prep/load.py in github.com/snakezilla/nof1.",
    );
    expect(section).toHaveTextContent("Left out, and why");
    expect(section.textContent).not.toMatch(/hack/i);
  });

  it("says one plain sentence when provenance is missing or wrong", () => {
    const { provenance: _, ...meta } = publicRaw().meta as Record<
      string,
      unknown
    >;
    [meta, { ...meta, provenance: { hub: 3 } }].forEach((m) => {
      const { unmount } = render(<App state={withMeta(m)} />);
      const section = screen.getByRole("region", {
        name: "How I got it out",
      });
      expect(section).toHaveTextContent(
        "Could not read where the data comes from. The repo has the raw JSON.",
      );
      expect(
        screen.queryByRole("region", { name: "Where my data lived" }),
      ).toBeNull();
      expect(screen.queryByRole("region", { name: "Joining it" })).toBeNull();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "My apps measured me. None of them talked to each other.",
      );
      unmount();
    });
  });
});
