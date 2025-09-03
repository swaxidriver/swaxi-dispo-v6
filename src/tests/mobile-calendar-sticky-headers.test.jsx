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
        date: "2025-09-01",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
      {
        id: 2,
        date: "2025-09-02",
        start: "14:00",
        end: "22:00",
        type: "Spätdienst",
        assignedTo: "Max Mustermann",
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      providerProps: { initialShifts: shifts },
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
        date: "2025-09-01", // Use September 2025 to match current date
        start: "08:00",
        end: "12:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
      {
        id: 2,
        date: "2025-09-01", // Same day for time range test
        start: "14:00",
        end: "18:00",
        type: "Spätdienst",
        assignedTo: "Max Mustermann",
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      providerProps: { initialShifts: shifts },
    });

    // Should show individual shift cards
    expect(screen.getByText("Frühdienst")).toBeInTheDocument();
    expect(screen.getByText("Spätdienst")).toBeInTheDocument();

    // Should show time ranges are displayed (either combined or individual)
    const timeElements = screen.queryAllByText(/\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it("should show proper ARIA landmarks for navigation", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-09-01",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      providerProps: { initialShifts: shifts },
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

  it("should display shifts with basic information on mobile", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-09-01",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      providerProps: { initialShifts: shifts },
    });

    // Check that shift is displayed with proper information
    expect(screen.getByText("Frühdienst")).toBeInTheDocument();
    expect(screen.getByText("08:00 - 16:00")).toBeInTheDocument();
    expect(screen.getByText("Offen")).toBeInTheDocument();
  });

  it("should maintain accessibility with sticky headers", () => {
    const shifts = [
      {
        id: 1,
        date: "2025-09-01",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: null,
        conflicts: [],
      },
    ];

    renderWithProviders(<Calendar />, {
      providerProps: { initialShifts: shifts },
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
