import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CostErrorCard } from "../CostErrorCard";

describe("CostErrorCard", () => {
  it("shows default message when errorText is empty", () => {
    render(<CostErrorCard errorText="" fetching={false} onRetry={() => {}} />);
    expect(screen.getByText("花费数据刷新失败，请重试。")).toBeInTheDocument();
  });

  it("shows custom error text", () => {
    render(<CostErrorCard errorText="自定义错误" fetching={false} onRetry={() => {}} />);
    expect(screen.getByText("自定义错误")).toBeInTheDocument();
  });

  it("disables retry and applies opacity when fetching", () => {
    const onRetry = vi.fn();
    const { container } = render(<CostErrorCard errorText="" fetching={true} onRetry={onRetry} />);
    // When fetching, onRetry is undefined so no retry button rendered
    expect(screen.queryByText("重试")).not.toBeInTheDocument();
    // opacity class applied
    expect(container.firstChild).toHaveClass("opacity-70");
  });

  it("shows retry button when not fetching", () => {
    const onRetry = vi.fn();
    render(<CostErrorCard errorText="" fetching={false} onRetry={onRetry} />);
    expect(screen.getByText("重试")).toBeInTheDocument();
  });
});
