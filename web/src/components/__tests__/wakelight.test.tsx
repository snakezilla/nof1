import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../App";
import { breaksCopyRules } from "../../lib/projects";
import { WAKELIGHT } from "../../lib/wakelight";
import { publicData } from "../../test/fixtures";
import { OtherProjects } from "../OtherProjects";
import { WakeLight } from "../WakeLight";

describe("WakeLight", () => {
  it("sits in the aside after the list and before the way to byahsan.com", () => {
    render(<OtherProjects projects={publicData().projects} />);
    const aside = screen.getByRole("complementary");
    const block = within(aside).getByRole("group", {
      name: "A sunrise lamp for travel",
    });
    expect(block.previousElementSibling).toHaveClass("elsewhere__list");
    expect(block.nextElementSibling).toHaveClass("elsewhere__more");
  });

  it("links the line to its byahsan.com page, with the accent on one phrase", () => {
    render(<WakeLight />);
    const link = screen.getByRole("link", {
      name: "A sunrise lamp for travel",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.byahsan.com/projects/wakelight",
    );
    expect(link).toHaveClass("elsewhere__line");
    expect(link.querySelector(".elsewhere__em")).toHaveTextContent(
      /^sunrise lamp$/,
    );
  });

  it("is the line, the two pictures in one row, then two one-sentence lines", () => {
    const { container } = render(<WakeLight />);
    const block = container.firstElementChild as HTMLElement;
    expect([...block.children].map((c) => c.tagName)).toEqual([
      "A",
      "DIV",
      "P",
      "P",
    ]);
    const lines = [...block.querySelectorAll(":scope > p")].map(
      (p) => p.textContent,
    );
    expect(lines).toEqual([WAKELIGHT.why, WAKELIGHT.what]);
    lines.forEach((l) => expect(l?.match(/[.?]/g)).toHaveLength(1));
    const text = block.textContent ?? "";
    expect(breaksCopyRules(text)).toBe(false);
    // 10,000 lux is computed for the fold-out concept, never measured; the copy says so.
    expect(text).toContain("on paper a fold-out version reaches 10,000 lux");
    expect(text).not.toMatch(/300 lux|night light|bright enough/i);
  });

  it("labels each picture with one short line: the clip now, the render next", () => {
    const { container } = render(<WakeLight />);
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
    const { container } = render(<WakeLight />);
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
    render(<WakeLight />);
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
  });
});
