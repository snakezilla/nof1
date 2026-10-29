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

  it("shows the patent first with its sub-line and no link, then five byahsan.com links", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const aside = screen.getByRole("complementary");
    const items = within(aside).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    expect(within(items[0]).queryByRole("link")).toBeNull();
    expect(items[0].querySelector(".elsewhere__line")).toHaveTextContent(
      "AI that scores breast cancer slides after chemo",
    );
    expect(items[0].querySelector(".elsewhere__em")).toHaveTextContent(
      /^breast cancer slides$/,
    );
    expect(items[0].querySelector(".elsewhere__sub")).toHaveTextContent(
      "Provisional patent filed 2026, in collaboration with MD Anderson Cancer Center. Pathologists review the cases it is unsure of.",
    );
    const links = within(aside).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "A cancer diagnostics lab, running itself",
      "Working on a cargo ship in the Japan Sea",
      "Helping build 198 units of senior living",
      "Managing my beehive with edge compute + infrared",
      "Site inspection through smart glasses",
      "A sunrise lamp for travel",
      "More on byahsan.com",
    ]);
    expect(links[0]).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    expect(links.at(-1)).toHaveAttribute("href", "https://www.byahsan.com");
    expect(aside.querySelectorAll(".elsewhere__em")[1]).toHaveTextContent(
      /^cancer diagnostics$/,
    );
    // Only WakeLight, after the list, carries pictures.
    expect(aside.querySelectorAll(".elsewhere__list img")).toHaveLength(0);
    // Only the unlinked patent item carries a sub-line.
    expect(aside.querySelectorAll(".elsewhere__sub")).toHaveLength(1);
  });

  it("never renders an item that still has a todo", () => {
    const { container } = render(
      <OtherProjects projects={publicData().projects} />,
    );
    expect(container.textContent).not.toMatch(
      /placeholder|todo|not confirmed/i,
    );
    expect(container.querySelectorAll("li")).toHaveLength(6);
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
