import React from "react";
import "@testing-library/jest-dom";

import Calendar from "../pages/Calendar";

import { screen, fireEvent, renderWithProviders } from "./testUtils";

// Mock the useMobileDevice hook to return true
jest.mock("../hooks/useMobileDevice", () => ({
  useMobileDevice: () => true,
  useTimeInputStep: () => "60", // Mock the time input step for mobile
}));

// Mock window.innerWidth for mobile viewport
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 380,
});

describe("Mobile Calendar Sticky Headers", () => {
  beforeEach(() => {
    // Ensure we're in mobile mode
    window.innerWidth = 380;
    fireEvent(window, new Event("resize"));
  });

  it("should render sticky day headers with proper CSS positioning", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
      {
        id: 2,
        date: "2025-01-16",
        start: "14:00",
        end: "22:00",
        type: "Spätdienst",
        assignedTo: "Max Mustermann",
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      initialShifts: shifts,
    });

    // Check that mobile calendar is rendered
    expect(
      screen.getByRole("application", { name: /mobile wochenkalender/i }),
    ).toBeInTheDocument();

    // Check for day headers - they should be present
    const dayHeaders = screen.getAllByRole("banner");
    expect(dayHeaders.length).toBeGreaterThan(0);

    // Check that day headers have proper structure
    dayHeaders.forEach((header) => {
      expect(header).toHaveClass("calendar-mobile-day-header");
    });
  });

  it("should display compressed time range for days with shifts", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
      {
        id: 2,
        date: "2025-01-15",
        start: "14:00",
        end: "18:00",
        type: "Spätdienst",
        assignedTo: "Max Mustermann",
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      initialShifts: shifts,
    });

    // Should show compressed time range for the day with shifts
    expect(screen.getByText("📅 08:00 - 18:00")).toBeInTheDocument();
  });

  it("should show proper ARIA landmarks for navigation", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      initialShifts: shifts,
    });

    // Check for proper ARIA landmarks
    expect(
      screen.getByRole("application", { name: /mobile wochenkalender/i }),
    ).toBeInTheDocument();

    // Check for screen reader description
    expect(
      screen.getByText(
        /mobile kalenderansicht mit klebrigen tagesüberschriften/i,
      ),
    ).toBeInTheDocument();

    // Check for navigation elements
    const navigationElements = screen.getAllByRole("list");
    expect(navigationElements.length).toBeGreaterThan(0);
  });

  it("should display conflict badges on mobile", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: ["TIME_OVERLAP"],
      },
    ];

    renderWithProviders(<Calendar />, {
      initialShifts: shifts,
    });

    // Check that conflict badge is displayed
    expect(screen.getByText("1 Konflikt")).toBeInTheDocument();
    expect(screen.getByTestId("conflict-badge")).toBeInTheDocument();
  });

  it("should maintain accessibility with sticky headers", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      initialShifts: shifts,
    });

    // Check keyboard navigation still works
    const shiftItems = screen.getAllByRole("listitem");
    expect(shiftItems.length).toBeGreaterThan(0);

    shiftItems.forEach((item) => {
      expect(item).toHaveAttribute("tabIndex", "0");
      expect(item).toHaveAttribute("aria-label");
    });
  });
});
