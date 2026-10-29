import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";
import { OtherProjects } from "../OtherProjects";

const TITLE = "Health and tech, from the lab to my bedside";

describe("Health and tech aside", () => {
  it("sits between the join and the joined year, as an aside, with the return marker after it", () => {
    render(<App state={{ status: "ready", data: publicData() }} />);
    const aside = screen.getByRole("complementary", { name: TITLE });
    expect(aside.previousElementSibling).toBe(
      screen.getByRole("region", { name: "Joining it" }),
    );
    const back = aside.nextElementSibling as HTMLElement;
    expect(back.tagName).toBe("P");
    expect(back).toHaveTextContent(/^Back to the n-of-1 project$/);
    expect(back.querySelector("a")).toBeNull();
    expect(back.nextElementSibling).toBe(
      screen.getByRole("region", { name: "What a joined year looks like" }),
    );
  });

  it("is one arc in three steps: the lab, me, the bedside", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const aside = screen.getByRole("complementary");
    const lists = within(aside).getAllByRole("list");
    expect(lists).toHaveLength(1);
    expect(lists[0].tagName).toBe("OL");
    const steps = within(lists[0]).getAllByRole("listitem");
    expect(
      steps.map((s) => s.querySelector(".step__label")?.textContent),
    ).toEqual(["In the lab", "On me", "At the bedside"]);
    expect(
      steps.map((s) => s.querySelector(".elsewhere__line")?.textContent),
    ).toEqual([
      "A cancer diagnostics lab, running itself",
      "My own health, in one place",
      "A sunrise lamp for travel",
    ]);
    expect(
      [...aside.querySelectorAll(".elsewhere__em")].map((e) => e.textContent),
    ).toEqual(["cancer diagnostics", "own health", "sunrise lamp"]);
    // Each step is named by its line.
    expect(steps[2]).toHaveAccessibleName("A sunrise lamp for travel");
  });

  it("links the lab and the lamp, and leaves the page's own step unlinked", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const steps = screen.getAllByRole("listitem");
    expect(within(steps[0]).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    expect(within(steps[1]).queryByRole("link")).toBeNull();
    expect(
      within(steps[2]).getByRole("link", { name: "A sunrise lamp for travel" }),
    ).toHaveAttribute("href", "https://www.byahsan.com/projects/wakelight");
  });

  it("keeps the patent wording and points the middle step back up the page", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const [lab, me] = screen.getAllByRole("listitem");
    expect(lab).toHaveTextContent(
      "AI that scores breast cancer slides after chemo. Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center.",
    );
    const meText = me.querySelector(".step__text")?.textContent ?? "";
    expect(meText).toMatch(/^This page is that step/);
    expect(meText).toContain("the strap I hacked");
    expect(meText).toContain("one row per day");
    // The hero already has the counts; this step repeats none of them.
    expect(meText).not.toMatch(/\d/);
  });

  it("drops the old quiet list and ends with the way to byahsan.com", () => {
    const { container } = render(
      <OtherProjects projects={publicData().projects} />,
    );
    expect(container.textContent).not.toMatch(
      /cargo ship|senior living|beehive|smart glasses|todo|placeholder/i,
    );
    const aside = screen.getByRole("complementary");
    const more = within(aside).getAllByRole("link").at(-1);
    expect(more).toHaveTextContent(/^More on byahsan.com$/);
    expect(more).toHaveAttribute("href", "https://www.byahsan.com");
    expect(aside.lastElementChild).toHaveClass("elsewhere__more");
  });

  it("renders the page without projects.json, and drops a wrong one", () => {
    const { projects: _, ...raw } = publicRaw();
    const state = toState(raw);
    expect(state.status).toBe("ready");
    render(<App state={state} />);
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "What a joined year looks like" }),
    ).toBeInTheDocument();
    expect(toState({ ...publicRaw(), projects: { steps: 1 } }).status).toBe(
      "ready",
    );
  });

  it("stops the build when projects.json is there but wrong", () => {
    expect(() =>
      renderPage({ ...publicRaw(), projects: { steps: "x" } }),
    ).toThrow("projects.json does not match the schema");
    expect(renderPage(publicRaw())).toContain(TITLE);
  });
});
