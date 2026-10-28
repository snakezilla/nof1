import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "../../lib/checkin";
import { CheckIn } from "../CheckIn";
import { publicData } from "../../test/fixtures";

const TODAY = "2026-10-27";
const { test } = publicData();

const renderCheckIn = () =>
  render(
    <CheckIn
      questions={test.checkin}
      duration={test.duration_days}
      today={TODAY}
    />,
  );

describe("CheckIn", () => {
  it("starts empty and invites the first answer", () => {
    renderCheckIn();
    expect(
      screen.getByText(
        "No check-ins yet. Answer today's four questions to start.",
      ),
    ).toBeInTheDocument();
  });

  it("saves an answer, fills the day and says where it lives", async () => {
    renderCheckIn();
    const [yes] = screen.getAllByRole("button", { name: "Yes" });
    await userEvent.click(yes);
    expect(yes).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText("Day 1 of 14. Saved on this device."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "1 of 14 days answered" }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      [TODAY]: { wake: true },
    });
  });

  it("restores answers stored on an earlier visit", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ "2026-10-25": { wake: true }, [TODAY]: { sleep: 7.2 } }),
    );
    renderCheckIn();
    expect(
      screen.getByText("Day 3 of 14. Saved on this device."),
    ).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toHaveValue(7.2);
  });
});
