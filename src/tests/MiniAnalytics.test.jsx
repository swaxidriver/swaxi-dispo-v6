import { render, screen, fireEvent } from "@testing-library/react";

import { ShiftProvider } from "../contexts/ShiftContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import MiniAnalytics from "../components/MiniAnalytics";

// Mock data for testing
const mockShifts = [
  {
    id: "2024-01-15_morning",
    date: "2024-01-15",
    start: "08:00",
    end: "10:00",
    status: "open",
    conflicts: [],
  },
  {
    id: "2024-01-15_evening",
    date: "2024-01-15",
    start: "10:00",
    end: "12:00",
    status: "assigned",
    assignedTo: "User1",
    conflicts: [],
  },
  {
    id: "2024-01-16_morning",
    date: "2024-01-16",
    start: "08:00",
    end: "10:00",
    status: "open",
    conflicts: ["TIME_OVERLAP"],
  },
];

let mockApplications = [];

function TestWrapper({
  children,
  initialShifts = [],
  _initialApplications = [],
}) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ShiftProvider
          disableAsyncBootstrap={true}
          repositoryOverride={{
            list: () => Promise.resolve(initialShifts),
            ping: () => Promise.resolve(true),
          }}
          initialShifts={initialShifts}
        >
          {children}
        </ShiftProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe("MiniAnalytics", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock today's date
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-15"));
    // Rebuild applications relative to mocked time
    const now = Date.now();
    mockApplications = [
      {
        id: "app1",
        shiftId: "2024-01-15_morning",
        userId: "User1",
        ts: now - 2 * 24 * 60 * 60 * 1000,
      }, // 2 days ago
      {
        id: "app2",
        shiftId: "2024-01-16_morning",
        userId: "User2",
        ts: now - 10 * 24 * 60 * 60 * 1000,
      }, // 10 days ago (exclude)
    ];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("displays expected metric values", async () => {
    // LocalStorage seed (provider will still recompute conflicts deterministically)
    localStorage.setItem("shifts", JSON.stringify(mockShifts));
    localStorage.setItem("applications", JSON.stringify(mockApplications));

    render(
      <TestWrapper initialShifts={mockShifts}>
        <MiniAnalytics onViewSource={() => {}} />
      </TestWrapper>,
    );

    // Wait for tiles
    await screen.findByText("Offene Dienste");

    // Helper to get numeric value adjacent to a tile label
    function getValue(label) {
      const el = screen.getByText(label);
      // container structure: label <p> then sibling dd with value element
      const wrapper =
        el.closest("dt")?.parentElement || el.parentElement?.parentElement;
      // Fallback: search globally for value numbers
      const numberEl =
        wrapper?.querySelector("dd p.text-2xl") ||
        wrapper?.parentElement?.querySelector("dd p.text-2xl");
      if (numberEl) return parseInt(numberEl.textContent, 10);
      // As a last resort query all numbers and associate by order (stable since component order fixed)
      const labels = [
        "Offene Dienste",
        "Zugewiesen heute",
        "Aktive Konflikte",
        "Bewerbungen 7T",
      ];
      const allNumbers = screen.getAllByText(/^[0-9]+$/);
      const idx = labels.indexOf(label);
      return parseInt(allNumbers[idx].textContent, 10);
    }

    expect(getValue("Offene Dienste")).toBe(2);
    expect(getValue("Zugewiesen heute")).toBe(1);
    // With current deterministic recomputation none of the provided shifts overlap, so conflicts = 0
    expect(getValue("Aktive Konflikte")).toBe(0);
    // Only the recent application (2 days ago) is within the 7 day window
    expect(getValue("Bewerbungen 7T")).toBe(1);
  });

  test("view source functionality works", async () => {
    localStorage.setItem("shifts", JSON.stringify(mockShifts));
    localStorage.setItem("applications", JSON.stringify(mockApplications));

    const mockViewSource = jest.fn();

    render(
      <TestWrapper
        initialShifts={mockShifts}
        initialApplications={mockApplications}
      >
        <MiniAnalytics onViewSource={mockViewSource} />
      </TestWrapper>,
    );

    // Wait for component to load and find the eye icons
    await screen.findByText("Offene Dienste");

    const eyeButtons = screen.getAllByLabelText(/Datenquelle für .* anzeigen/);
    expect(eyeButtons).toHaveLength(4);

    // Click the first eye button (open shifts)
    fireEvent.click(eyeButtons[0]);
    expect(mockViewSource).toHaveBeenCalledWith("open");
  });

  test("works without onViewSource prop", async () => {
    localStorage.setItem("shifts", JSON.stringify(mockShifts));
    localStorage.setItem("applications", JSON.stringify(mockApplications));

    render(
      <TestWrapper
        initialShifts={mockShifts}
        initialApplications={mockApplications}
      >
        <MiniAnalytics />
      </TestWrapper>,
    );

    // Should render without view source buttons
    await screen.findByText("Offene Dienste");
    const eyeButtons = screen.queryAllByLabelText(
      /Datenquelle für .* anzeigen/,
    );
    expect(eyeButtons).toHaveLength(0);
  });

  test("calculates metrics correctly with empty data", async () => {
    localStorage.setItem("shifts", JSON.stringify([]));
    localStorage.setItem("applications", JSON.stringify([]));

    render(
      <TestWrapper>
        <MiniAnalytics />
      </TestWrapper>,
    );

    await screen.findByText("Offene Dienste");

    // All values should be 0
    const zeroValues = screen.getAllByText("0");
    expect(zeroValues).toHaveLength(4);
  });
});
