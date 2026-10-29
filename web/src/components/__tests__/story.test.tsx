import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";

const page = () =>
  render(<App state={{ status: "ready", data: publicData() }} />);

const HERO = "Health and tech, from the lab to my bedside.";
const LABELS = ["In the lab", "On me", "At the bedside"];
const CHAPTER_TITLES = [
  "A cancer diagnostics lab, running itself",
  "Twelve apps measured me. None of them talked to each other.",
  "A sunrise lamp for travel",
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

  it("indexes the three chapters under the hero, each label linking to its chapter", () => {
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

  it("runs lab, me, bedside, each chapter under one h2, and nothing after them", () => {
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
    ]);
    expect(container.querySelector("#how-the-masking-works")).toBeNull();
  });

  it("cuts On me to the mask note, the funnel and three result lines", () => {
    const { container } = page();
    const me = screen.getByRole("region", { name: CHAPTER_TITLES[1] });
    expect([...me.children].map((c) => c.className)).toEqual([
      "chapter__label",
      "chapter__title",
      "mask-note",
      "fig diagram diagram--funnel",
      "results",
    ]);
    expect(within(me).queryAllByRole("heading", { level: 3 })).toHaveLength(0);
    [
      "Where my data lived",
      "How I got it out",
      "Joining it",
      "What a joined year looks like",
      "The raw signal",
      "WHOOP had my sleep",
    ].forEach((cut) => expect(container.textContent).not.toContain(cut));
    expect(
      container.querySelector(
        ".stats, .flow, .years, .pipe, .sources, .cal, .strip-row, .findings, .intro",
      ),
    ).toBeNull();
  });

  it("draws the funnel: the twelve apps, WHOOP hacked, Apple Health, my export app, one row per day", () => {
    page();
    const me = screen.getByRole("region", { name: CHAPTER_TITLES[1] });
    const img = within(me).getByRole("img", {
      name: /health apps feeding Apple Health/,
    });
    const words = img.textContent ?? "";
    [
      "WHOOP",
      "Strava",
      "Garmin Connect",
      "Wim Hof Method",
      "Apple Health",
      "Export app",
      "One row per day",
      "267,399",
      "363,564",
      "365 days",
    ].forEach((w) => expect(words).toContain(w));
    expect(words).toMatch(/hacked: raw signal/);
    expect(img.nextElementSibling).toHaveClass("visually-hidden");
    expect(img.nextElementSibling?.textContent).toMatch(
      /^12 apps wrote into Apple Health/,
    );
  });

  it("says the three findings as short lines with their verdict words", () => {
    page();
    const list = screen.getByRole("list", {
      name: "What the joined year showed",
    });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => [
          li.querySelector(".results__claim")?.textContent,
          li.querySelector(".verdict")?.textContent,
        ]),
    ).toEqual([
      ["Weekends cost me 24 minutes of sleep", "at the edge"],
      ["I do not catch up the next night", "holds"],
      ["Training days do not cost sleep", "not shown"],
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

  it("puts two sentences under the lab diagram, the patent word for word, linked to the lab page", () => {
    page();
    const lab = screen.getByRole("region", { name: CHAPTER_TITLES[0] });
    expect(within(lab).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    const texts = [...lab.querySelectorAll(".chapter__text")];
    expect(texts).toHaveLength(1);
    expect(texts[0].textContent).toBe(
      "I wrote the lab's tools, and I built an AI that scores breast cancer slides after chemo. Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center.",
    );
  });

  it("leads the lab with one diagram in two lanes, drawn in the page's tokens", () => {
    page();
    const lab = screen.getByRole("region", { name: CHAPTER_TITLES[0] });
    const figure = lab.querySelector("figure.diagram--lab");
    expect(figure?.previousElementSibling).toHaveClass("chapter__title");
    const img = within(lab).getByRole("img", { name: /two lanes/ });
    expect(img.nextElementSibling?.textContent).toMatch(/Lane one.*Lane two/);
    // A column for phones and a row for wider screens; CSS shows one.
    const svgs = [...lab.querySelectorAll("svg")];
    expect(svgs.map((s) => s.getAttribute("class"))).toEqual([
      "scene is-column",
      "scene is-row",
    ]);
    svgs.forEach((svg) => {
      expect(
        [...svg.querySelectorAll(".scene__name")].map((t) => t.textContent),
      ).toEqual([
        "Intake",
        "Calculator",
        "Reports",
        "AI scores it",
        "Report",
        "Pathologist",
      ]);
      expect(svg.textContent).toContain("runs itself");
      expect(svg.textContent).toContain("if confident");
      expect(svg.textContent).toContain("if unsure");
      // Token colours only: nothing hard-coded in the drawing.
      expect(svg.outerHTML).not.toMatch(/#[0-9a-f]{3,6}\b|fill="|stroke="/i);
    });
    expect(lab.textContent).not.toContain("Redrawn from my sketch");
    expect(lab.querySelector("img, figcaption")).toBeNull();
  });

  it("has no Next chapter, says light sleep as done, and moves the way to byahsan.com into the footer", () => {
    const { container } = page();
    expect(container.querySelector("#chapter-next")).toBeNull();
    expect(container.textContent).not.toContain("Waking up in light sleep");
    expect(container.textContent).not.toMatch(/I plan to/);
    const more = within(container.querySelector("footer")!).getByRole("link", {
      name: "More on byahsan.com",
    });
    expect(more).toHaveAttribute("href", "https://www.byahsan.com");
  });

  it("says everything as built: no building, adding, on paper, will, next step or plan", () => {
    const { container } = page();
    const said = [
      container.textContent ?? "",
      ...[...container.querySelectorAll("[aria-label], [alt]")].map(
        (el) => `${el.getAttribute("aria-label") ?? ""} ${el.getAttribute("alt") ?? ""}`,
      ),
    ].join(" ");
    expect(said).not.toMatch(
      /\b(building|adding|on paper|will|plan|plans|planned|rendered|render)\b|I'm|next (step|version|chapter)/i,
    );
    expect(said).toContain("I built an AI that scores breast cancer slides");
    expect(said).toContain("It moves with organic, cartoon-like motion");
    expect(said).toContain("Slide-scoring AI I built");
    expect(said).toContain("fold-out version reaches 10,000 lux");
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
