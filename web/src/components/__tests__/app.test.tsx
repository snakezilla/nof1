import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../App";
import { Loader } from "../../Loader";
import { toState } from "../../lib/dataset";
import { publicData, publicRaw, rawFixtures } from "../../test/fixtures";

const ready = () => ({ status: "ready" as const, data: publicData() });

afterEach(() => vi.unstubAllGlobals());

/** One story: a chapter title per stop, then the masking note, and no other h2s. */
const KEPT_H2S = [
  "A cancer diagnostics lab, running itself",
  "Twelve apps measured me. None of them talked to each other.",
  "A sunrise lamp for travel",
  "Waking up in light sleep",
  "How the masking works",
];

describe("App", () => {
  it("has exactly the kept h2s, in order", () => {
    const { container } = render(<App state={ready()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Health and tech, from the lab to my bedside.",
    );
    expect(
      [...container.querySelectorAll("h2")].map((h) => h.textContent),
    ).toEqual(KEPT_H2S);
  });

  it("leaves out the cut parts", () => {
    const { container } = render(<App state={ready()} />);
    const text = container.textContent ?? "";
    [
      "The test",
      "The nights",
      "Every claim, scored",
      "A typical night",
      "Three findings",
      "Why through Apple Health",
      "Everything else in my Health store",
      "Left out, and why",
    ].forEach((cut) => expect(text).not.toContain(cut));
    expect(
      container.querySelectorAll("input, button[type=submit]"),
    ).toHaveLength(0);
  });

  it("titles the first finding with its number, from the masked data", () => {
    render(<App state={ready()} />);
    expect(screen.getAllByRole("heading", { level: 4 })[0]).toHaveTextContent(
      "The raw signal",
    );
    const part = screen.getByRole("region", {
      name: "What a joined year looks like",
    });
    expect(
      within(part)
        .getAllByRole("heading", { level: 4 })
        .map((h) => h.textContent),
    ).toEqual([
      "Weekends cost me 24 minutes of sleep.",
      "I do not catch up the next night",
      "Training days do not cost sleep",
    ]);
  });

  it("keeps every paragraph to two sentences at most", () => {
    const { container } = render(<App state={ready()} />);
    // Visible paragraphs only; the hidden figure summaries are read in place of a drawing.
    container
      .querySelectorAll("main p:not(.visually-hidden), footer p")
      .forEach((p) => {
        // A link that ends a paragraph ("How the data got here") is a way on, not a sentence.
        const tail = p.lastElementChild?.matches("a:last-child")
          ? (p.lastElementChild.textContent ?? "")
          : "";
        const sentences = (p.textContent ?? "")
          .slice(0, (p.textContent ?? "").length - tail.length)
          .replace(/\d\.\d/g, "0")
          .split(/[.?]\s+(?=[A-Z])/);
        expect(sentences.length, p.textContent ?? "").toBeLessThanOrEqual(2);
      });
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
    expect(text).not.toContain("—");
    expect(text).not.toContain("·");
    expect(text).not.toContain("!");
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
      await screen.findByRole("heading", { name: "How I got it out" }),
    ).toBeInTheDocument();
  });

  it("shows the error when a file is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => respond({}, 404)),
    );
    render(<Loader base="/data" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "/data/patterns.json returned 404",
    );
  });
});
