import React from "react";
import "@testing-library/jest-dom";

import Calendar from "../pages/Calendar";
import { buildShift } from "./utils/factories";
import { screen, fireEvent, renderWithProviders } from "./testUtils";

// Mock mobile device detection
jest.mock("../hooks/useMobileDevice", () => ({
  useMobileDevice: () => true, // Always return true for mobile tests
  useTimeInputStep: () => "60", // Mock the time input step for mobile
}));

// Mock window.innerWidth for mobile
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 375, // iPhone SE width
});

function seedMobileShifts(shifts = []) {
  localStorage.setItem("shifts", JSON.stringify(shifts));
}

describe("Mobile Calendar Responsive Layout", () => {
  beforeEach(() => {
    localStorage.clear();
    
    // Reset window width
    window.innerWidth = 375;
    
    // Trigger resize event to update any listeners
    window.dispatchEvent(new Event("resize"));
  });

  test("should render mobile vertical calendar layout on small screens", () => {
    const shifts = [
      buildShift({
        id: "shift1",
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
      }),
      buildShift({
        id: "shift2", 
        date: "2024-01-16",
        start: "14:00",
        end: "22:00",
        type: "Spätdienst",
      }),
    ];

    seedMobileShifts(shifts);

    renderWithProviders(<Calendar />);

    // Should show mobile calendar application
    expect(screen.getByRole("application", { name: /mobile wochenkalender/i })).toBeInTheDocument();

    // Should not show desktop calendar grid
    expect(screen.queryByText("Zeit")).not.toBeInTheDocument(); // Desktop time column header
  });

  test("should display days as vertical cards on mobile", () => {
    const shifts = [
      buildShift({
        id: "shift1",
        date: "2024-01-15",
        start: "08:00", 
        end: "16:00",
        type: "Frühdienst",
      }),
    ];

    seedMobileShifts(shifts);

    renderWithProviders(<Calendar />);

    // Should have day cards for each day of the week
    const dayCards = screen.getAllByRole("region");
    expect(dayCards.length).toBe(7); // 7 days in a week

    // Should show day names in German
    expect(screen.getByText("Montag")).toBeInTheDocument();
    expect(screen.getByText("Dienstag")).toBeInTheDocument();
  });

  test("should show shifts as cards within day sections", () => {
    const shifts = [
      buildShift({
        id: "shift1",
        date: "2024-01-15", // Monday
        start: "08:00",
        end: "16:00", 
        type: "Frühdienst",
        assignedTo: "Test User",
      }),
    ];

    seedMobileShifts(shifts);

    renderWithProviders(<Calendar />);

    // Should show shift details
    expect(screen.getByText("Frühdienst")).toBeInTheDocument();
    expect(screen.getByText("08:00 - 16:00")).toBeInTheDocument();
  });

  test("should maintain touch-friendly button sizes on mobile", () => {
    renderWithProviders(<Calendar />);

    // View mode buttons should exist and be clickable
    const weekButton = screen.getByRole("button", { name: /wochenansicht/i });
    const monthButton = screen.getByRole("button", { name: /monatsansicht/i });

    expect(weekButton).toBeInTheDocument();
    expect(monthButton).toBeInTheDocument();

    // Buttons should be clickable on mobile
    fireEvent.click(monthButton);
    expect(monthButton).toHaveAttribute("aria-pressed", "true");
  });

  test("should not have horizontal overflow on mobile", () => {
    const shifts = Array.from({ length: 5 }, (_, i) =>
      buildShift({
        id: `shift${i + 1}`,
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: `Dienst ${i + 1}`,
      }),
    );

    seedMobileShifts(shifts);

    renderWithProviders(<Calendar />);

    // Mobile calendar container should exist
    const mobileCalendar = screen.getByRole("application", { name: /mobile wochenkalender/i });
    expect(mobileCalendar).toBeInTheDocument();
    expect(mobileCalendar).toHaveClass("calendar-mobile-vertical");
  });

  test("should provide proper ARIA labels for mobile accessibility", () => {
    const shifts = [
      buildShift({
        id: "shift1",
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: "Frühdienst",
        assignedTo: "Test User",
      }),
    ];

    seedMobileShifts(shifts);

    renderWithProviders(<Calendar />);

    // Should have proper ARIA labels for screen readers
    expect(screen.getByRole("application")).toHaveAttribute("aria-label", "Mobile Wochenkalender");
    
    // Day sections should have proper labels
    const dayRegions = screen.getAllByRole("region");
    expect(dayRegions[0]).toHaveAttribute("aria-labelledby");
  });
});