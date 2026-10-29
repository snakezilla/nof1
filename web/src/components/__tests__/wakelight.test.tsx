import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { breaksCopyRules } from "../../lib/projects";
import { publicData } from "../../test/fixtures";
import { OtherProjects } from "../OtherProjects";
import { WakeLightMedia } from "../WakeLight";

const bedside = () => {
  render(<OtherProjects projects={publicData().projects} />);
  return screen.getByRole("listitem", { name: "A sunrise lamp for travel" });
};

describe("WakeLight", () => {
  it("is the last step: label, line, the two pictures, then two short paragraphs", () => {
    const step = bedside();
    expect(screen.getAllByRole("listitem").at(-1)).toBe(step);
    expect([...step.children].map((c) => c.className)).toEqual([
      "step__label",
      "elsewhere__line",
      "feature__media",
      "step__text",
      "step__text",
    ]);
    expect(step.querySelector(".elsewhere__em")).toHaveTextContent(
      /^sunrise lamp$/,
    );
    // Only this step has pictures.
    expect(
      screen.getByRole("complementary").querySelectorAll("figure"),
    ).toHaveLength(2);
  });

  it("says the lamp's facts as Ahsan states them, in three sentences and one line of next", () => {
    const step = bedside();
    const text = [...step.querySelectorAll(".step__text")]
      .map((p) => p.textContent)
      .join(" ");
    expect(breaksCopyRules(text)).toBe(false);
    expect(text).toContain("syncs to my phone automatically");
    expect(text).toContain("under $20 to make");
    expect(text).toContain("organic, cartoon-like motion");
    expect(text).toContain("feels like part of the room");
    expect(text).toContain("Philips wake-up light gave a few hundred lux");
    // 10,000 lux is computed for the fold-out concept, never measured; the copy says so.
    expect(text).toContain(
      "on paper the fold-out version reaches 10,000 lux at about 30 W",
    );
    // Waking in light sleep is next, not done.
    expect(text).toMatch(/Next, the lamp could wake me in light sleep/);
    expect(text.match(/[.?](\s|$)/g)).toHaveLength(4);
  });

  it("labels each picture with one short line: the clip now, the render next", () => {
    const { container } = render(<WakeLightMedia />);
    const figures = [...container.querySelectorAll(".feature__media > figure")];
    expect(figures.map((f) => f.firstElementChild?.tagName)).toEqual([
      "VIDEO",
      "IMG",
    ]);
    expect(
      figures.map((f) => f.querySelector("figcaption")?.textContent),
    ).toEqual(["Now: the travel lamp", "Next: fold-out, 10,000 lux on paper"]);
    expect(container.querySelectorAll("figcaption")).toHaveLength(2);
  });

  it("never autoplays the clip, and gives it its own frame as poster, a size and controls", () => {
    const { container } = render(<WakeLightMedia />);
    const videos = container.querySelectorAll("video");
    expect(videos).toHaveLength(1);
    const v = videos[0];
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
    expect(v.getAttribute("aria-label")).not.toMatch(/render/i);
    const source = v.querySelector("source");
    expect(source).toHaveAttribute("src", "/media/wakelight-bellows.mp4");
    expect(source).toHaveAttribute("type", "video/mp4");
  });

  it("shows the fold-out render lazily, at the clip's size, with a description", () => {
    render(<WakeLightMedia />);
    const img = screen.getByRole("img", { name: /render of the fold-out/i });
    expect(img).toHaveAttribute("src", "/media/wakelight-foldout.jpg");
    expect(img).toHaveAttribute("width", "720");
    expect(img).toHaveAttribute("height", "1280");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("decoding", "async");
  });

  it("stays out of the page when the aside is dropped", () => {
    render(
      <App
        state={{ status: "ready", data: { ...publicData(), projects: null } }}
      />,
    );
    expect(screen.queryByText(/sunrise lamp/)).toBeNull();
    expect(
      within(document.body).queryByRole("img", { name: /fold-out/i }),
    ).toBeNull();
  });
});
