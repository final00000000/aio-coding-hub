import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CostBar } from "../CostBar";

describe("CostBar", () => {
  it("renders normal percent", () => {
    render(<CostBar percent={0.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
  });

  it("falls back to 0 for NaN", () => {
    render(<CostBar percent={NaN} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("falls back to 0 for Infinity", () => {
    render(<CostBar percent={Infinity} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("clamps value > 1", () => {
    render(<CostBar percent={1.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps value < 0", () => {
    render(<CostBar percent={-0.5} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});
