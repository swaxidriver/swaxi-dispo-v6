import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import "@testing-library/jest-dom";
import ConflictBadge from "../components/ConflictBadge";

describe("ConflictBadge", () => {
  it("does not render when no conflicts provided", () => {
    const { container } = render(<ConflictBadge conflicts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not render when conflicts is null/undefined", () => {
    const { container } = render(<ConflictBadge conflicts={null} />);
    expect(container.firstChild).toBeNull();

    const { container: container2 } = render(<ConflictBadge />);
    expect(container2.firstChild).toBeNull();
  });

  it("renders conflict badge with single conflict", () => {
    render(<ConflictBadge conflicts={["TIME_OVERLAP"]} />);

    expect(screen.getByText("1 Konflikt")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/1 Konflikt.*Zeitüberlappung/),
    ).toBeInTheDocument();
  });

  it("renders conflict badge with multiple conflicts", () => {
    render(
      <ConflictBadge conflicts={["TIME_OVERLAP", "DOUBLE_APPLICATION"]} />,
    );

    expect(screen.getByText("2 Konflikte")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/2 Konflikte.*Zeitüberlappung.*Doppelte Bewerbung/),
    ).toBeInTheDocument();
  });

  it("shows tooltip with conflict descriptions on hover", async () => {
    render(
      <ConflictBadge conflicts={["TIME_OVERLAP", "DOUBLE_APPLICATION"]} />,
    );

    const badge = screen.getByText("2 Konflikte");

    // Hover to show tooltip
    fireEvent.mouseEnter(badge);

    await waitFor(() => {
      expect(
        screen.getByText("Zeitüberlappung, Doppelte Bewerbung"),
      ).toBeInTheDocument();
    });
  });

  it("handles unknown conflict codes gracefully", () => {
    render(<ConflictBadge conflicts={["UNKNOWN_CONFLICT"]} />);

    expect(screen.getByText("1 Konflikt")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/1 Konflikt.*UNKNOWN_CONFLICT/),
    ).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <ConflictBadge conflicts={["TIME_OVERLAP"]} className="custom-class" />,
    );

    const badge = screen.getByText("1 Konflikt").parentElement;
    expect(badge).toHaveClass("custom-class");
  });

  it("includes exclamation triangle icon", () => {
    render(<ConflictBadge conflicts={["TIME_OVERLAP"]} />);

    const badge = screen.getByText("1 Konflikt").parentElement;
    // Check if there's an svg element inside the badge (the icon)
    expect(badge.querySelector("svg")).toBeInTheDocument();
  });

  it("has proper styling classes", () => {
    render(<ConflictBadge conflicts={["TIME_OVERLAP"]} />);

    const badge = screen.getByText("1 Konflikt").parentElement;
    expect(badge).toHaveClass(
      "inline-flex",
      "items-center",
      "px-2",
      "py-1",
      "text-xs",
      "font-medium",
      "text-red-800",
      "bg-red-100",
      "border",
      "border-red-200",
      "rounded-full",
    );
  });
});
