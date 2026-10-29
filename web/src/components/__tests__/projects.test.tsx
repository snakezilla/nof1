import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";
import { OtherProjects } from "../OtherProjects";

describe("Other things I'm building", () => {
  it("sits between the join and the joined year, as an aside, with the return marker after it", () => {
    render(<App state={{ status: "ready", data: publicData() }} />);
    const aside = screen.getByRole("complementary", {
      name: "Other things I'm building",
    });
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

  it("sets WakeLight, the lab and the patent large, in that order, then a quiet list of four", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const aside = screen.getByRole("complementary");
    const [large, quiet] = within(aside).getAllByRole("list");
    const leads = within(large).getAllByRole("listitem");
    expect(leads).toHaveLength(3);
    expect(
      leads.map((li) => li.querySelector(".elsewhere__line")?.textContent),
    ).toEqual([
      "A sunrise lamp for travel",
      "A cancer diagnostics lab, running itself",
      "AI that scores breast cancer slides after chemo",
    ]);
    expect(
      [...large.querySelectorAll(".elsewhere__em")].map((e) => e.textContent),
    ).toEqual(["sunrise lamp", "cancer diagnostics", "breast cancer slides"]);
    expect(within(leads[1]).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    // The patent has no link, so it shows its sub-line in place of one.
    expect(within(leads[2]).queryByRole("link")).toBeNull();
    expect(leads[2].querySelector(".elsewhere__sub")).toHaveTextContent(
      "Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center. Pathologists review the cases it is unsure of.",
    );
    expect(aside.querySelectorAll(".elsewhere__sub")).toHaveLength(1);

    expect(quiet).toHaveClass("elsewhere__list--quiet");
    const small = within(quiet).getAllByRole("link");
    expect(small.map((a) => a.textContent)).toEqual([
      "Working on a cargo ship in the Japan Sea",
      "Helping build 198 units of senior living",
      "Managing my beehive with edge compute + infrared",
      "Site inspection through smart glasses",
    ]);
    small.forEach((a) => expect(a).toHaveClass("elsewhere__small"));
    // The quiet list is small and plain: no accent, no Fraunces line, no pictures.
    expect(quiet.querySelectorAll(".elsewhere__em, .elsewhere__line, img, video")).toHaveLength(0);

    const more = within(aside).getAllByRole("link").at(-1);
    expect(more).toHaveTextContent(/^More on byahsan.com$/);
    expect(more).toHaveAttribute("href", "https://www.byahsan.com");
    expect(quiet.nextElementSibling).toHaveClass("elsewhere__more");
  });

  it("never renders an item that still has a todo", () => {
    const { container } = render(
      <OtherProjects projects={publicData().projects} />,
    );
    expect(container.textContent).not.toMatch(
      /placeholder|todo|not confirmed/i,
    );
    // WakeLight plus the six items in projects.json.
    expect(container.querySelectorAll("li")).toHaveLength(7);
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
    expect(toState({ ...publicRaw(), projects: { items: 1 } }).status).toBe(
      "ready",
    );
  });

  it("renders nothing when every item is still a todo", () => {
    const p = publicData().projects!;
    const allTodo = {
      ...p,
      items: p.items.map((i) => ({ ...i, todo: "later" })),
    };
    const { container } = render(<OtherProjects projects={allTodo} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stops the build when projects.json is there but wrong", () => {
    expect(() =>
      renderPage({ ...publicRaw(), projects: { items: "x" } }),
    ).toThrow("projects.json does not match the schema");
    expect(renderPage(publicRaw())).toContain("Other things I&#x27;m building");
  });
});
