import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";
import { FIGURES_MISSING } from "../YearSection";

const ready = () => ({ status: "ready" as const, data: publicData() });

describe("figures on the page", () => {
  it("draws six figures, each an image with a label and a hidden summary", () => {
    const { container } = render(<App state={ready()} />);
    const images = screen
      .getAllByRole("img")
      .filter((el) => el.classList.contains("fig__drawing"));
    // F8 and F7 (drawn from meta.json), then F1 and three F2.
    expect(images).toHaveLength(6);
    images.forEach((img) => {
      expect(img.getAttribute("aria-label")).toBeTruthy();
      const summary = img.nextElementSibling;
      expect(summary).toHaveClass("visually-hidden");
      expect(summary?.textContent).toMatch(/\d/);
    });
    // The strip plots carry no caption; their rows say the mean and the share under 6 h.
    expect(container.querySelectorAll(".fig__caption")).toHaveLength(3);
  });

  it("says the data is masked once, at the head of the joined year, and on no figure", () => {
    const { container } = render(<App state={ready()} />);
    expect(container.querySelectorAll(".fig__kicker")).toHaveLength(0);
    const part = screen.getByRole("region", {
      name: "What a joined year looks like",
    });
    expect(part.querySelector("h3")?.nextElementSibling).toHaveTextContent(
      /^Masked data\.$/,
    );
    expect(container.textContent?.match(/Masked data\./g)).toHaveLength(1);
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
    const source = stats.nextElementSibling as HTMLElement;
    expect(source).toHaveClass("intro__source");
    expect(source.firstElementChild).toHaveTextContent(
      /^May 2024 to April 2025$/,
    );
    const flow = within(source).getByRole("list", {
      name: "How the data got here: WHOOP strap, which I also hacked to read the raw signal over Bluetooth, then Apple Health, then an export app I wrote, then this page",
    });
    expect(flow.tagName).toBe("OL");
    expect(
      within(flow)
        .getAllByRole("listitem")
        .map((li) => li.textContent),
    ).toEqual([
      "WHOOP strapHacked: raw signal over Bluetooth",
      "Apple Health",
      "Export app I wrote",
      "This page",
    ]);
    // Three drawn arrows, hidden from screen readers; no arrow glyphs in the text.
    const arrows = flow.querySelectorAll(".flow__arrow");
    expect(arrows).toHaveLength(3);
    arrows.forEach((a) => expect(a).toHaveAttribute("aria-hidden", "true"));
    expect(source.textContent).not.toContain("→");
    expect(
      [...flow.querySelectorAll(".flow__label.is-mine")].map(
        (l) => l.textContent,
      ),
    ).toEqual(["Export app I wrote"]);
    // One branch, under the strap only: a muted note, not a step with a box.
    const branches = flow.querySelectorAll(".flow__branch");
    expect(branches).toHaveLength(1);
    expect(branches[0].closest("li")).toBe(flow.firstElementChild);
    expect(branches[0].querySelector(".flow__label")).toBeNull();
    expect(branches[0]).toHaveTextContent(
      /^Hacked: raw signal over Bluetooth$/,
    );
    expect(flow.nextElementSibling).toHaveTextContent(
      /^How the data got here$/,
    );
    expect(
      within(source).getByRole("link", { name: "How the data got here" }),
    ).toHaveAttribute("href", "#how-i-got-it-out");
    expect(document.getElementById("how-i-got-it-out")).not.toBeNull();
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

  it("gives each finding a title, a strip plot and one line with the verdict", () => {
    render(<App state={ready()} />);
    const findings = screen
      .getAllByRole("listitem")
      .filter((li) => li.classList.contains("finding"));
    expect(findings).toHaveLength(3);
    findings.forEach((f) => {
      const fig = f.querySelector(".fig--strips");
      expect(fig?.previousElementSibling?.tagName).toBe("H4");
      expect(fig?.nextElementSibling).toHaveClass("finding__line");
      expect(fig?.querySelector(".strip-row__dots.is-accent")).not.toBeNull();
      expect(fig?.querySelector(".strip-row__dots.is-ink")).not.toBeNull();
      expect(
        f.querySelectorAll("p:not(.visually-hidden):not(.fig__legend)").length,
      ).toBeLessThanOrEqual(f.querySelectorAll(".strip-row p").length + 1);
    });
    expect(
      findings.map((f) => f.querySelector(".finding__line")?.textContent),
    ).toEqual([
      "5.9 h vs 6.3 h, difference −0.4 h, 95% interval −0.8 to 0.0 h: at the edge.",
      "5.7 h vs 6.4 h, difference −0.7 h, 95% interval −1.2 to −0.3 h: holds.",
      "6.0 h vs 6.2 h, difference −0.2 h, 95% interval −0.6 to +0.1 h: not shown.",
    ]);
    expect(document.querySelectorAll(".verdict.is-edge")).toHaveLength(1);
    expect(document.querySelectorAll(".verdict.is-holds")).toHaveLength(1);
    expect(screen.getByText("44% under 6 h")).toBeInTheDocument();
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
      expect(container.querySelectorAll(".finding__line")).toHaveLength(3);
      unmount();
    }
  });

  it("pre-renders the figures, and the build refuses a wrong figures.json", () => {
    const html = renderPage(publicRaw());
    expect(html).toContain('class="cal__svg"');
    expect(html).toContain('class="finding__line"');
    expect(() => renderPage({ ...publicRaw(), figures: { bad: 1 } })).toThrow(
      "figures.json",
    );
  });
});
