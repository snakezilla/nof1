import { describe, expect, it } from "vitest";
import {
  breaksCopyRules,
  isProjects,
  parseProjectsOrNull,
  shownItems,
  splitLine,
} from "../projects";
import { publicRaw } from "../../test/fixtures";

const item = {
  id: "bees",
  line: "Managing my beehive with edge compute + infrared",
  emphasis: "edge compute + infrared",
  sub: "A Pi Zero 2 counts bees in and out.",
  href: "https://www.byahsan.com/projects/beecolony",
};
const more = {
  text: "And more on byahsan.com",
  href: "https://www.byahsan.com",
};
const file = (items: unknown[]) => ({ items, more });

describe("projects.json", () => {
  it("accepts the shipped file", () => {
    expect(isProjects(publicRaw().projects)).toBe(true);
  });

  it("shows the filed patent first, with no link, and nothing still a todo", () => {
    const p = parseProjectsOrNull(publicRaw().projects)!;
    expect(p.items.some((i) => i.todo !== undefined)).toBe(false);
    const [patent] = shownItems(p);
    expect(patent).toEqual({
      id: "patent",
      line: "AI that scores breast cancer slides after chemo",
      emphasis: "breast cancer slides",
      sub: "Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center. Pathologists review the cases it is unsure of.",
    });
    // No month, application number, inventor or assignee on the page.
    expect(patent.sub).not.toMatch(
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\d{2}\/\d|inventor|assign/i,
    );
    expect(shownItems(p).map((i) => i.id)).toEqual([
      "patent",
      "delphi",
      "japan",
      "villasola",
      "beecolony",
      "oversite",
    ]);
  });

  it("links only to byahsan.com", () => {
    expect(isProjects(file([{ ...item, href: "https://example.com/x" }]))).toBe(
      false,
    );
    expect(
      isProjects(file([{ ...item, href: "https://www.byahsan.com.evil.io" }])),
    ).toBe(false);
    expect(
      isProjects({ items: [item], more: { ...more, href: "http://x.io" } }),
    ).toBe(false);
  });

  it("needs the accent phrase to be inside the line", () => {
    expect(isProjects(file([{ ...item, emphasis: "radar" }]))).toBe(false);
  });

  it("refuses copy that breaks the page rules or the public-safety words", () => {
    expect(isProjects(file([{ ...item, sub: "Bees — lots" }]))).toBe(false);
    expect(isProjects(file([{ ...item, sub: "Bees!" }]))).toBe(false);
    expect(isProjects(file([{ ...item, sub: "Two pilots so far." }]))).toBe(
      false,
    );
    expect(breaksCopyRules("Our customers love it")).toBe(true);
    expect(breaksCopyRules("A field test with a design partner.")).toBe(false);
  });

  it("allows a todo item to be empty, but a shown item never", () => {
    const todo = {
      id: "p",
      todo: "fill in",
      line: "",
      emphasis: "",
      sub: "",
      href: "",
    };
    expect(isProjects(file([todo, item]))).toBe(true);
    const { todo: _, ...blank } = todo;
    expect(isProjects(file([blank, item]))).toBe(false);
  });

  it("allows an item with no link only when it has a sub-line", () => {
    const { href: _, ...unlinked } = item;
    expect(isProjects(file([unlinked]))).toBe(true);
    expect(isProjects(file([{ ...unlinked, sub: "" }]))).toBe(false);
    expect(isProjects(file([{ ...unlinked, sub: "  " }]))).toBe(false);
    expect(isProjects(file([{ ...item, href: "https://example.com" }]))).toBe(
      false,
    );
    expect(isProjects(file([{ ...unlinked, sub: "Our pilots." }]))).toBe(false);
  });

  it("refuses duplicate ids and a wrong shape", () => {
    expect(isProjects(file([item, item]))).toBe(false);
    expect(parseProjectsOrNull({ items: "many" })).toBeNull();
    expect(parseProjectsOrNull(undefined)).toBeNull();
  });

  it("splits a line around its accent phrase", () => {
    expect(splitLine(item)).toEqual([
      "Managing my beehive with ",
      "edge compute + infrared",
      "",
    ]);
  });
});
