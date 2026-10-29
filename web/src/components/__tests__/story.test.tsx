import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";

const page = () =>
  render(<App state={{ status: "ready", data: publicData() }} />);

const HERO = "Health and tech, from the lab to my bedside.";
const LABELS = ["In the lab", "On me", "At the bedside", "Next"];
const CHAPTER_TITLES = [
  "A cancer diagnostics lab, running itself",
  "Twelve apps measured me. None of them talked to each other.",
  "A sunrise lamp for travel",
  "Waking up in light sleep",
];

const chapters = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("main > .chapter"),
];

describe("The story", () => {
  it("opens on the h1 with one accent phrase, one deck sentence and no counts", () => {
    page();
    const hero = screen.getByRole("region", { name: HERO });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(HERO);
    expect(hero.querySelectorAll(".hero__em")).toHaveLength(1);
    expect(hero.querySelector(".hero__em")).toHaveTextContent(
      /^Health and tech$/,
    );
    expect(hero.querySelector(".hero__deck")?.textContent).toBe(
      "I build tools for a cancer diagnostics lab, for my own health data and for my bedside.",
    );
    expect(hero.querySelector(".stats, .mask-note")).toBeNull();
    expect(hero.textContent).not.toMatch(/\d/);
  });

  it("indexes the four chapters under the hero, each label linking to its chapter", () => {
    const { container } = page();
    const nav = screen.getByRole("navigation", { name: "Chapters" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual(LABELS);
    links.forEach((a, i) => {
      const target = container.querySelector(a.getAttribute("href")!);
      expect(target).toBe(chapters(container)[i]);
      expect(target?.querySelector(".chapter__label")).toHaveTextContent(
        LABELS[i],
      );
    });
  });

  it("runs lab, me, bedside, next, then the masking note, each chapter under one h2", () => {
    const { container } = page();
    const list = chapters(container);
    expect(list.map((c) => c.querySelector("h2")?.textContent)).toEqual(
      CHAPTER_TITLES,
    );
    list.forEach((c) => expect(c.querySelectorAll("h2")).toHaveLength(1));
    expect(
      [...container.querySelectorAll("main > *")].map(
        (el) => el.id || el.className,
      ),
    ).toEqual([
      "hero",
      "chapter-lab",
      "chapter-me",
      "chapter-bedside",
      "chapter-next",
      "how-the-masking-works",
    ]);
  });

  it("puts the n-of-1 sections inside On me as h3s, in order", () => {
    page();
    const me = screen.getByRole("region", { name: CHAPTER_TITLES[1] });
    expect(
      within(me)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      "Where my data lived",
      "How I got it out",
      "Joining it",
      "What a joined year looks like",
    ]);
  });

  it("drops the aside and the way-back marker", () => {
    const { container } = page();
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(container.textContent).not.toContain("Back to the n-of-1 project");
    expect(container.textContent).not.toContain("This page is that step");
    expect(
      container.querySelector(".elsewhere, .elsewhere__return"),
    ).toBeNull();
  });

  it("says what the lab tools do and keeps the patent wording, linked to the lab page", () => {
    page();
    const lab = screen.getByRole("region", { name: CHAPTER_TITLES[0] });
    expect(within(lab).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    expect(lab).toHaveTextContent(
      "I wrote the tools that take in requisitions, run results into the lab's system and print specimen labels",
    );
    expect(lab).toHaveTextContent(
      "AI that scores breast cancer slides after chemo. Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center.",
    );
  });

  it("pictures the lab with the byahsan.com sketch, drawn in the page's tokens", () => {
    page();
    const lab = screen.getByRole("region", { name: CHAPTER_TITLES[0] });
    const figure = lab.querySelector("figure.sketch");
    expect(figure?.previousElementSibling).toHaveClass("chapter__title");
    expect(within(lab).getByRole("img")).toHaveAccessibleName(
      /hand-drawn sketch of the lab's tools/,
    );
    // A column for phones and a row for wider screens; CSS shows one.
    const svgs = [...lab.querySelectorAll("svg")];
    expect(svgs.map((s) => s.getAttribute("class"))).toEqual([
      "sketch__svg is-column",
      "sketch__svg is-row",
    ]);
    svgs.forEach((svg) => {
      expect(
        [...svg.querySelectorAll(".sketch__name")].map((t) => t.textContent),
      ).toEqual(["Intake", "Calculator", "Reports"]);
      // Token colours only: nothing hard-coded in the drawing.
      expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,6}\b|fill="|stroke="/i);
    });
    expect(figure?.querySelector("figcaption")).toHaveTextContent(
      "Redrawn from my sketch on byahsan.com",
    );
    expect(lab.querySelector("img")).toBeNull();
  });

  it("writes Next as plans, says each plan once, and ends with the way to byahsan.com", () => {
    const { container } = page();
    const next = screen.getByRole("region", { name: CHAPTER_TITLES[3] });
    const text = next.querySelector(".chapter__text")?.textContent ?? "";
    expect(text).toMatch(/^I plan to have the lamp wake me in light sleep/);
    expect(text).toContain(
      "join the raw strap signal, second by second, with the daily rows",
    );
    const more = within(next).getAllByRole("link").at(-1);
    expect(more).toHaveTextContent(/^More on byahsan.com$/);
    expect(more).toHaveAttribute("href", "https://www.byahsan.com");
    const all = container.textContent ?? "";
    expect(all.match(/light sleep/g)).toHaveLength(2);
    expect(all).not.toContain("Next: fuse");
  });

  it("keeps On me when projects.json is missing, and drops the other chapters and their links", () => {
    const { projects: _, ...raw } = publicRaw();
    const { container } = render(<App state={toState(raw)} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(HERO);
    expect(
      within(screen.getByRole("navigation", { name: "Chapters" }))
        .getAllByRole("link")
        .map((a) => a.textContent),
    ).toEqual(["On me"]);
    expect(chapters(container).map((c) => c.id)).toEqual(["chapter-me"]);
    expect(toState({ ...publicRaw(), projects: { steps: 1 } }).status).toBe(
      "ready",
    );
  });

  it("stops the build when projects.json is there but wrong", () => {
    expect(() =>
      renderPage({ ...publicRaw(), projects: { steps: "x" } }),
    ).toThrow("projects.json does not match the schema");
    expect(renderPage(publicRaw())).toContain("sunrise lamp</span> for travel");
  });
});
