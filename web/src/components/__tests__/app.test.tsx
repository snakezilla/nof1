import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { Loader } from "../../Loader";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw, rawFixtures } from "../../test/fixtures";

const ready = () => ({ status: "ready" as const, data: publicData() });

afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("puts the sources first, then how I got it out, the join, the joined year, and the masking", () => {
    render(<App state={ready()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Twelve apps measured me. None of them talked to each other.",
    );
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "Where my data lived",
      "How I got it out",
      "Joining it",
      "What a joined year looks like",
      "How the masking works",
    ]);
    const part = screen.getByRole("region", {
      name: "What a joined year looks like",
    });
    expect(
      within(part)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([
      "A year of nights",
      "Three findings",
      "The test",
      "The nights",
      "Every claim, scored",
    ]);
  });

  it("titles the first finding with its number, from the masked data", () => {
    render(<App state={ready()} />);
    expect(screen.getAllByRole("heading", { level: 4 })[0]).toHaveTextContent(
      "Weekends cost me 24 minutes of sleep.",
    );
  });

  it("prints no 'none', no negative zero and no hyphen minus signs", () => {
    const { container } = render(<App state={ready()} />);
    // The headline says "None of them"; nothing else may read "none".
    const text = (container.textContent ?? "").replace(
      "None of them talked",
      "",
    );
    expect(text).not.toMatch(/\bnone\b/i);
    expect(text).not.toMatch(/[-−]0\.0(?!\d)/);
    expect(text).not.toMatch(/(^|[\s(])-\d/);
    // The Mindful column is gone; the one allowed use is Balance's reason in the sources table.
    expect(text).not.toMatch(
      /Mindful(?! minutes on \d+ days, too few to show)/,
    );
    expect(text).not.toContain("—");
    expect(text).not.toContain("!");
  });

  it("shows the protocol as a numbered list with no fake controls", () => {
    render(<App state={ready()} />);
    const protocol = screen.getByText(/Protocol/).nextElementSibling;
    expect(protocol?.tagName).toBe("OL");
    expect(within(protocol as HTMLElement).queryAllByRole("checkbox")).toEqual(
      [],
    );
  });

  it("states the data-shape error in a plain sentence", () => {
    render(
      <App state={toState({ ...publicRaw(), patterns: { not: "a list" } })} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Could not read the data files. The repo has the raw JSON.",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "patterns.json: expected an array",
    );
  });
});

describe("Loader (dev path)", () => {
  const respond = (body: unknown, status = 200) =>
    Promise.resolve(new Response(JSON.stringify(body), { status }));

  it("fetches the files, then renders the page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const name = url
          .split("/")
          .pop()
          ?.replace(".json", "") as keyof typeof rawFixtures;
        return respond(rawFixtures[name]);
      }),
    );
    render(<Loader base="/data" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(
      await screen.findByRole("heading", { name: "The nights" }),
    ).toBeInTheDocument();
  });

  it("shows the error when a file is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => respond({}, 404)),
    );
    render(<Loader base="/data" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "/data/daily.json returned 404",
    );
  });
});
