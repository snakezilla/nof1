import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../../App";
import { breaksCopyRules } from "../../lib/projects";
import { publicData } from "../../test/fixtures";
import { WakeLightMedia } from "../WakeLight";

const bedside = () => {
  render(<App state={{ status: "ready", data: publicData() }} />);
  return screen.getByRole("region", { name: "A sunrise lamp for travel" });
};

describe("WakeLight", () => {
  it("is the bedside chapter: label, line, the wake timeline, then the words and the two clips", () => {
    const step = bedside();
    expect(step.id).toBe("chapter-bedside");
    expect([...step.children].map((c) => c.className)).toEqual([
      "chapter__label",
      "chapter__title",
      "fig diagram diagram--wake",
      "chapter__body",
    ]);
    expect(
      [...step.querySelector(".chapter__body")!.children].map(
        (c) => c.className,
      ),
    ).toEqual(["chapter__text", "feature__media"]);
    expect(step.querySelector(".chapter__em")).toHaveTextContent(
      /^sunrise lamp$/,
    );
    expect(within(step).getByRole("link")).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/wakelight",
    );
    // Only this chapter has pictures.
    expect(
      document.querySelectorAll(
        "main figure.feature__media, .feature__media figure",
      ),
    ).toHaveLength(3);
  });

  it("says the lamp's facts as Ahsan states them, in two sentences, and leaves the rest to the timeline", () => {
    const step = bedside();
    const text = [...step.querySelectorAll(".chapter__text")]
      .map((p) => p.textContent)
      .join(" ");
    expect(breaksCopyRules(text)).toBe(false);
    expect(text).toContain("Philips wake-up light gave a few hundred lux");
    expect(text).toContain("under $20 to make");
    expect(text).toContain("organic, cartoon-like motion");
    expect(text).toContain(
      "follows the morning-light protocol in Andrew Huberman's book Protocols.",
    );
    // The title is in italics, and the book gets no lux figure.
    const cites = [...step.querySelectorAll(".chapter__text cite")];
    expect(cites.map((c) => c.textContent)).toEqual(["Protocols"]);
    expect(text).not.toContain("*");
    expect(text).not.toMatch(/Protocols[^.]*lux/);
    expect(text.match(/[.?](\s|$)/g)).toHaveLength(2);
    // Waking in light sleep is done, and said in the timeline, not as a plan.
    const all = step.textContent ?? "";
    expect(all).toMatch(/light sleep/);
    expect(all).not.toMatch(/\b(next|plan to|will)\b/i);
  });

  it("draws the wake sequence with its marks, as one image with a hidden summary", () => {
    const step = bedside();
    const img = within(step).getByRole("img", {
      name: /timeline of a wake-up/i,
    });
    const words = img.textContent ?? "";
    [
      "strap senses",
      "light sleep",
      "lamp starts",
      "dim",
      "daylight white",
      "awake",
      "syncs to my phone automatically",
      "fold-out version reaches 10,000 lux",
    ].forEach((w) => expect(words).toContain(w));
    expect(img.nextElementSibling).toHaveClass("visually-hidden");
    expect(img.nextElementSibling?.textContent).toMatch(/Over 30 minutes/);
  });

  it("labels each clip with one short line, never as a render", () => {
    const { container } = render(<WakeLightMedia />);
    const figures = [...container.querySelectorAll(".feature__media > figure")];
    expect(figures.map((f) => f.firstElementChild?.tagName)).toEqual([
      "VIDEO",
      "VIDEO",
      "IMG",
    ]);
    expect(
      figures.map((f) => f.querySelector("figcaption")?.textContent),
    ).toEqual(["The travel lamp", "How it moves", "The fold-out version"]);
    expect(container.querySelectorAll("figcaption")).toHaveLength(3);
    container
      .querySelectorAll("video")
      .forEach((v) =>
        expect(v.getAttribute("aria-label")).not.toMatch(/render/i),
      );
    expect(container.textContent).not.toMatch(/render/i);
  });

  it("never autoplays the travel clip, and gives it its own frame as poster, a size and controls", () => {
    const { container } = render(<WakeLightMedia />);
    const v = container.querySelectorAll("video")[0];
    expect(v).not.toHaveAttribute("autoplay");
    expect(v.autoplay).toBe(false);
    expect(v).toHaveAttribute("poster", "/media/wakelight-bellows-poster.jpg");
    expect(v).toHaveAttribute("preload", "none");
    expect(v).toHaveAttribute("controls");
    expect(v).toHaveAttribute("playsinline");
    expect(v).toHaveAttribute("loop");
    expect(v.muted).toBe(true);
    expect(v).toHaveAttribute("width", "720");
    expect(v).toHaveAttribute("height", "1280");
    const source = v.querySelector("source");
    expect(source).toHaveAttribute("src", "/media/wakelight-bellows.mp4");
    expect(source).toHaveAttribute("type", "video/mp4");
  });

  it("loops the motion silently, WebM then MP4, with a poster and a size, and no autoplay attribute", () => {
    const { container } = render(<WakeLightMedia />);
    const v = container.querySelectorAll("video")[1];
    expect(v).not.toHaveAttribute("autoplay");
    expect(v).toHaveAttribute("poster", "/media/wakelight-motion-poster.jpg");
    expect(v).toHaveAttribute("preload", "none");
    expect(v).toHaveAttribute("playsinline");
    expect(v).toHaveAttribute("loop");
    expect(v.muted).toBe(true);
    expect(v).toHaveAttribute("width", "540");
    expect(v).toHaveAttribute("height", "960");
    expect(v.getAttribute("aria-label")).toMatch(/^Animation: the lamp/);
    expect(
      [...v.querySelectorAll("source")].map((s) => [
        s.getAttribute("src"),
        s.getAttribute("type"),
      ]),
    ).toEqual([
      ["/media/wakelight-motion.webm", "video/webm"],
      ["/media/wakelight-motion.mp4", "video/mp4"],
    ]);
  });

  it("holds the motion still with controls under reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q === "(prefers-reduced-motion: reduce)",
    }));
    const play = vi.fn(() => Promise.resolve());
    const { container } = render(<WakeLightMedia />);
    const v = container.querySelectorAll("video")[1];
    v.play = play;
    expect(v.controls).toBe(true);
    expect(play).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("plays the motion only while it is on screen when motion is allowed", () => {
    let seen: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: typeof seen) {
          seen = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => {});
    const { container } = render(<WakeLightMedia />);
    const v = container.querySelectorAll("video")[1];
    expect(v.controls).toBe(false);
    seen([{ isIntersecting: true }]);
    expect(play).toHaveBeenCalledTimes(1);
    seen([{ isIntersecting: false }]);
    expect(pause).toHaveBeenCalledTimes(1);
    play.mockRestore();
    pause.mockRestore();
    vi.unstubAllGlobals();
  });

  it("stays out of the page when projects.json is dropped", () => {
    render(
      <App
        state={{ status: "ready", data: { ...publicData(), projects: null } }}
      />,
    );
    expect(screen.queryByText(/sunrise lamp/)).toBeNull();
    expect(document.querySelector("video")).toBeNull();
  });
});
