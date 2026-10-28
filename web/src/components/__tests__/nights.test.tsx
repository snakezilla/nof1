import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Nights } from "../Nights";
import { publicData } from "../../test/fixtures";

const shownRows = (container: HTMLElement) =>
  container.querySelectorAll("tbody tr:not(.is-extra)");

describe("Nights", () => {
  it("shows 14 rows, then all of them in place", async () => {
    const { container } = render(<Nights days={publicData().daily} />);
    expect(shownRows(container)).toHaveLength(14);
    const button = screen.getByRole("button", { name: "Show all 60 nights" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(button);
    const all = container.querySelectorAll("tbody tr");
    expect(shownRows(container)).toHaveLength(all.length);
    expect(button).toHaveTextContent("Show the last 14");
    expect(button).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(button);
    expect(shownRows(container)).toHaveLength(14);
  });

  it("renders every row on the server so the page reads without JavaScript", () => {
    const { container } = render(<Nights days={publicData().daily} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(64);
    expect(container.querySelectorAll("tr.gap")).toHaveLength(2);
  });

  it("has the five columns and no Mindful", () => {
    render(<Nights days={publicData().daily} />);
    expect(
      screen.getAllByRole("columnheader").map((h) => h.textContent),
    ).toEqual(["Date", "Sleep", "Awake", "Bedtime", "Training"]);
  });

  it("dates the window in words", () => {
    render(<Nights days={publicData().daily} />);
    expect(
      screen.getByText(/The last 60 nights of the data, to 23 April 2025/),
    ).toBeInTheDocument();
  });

  it("says so when there are no nights", () => {
    render(<Nights days={[]} />);
    expect(
      screen.getByText("No nights with sleep data yet."),
    ).toBeInTheDocument();
  });
});
