import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import ShiftCard from "../components/ShiftCard";
import { SHIFT_STATUS } from "../utils/constants";

// Mock the hooks
jest.mock("../lib/rbac", () => ({
  canManageShifts: jest.fn(() => false),
}));

describe("ShiftCard", () => {
  const mockShift = {
    id: "1",
    date: new Date("2025-01-25"),
    start: "09:00",
    end: "17:00",
    status: SHIFT_STATUS.OPEN,
    assignedTo: null,
    conflicts: [],
  };

  const mockAuth = {
    user: { id: "1", name: "Test User", role: "analyst" },
  };

  const mockGetStatusBadgeClass = jest.fn(() => "bg-blue-100 text-blue-800");
  const mockOnApply = jest.fn();
  const mockOnAssign = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    shift: mockShift,
    auth: mockAuth,
    userRole: "analyst",
    showActions: true,
    getStatusBadgeClass: mockGetStatusBadgeClass,
    onApply: mockOnApply,
    onAssign: mockOnAssign,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders shift card with basic information", () => {
    render(<ShiftCard {...defaultProps} />);

    expect(screen.getByText(/Sa\., 25\.01\./)).toBeInTheDocument();
    expect(screen.getByText(/09:00-17:00/)).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("expands and collapses when clicked", () => {
    render(<ShiftCard {...defaultProps} />);

    const header = screen.getByRole("button");
    expect(header).toHaveAttribute("aria-expanded", "false");

    // Initially collapsed - find details by ID
    const details = document.getElementById("shift-details-1");
    expect(details).toHaveClass("collapsed");

    // Click to expand
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    const expandedDetails = document.getElementById("shift-details-1");
    expect(expandedDetails).toHaveClass("expanded");

    // Click to collapse
    fireEvent.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    const collapsedDetails = document.getElementById("shift-details-1");
    expect(collapsedDetails).toHaveClass("collapsed");
  });

  it("expands with keyboard navigation", () => {
    render(<ShiftCard {...defaultProps} />);

    const header = screen.getByRole("button");

    // Press Enter to expand
    fireEvent.keyDown(header, { key: "Enter" });
    expect(header).toHaveAttribute("aria-expanded", "true");

    // Press Space to collapse
    fireEvent.keyDown(header, { key: " " });
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("shows apply button when expanded for open shifts", () => {
    render(<ShiftCard {...defaultProps} />);

    // Expand the card
    const header = screen.getByRole("button");
    fireEvent.click(header);

    // Should show apply button
    expect(screen.getByText("Bewerben")).toBeInTheDocument();
  });

  it("calls onApply when apply button is clicked", () => {
    render(<ShiftCard {...defaultProps} />);

    // Expand the card
    const header = screen.getByRole("button");
    fireEvent.click(header);

    // Click apply button
    const applyButton = screen.getByText("Bewerben");
    fireEvent.click(applyButton);

    expect(mockOnApply).toHaveBeenCalledWith("1");
  });

  it("has minimum touch target size", () => {
    render(<ShiftCard {...defaultProps} />);

    const header = screen.getByRole("button");

    // Should have minimum 44px height (minHeight is set in style prop)
    expect(header.style.minHeight).toBe("44px");
  });

  it("shows duration information", () => {
    render(<ShiftCard {...defaultProps} />);

    // 9am to 5pm is 8 hours
    expect(screen.getByText("8h")).toBeInTheDocument();
  });

  it("displays assigned user when shift is assigned", () => {
    const assignedShift = {
      ...mockShift,
      status: SHIFT_STATUS.ASSIGNED,
      assignedTo: "Jane Doe",
    };

    render(<ShiftCard {...defaultProps} shift={assignedShift} />);

    // Expand to see details
    const header = screen.getByRole("button");
    fireEvent.click(header);

    expect(screen.getByText(/Zugewiesen an:/)).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
