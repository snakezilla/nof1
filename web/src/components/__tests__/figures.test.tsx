import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";
import { FIGURES_MISSING } from "../YearSection";

const ready = () => ({ status: "ready" as const, data: publicData() });

describe("figures on the page", () => {
  it("draws nine figures, each an image with a label and a hidden summary", () => {
    const { container } = render(<App state={ready()} />);
    const images = screen
      .getAllByRole("img")
      .filter((el) => el.classList.contains("fig__drawing"));
    // F8 and F7 (drawn from meta.json), then F1, three F2, F3, F4, F5.
    expect(images).toHaveLength(9);
    images.forEach((img) => {
      expect(img.getAttribute("aria-label")).toBeTruthy();
      const summary = img.nextElementSibling;
      expect(summary).toHaveClass("visually-hidden");
      expect(summary?.textContent).toMatch(/\d/);
    });
    expect(container.querySelectorAll(".fig__caption")).toHaveLength(9);
  });

  it("marks every figure drawn from the masked rows, and none of the source figures", () => {
    const { container } = render(<App state={ready()} />);
    const kickers = [...container.querySelectorAll(".fig__kicker")].map(
      (k) => k.textContent ?? "",
    );
    expect(kickers.slice(0, 2).some((k) => k.startsWith("Masked"))).toBe(false);
    expect(kickers.slice(2)).toHaveLength(7);
    kickers.slice(2).forEach((k) => expect(k).toMatch(/^Masked data\. \S/));
    const part = screen.getByRole("region", {
      name: "What a joined year looks like",
    });
    expect(part.querySelectorAll(".fig__kicker")).toHaveLength(7);
  });

  it("shows the four source counts under the mask note", () => {
    render(<App state={ready()} />);
    const stats = screen.getByRole("list", {
      name: "Where the data came from, in four numbers",
    });
    expect(
      within(stats)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "12apps that wrote to my Health store",
      "267,399records in my Health store",
      "6years covered",
      "1app I wrote to get them out",
    ]);
    expect(stats.previousElementSibling).toHaveClass("mask-note");
  });

  it("draws every night of the year in both orientations, outlining the gaps", () => {
    const { container } = render(<App state={ready()} />);
    const wide = container.querySelector(".cal--wide");
    const tall = container.querySelector(".cal--tall");
    expect(wide?.querySelectorAll(".cal__night")).toHaveLength(240);
    expect(wide?.querySelectorAll(".cal__none")).toHaveLength(125);
    expect(tall?.querySelectorAll("rect")).toHaveLength(365);
    expect(wide?.querySelector(".cal__weekend")).not.toBeNull();
  });

  it("puts a strip plot under each finding's sentence", () => {
    render(<App state={ready()} />);
    const findings = screen
      .getAllByRole("listitem")
      .filter((li) => li.classList.contains("finding"));
    expect(findings).toHaveLength(3);
    findings.forEach((f) => {
      const fig = f.querySelector(".fig--strips");
      expect(fig?.previousElementSibling).toHaveClass("finding__sentence");
      expect(fig?.querySelector(".strip-row__dots.is-accent")).not.toBeNull();
      expect(fig?.querySelector(".strip-row__dots.is-ink")).not.toBeNull();
    });
    expect(screen.getByText("44% under 6 h")).toBeInTheDocument();
  });

  it("puts the typical night and the bedtimes above the protocol", () => {
    const { container } = render(<App state={ready()} />);
    const figs = container.querySelector(".test__figures");
    expect(figs?.nextElementSibling).toHaveClass("test__grid");
    expect(figs?.textContent).toContain("lights out 12:46 am");
    expect(figs?.textContent).toContain("up 7:38 am");
    expect(figs?.textContent).toContain("22 min");
  });

  it("draws December as an outlined row with no readings", () => {
    const { container } = render(<App state={ready()} />);
    const rows = container.querySelectorAll(
      ".months__row:not(.months__head):not(.months__scale)",
    );
    expect(rows).toHaveLength(12);
    const dec = [...rows].find((r) => r.textContent?.startsWith("Dec 24"));
    expect(dec).toHaveClass("is-empty");
    expect(dec?.textContent).toContain("no readings");
    expect(container.querySelector(".fig__legend")?.textContent).toBeTruthy();
    expect(container.textContent).toContain("everything else");
  });

  it("scores every claim in a table, marking only the edge verdict", () => {
    render(<App state={ready()} />);
    const table = screen.getByRole("table", {
      name: /Every claim on this page/,
    });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("5.9 h vs 6.3 h");
    expect(rows[2]).toHaveTextContent("−0.6 to");
    expect(table.querySelectorAll(".verdict.is-edge")).toHaveLength(1);
    expect(table.querySelectorAll(".verdict.is-holds")).toHaveLength(1);
    expect(within(rows[1]).getByRole("link")).toHaveAttribute(
      "href",
      "#finding-rebound",
    );
  });

  it("says one plain sentence when figures.json is missing or wrong", () => {
    const { figures: _drop, ...raw } = publicRaw();
    for (const state of [
      toState(raw),
      toState({ ...raw, figures: { bad: 1 } }),
    ]) {
      const { container, unmount } = render(<App state={state} />);
      expect(screen.getByText(FIGURES_MISSING)).toBeInTheDocument();
      // Only F8 and F7 are left: they are drawn from meta.json, not figures.json.
      expect(container.querySelectorAll(".fig__drawing")).toHaveLength(2);
      expect(
        screen.queryByRole("heading", { name: "Every claim, scored" }),
      ).toBeNull();
      unmount();
    }
  });

  it("pre-renders the figures, and the build refuses a wrong figures.json", () => {
    const html = renderPage(publicRaw());
    expect(html).toContain('class="cal__svg"');
    expect(html).toContain("Every claim, scored");
    expect(() => renderPage({ ...publicRaw(), figures: { bad: 1 } })).toThrow(
      "figures.json",
    );
  });
});
