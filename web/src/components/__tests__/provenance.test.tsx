import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { toState } from "../../lib/dataset";
import { render as renderPage } from "../../entry-server";
import { publicRaw } from "../../test/fixtures";

const withMeta = (meta: unknown) => toState({ ...publicRaw(), meta });

describe("Sources, joining and masking", () => {
  it("opens On me with the sources, then the mask note with its link to the end of the page", () => {
    render(<App state={toState(publicRaw())} />);
    const hero = screen.getByRole("region", {
      name: "Twelve apps measured me. None of them talked to each other.",
    });
    expect(hero.querySelector(".intro__deck")?.textContent).toBe(
      "WHOOP had my sleep, Strava my rides, my phone my steps, a scale my weight. I got them out and joined them into one row per day.",
    );
    const note = hero.querySelector(".mask-note");
    expect(note?.querySelector(".mask-note__label")).toHaveTextContent(
      /^Masked$/,
    );
    expect(note).toHaveTextContent(
      "Health numbers here are masked with a private seed; apps, counts and dates are real. How the masking works",
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
    const paras = section.querySelectorAll("p");
    expect(paras).toHaveLength(1);
    expect(paras[0].textContent).toBe(
      "Each day's values are multiplied or shifted by random amounts drawn from a private seed: one per day, one per month and one for the whole year. The seed stays on my machine, so the shifts cannot be undone.",
    );
    expect(within(section).queryAllByRole("listitem")).toHaveLength(0);
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
      "609,918 lines in the raw export.",
      "363,564 repeats across sync batches, matched by sample ID.",
      "One stream dropped for the wrong units.",
      "One row per day: 365 days.",
    ]);
    // What comes next is said once, in the Next chapter.
    expect(section).not.toHaveTextContent(/next/i);
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
      "One bar per app, first record to last; the shaded band is the year joined here.",
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
    expect(heading.nextElementSibling?.textContent).toBe(
      "I also built a Bluetooth reader on an open-source decoder to get the raw signal off the strap: 66,658 readings in one night, one a second. It is not joined yet.",
    );
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
    const tables = within(section).getAllByRole("table");
    expect(tables).toHaveLength(1);
    const table = tables[0];
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
    expect(table.nextElementSibling).toHaveTextContent(
      /^Dropped: one stream with the wrong units, and nights under an hour\.$/,
    );
    expect(section).not.toHaveTextContent("Left out, and why");
    expect(section).not.toHaveTextContent("Why through Apple Health");
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
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "My apps measured me. None of them talked to each other.",
        }),
      ).toBeInTheDocument();
      unmount();
    });
  });
});
