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
const more = { text: "And more on byahsan.com", href: "https://www.byahsan.com" };
const file = (items: unknown[]) => ({ items, more });

describe("projects.json", () => {
  it("accepts the shipped file", () => {
    expect(isProjects(publicRaw().projects)).toBe(true);
  });

  it("keeps the unconfirmed patent item out of the page", () => {
    const p = parseProjectsOrNull(publicRaw().projects)!;
    expect(p.items.some((i) => i.todo !== undefined)).toBe(true);
    expect(shownItems(p).map((i) => i.id)).toEqual([
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
