import { describe, expect, it } from "vitest";
import {
  breaksCopyRules,
  isProjects,
  parseProjectsOrNull,
  splitLine,
} from "../projects";
import { publicRaw } from "../../test/fixtures";

const step = {
  id: "lab",
  label: "In the lab",
  line: "A cancer diagnostics lab, running itself",
  emphasis: "cancer diagnostics",
  href: "https://www.byahsan.com/projects/delphi",
  text: ["One sentence."],
};
const more = {
  text: "More on byahsan.com",
  href: "https://www.byahsan.com",
};
const file = (steps: unknown[]) => ({ title: "Health and tech", steps, more });

describe("projects.json", () => {
  it("accepts the shipped file", () => {
    expect(isProjects(publicRaw().projects)).toBe(true);
    expect(isProjects(file([step]))).toBe(true);
  });

  it("is three steps, lab to bedside, with the patent in the lab step as filed", () => {
    const p = parseProjectsOrNull(publicRaw().projects)!;
    expect(p.steps.map((s) => s.id)).toEqual(["lab", "me", "bedside"]);
    const patent = p.steps[0].text.join(" ");
    expect(patent).toContain(
      "Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center.",
    );
    // No month, application number, inventor or assignee on the page.
    expect(patent).not.toMatch(
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\d{2}\/\d|inventor|assign/i,
    );
    expect(p.steps.filter((s) => s.media).map((s) => s.id)).toEqual([
      "bedside",
    ]);
  });

  it("links only to byahsan.com, and a step may have no link", () => {
    const { href: _, ...unlinked } = step;
    expect(isProjects(file([unlinked]))).toBe(true);
    expect(isProjects(file([{ ...step, href: "https://example.com/x" }]))).toBe(
      false,
    );
    expect(
      isProjects(file([{ ...step, href: "https://www.byahsan.com.evil.io" }])),
    ).toBe(false);
    expect(
      isProjects({ ...file([step]), more: { ...more, href: "http://x.io" } }),
    ).toBe(false);
  });

  it("needs the accent phrase to be inside the line", () => {
    expect(isProjects(file([{ ...step, emphasis: "radar" }]))).toBe(false);
  });

  it("takes one or two paragraphs per step, never empty", () => {
    expect(isProjects(file([{ ...step, text: ["A.", "B."] }]))).toBe(true);
    expect(isProjects(file([{ ...step, text: [] }]))).toBe(false);
    expect(isProjects(file([{ ...step, text: ["A.", "B.", "C."] }]))).toBe(
      false,
    );
    expect(isProjects(file([{ ...step, text: ["  "] }]))).toBe(false);
    expect(isProjects(file([{ ...step, text: "A." }]))).toBe(false);
  });

  it("takes media only as wakelight, on one step at most", () => {
    const pictured = { ...step, media: "wakelight" };
    expect(isProjects(file([pictured]))).toBe(true);
    expect(isProjects(file([{ ...step, media: "video" }]))).toBe(false);
    expect(isProjects(file([pictured, { ...pictured, id: "b" }]))).toBe(false);
  });

  it("refuses copy that breaks the page rules or the public-safety words", () => {
    expect(isProjects(file([{ ...step, text: ["Labs — lots"] }]))).toBe(false);
    expect(isProjects(file([{ ...step, text: ["Labs!"] }]))).toBe(false);
    expect(isProjects(file([{ ...step, text: ["Two pilots so far."] }]))).toBe(
      false,
    );
    expect(isProjects(file([{ ...step, label: "Now!" }]))).toBe(false);
    expect(isProjects({ ...file([step]), title: "Health — tech" })).toBe(false);
    expect(breaksCopyRules("Our customers love it")).toBe(true);
    expect(breaksCopyRules("A field test with a design partner.")).toBe(false);
  });

  it("refuses duplicate ids, no steps, no title and a wrong shape", () => {
    expect(isProjects(file([step, step]))).toBe(false);
    expect(isProjects(file([]))).toBe(false);
    expect(isProjects({ steps: [step], more })).toBe(false);
    expect(parseProjectsOrNull({ steps: "many" })).toBeNull();
    expect(parseProjectsOrNull(undefined)).toBeNull();
  });

  it("splits a line around its accent phrase", () => {
    expect(splitLine(step)).toEqual([
      "A ",
      "cancer diagnostics",
      " lab, running itself",
    ]);
  });
});
