import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { render as renderPage } from "../../entry-server";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw } from "../../test/fixtures";
import { OtherProjects } from "../OtherProjects";

describe("Other things I'm building", () => {
  it("sits directly before the three findings, as an aside", () => {
    render(<App state={{ status: "ready", data: publicData() }} />);
    const aside = screen.getByRole("complementary", {
      name: "Other things I'm building",
    });
    const findings = screen.getByRole("heading", { name: "Three findings" });
    expect(aside.nextElementSibling).toBe(findings.closest("section"));
  });

  it("shows the five byahsan.com lines, each a link, then the way to the rest", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const aside = screen.getByRole("complementary");
    const links = within(aside).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "A cancer diagnostics lab, running itself",
      "Working on a cargo ship in the Japan Sea",
      "Helping build 198 units of senior living",
      "Managing my beehive with edge compute + infrared",
      "Site inspection through smart glasses",
      "And more on byahsan.com",
    ]);
    expect(links[0]).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/delphi",
    );
    expect(links.at(-1)).toHaveAttribute("href", "https://www.byahsan.com");
    expect(aside.querySelectorAll(".elsewhere__em")[0]).toHaveTextContent(
      /^cancer diagnostics$/,
    );
    expect(aside.querySelectorAll("img")).toHaveLength(0);
  });

  it("never renders an item that still has a todo", () => {
    const { container } = render(
      <OtherProjects projects={publicData().projects} />,
    );
    expect(container.textContent).not.toMatch(/placeholder|todo|not confirmed/i);
    expect(container.querySelectorAll("li")).toHaveLength(5);
  });

  it("renders the page without projects.json, and drops a wrong one", () => {
    const { projects: _, ...raw } = publicRaw();
    const state = toState(raw);
    expect(state.status).toBe("ready");
    render(<App state={state} />);
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByText("Three findings")).toBeInTheDocument();
    expect(
      toState({ ...publicRaw(), projects: { items: 1 } }).status,
    ).toBe("ready");
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
