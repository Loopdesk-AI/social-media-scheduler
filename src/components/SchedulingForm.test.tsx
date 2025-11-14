import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { SchedulingForm } from "./SchedulingForm";

describe("SchedulingForm", () => {
  test("shows character count and warning/error states", async () => {
    render(<SchedulingForm />);
    const textarea = screen.getByLabelText("Post content");
    await userEvent.type(textarea, "a".repeat(270));
    // switch platform to X (280 limit)
    const select = screen.getByRole("combobox");
    userEvent.selectOptions(select, "twitter");
    expect(screen.getByText(/270/)).toBeInTheDocument();
    // type more to reach warning
    await userEvent.type(textarea, "a".repeat(10));
    expect(screen.getByText(/Approaching limit/)).toBeInTheDocument();
    // exceed
    await userEvent.type(textarea, "a".repeat(5));
    expect(screen.getByText(/Exceeded limit/)).toBeInTheDocument();
  });
});
