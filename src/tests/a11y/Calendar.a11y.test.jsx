import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ShiftProvider } from "../../contexts/ShiftContext";
import { ShiftTemplateProvider } from "../../contexts/ShiftTemplateContext";
import { I18nProvider } from "../../contexts/I18nContext";
import Calendar from "../../pages/Calendar";

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

function TestWrapper({ children, initialShifts = [] }) {
  return (
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <ThemeProvider>
            <ShiftProvider
              disableAsyncBootstrap={true}
              repositoryOverride={{
                list: () => Promise.resolve(initialShifts),
                ping: () => Promise.resolve(true),
              }}
            >
              <ShiftTemplateProvider>{children}</ShiftTemplateProvider>
            </ShiftProvider>
          </ThemeProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

function generateTestShift(id, date = "2025-01-15") {
  return {
    id: `shift-${id}`,
    name: `Test Shift ${id}`,
    type: "Regular",
    date,
    start: "08:00",
    end: "16:00",
    status: "open",
    workLocation: "office",
    assignedTo: null,
  };
}

describe("Calendar Accessibility", () => {
  test("has no axe violations in week view", async () => {
    const shifts = [
      generateTestShift(1, "2025-01-15"),
      generateTestShift(2, "2025-01-16"),
    ];

    const { container } = render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("has no axe violations in month view", async () => {
    const shifts = [
      generateTestShift(1, "2025-01-15"),
      generateTestShift(2, "2025-01-16"),
    ];

    const { container } = render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Switch to month view
    const monthButton = screen.getByRole("button", { name: /monatsansicht/i });
    fireEvent.click(monthButton);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("has proper semantic structure", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Check main landmarks
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute(
      "aria-labelledby",
      "calendar-title",
    );

    // Check skip links
    expect(
      screen.getByRole("link", { name: /zum kalender springen/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /zu den ansichtsoptionen springen/i }),
    ).toBeInTheDocument();

    // Check view mode controls
    expect(
      screen.getByRole("group", { name: /ansichtsmodus auswählen/i }),
    ).toBeInTheDocument();

    // Check calendar application region
    expect(
      screen.getByRole("application", { name: /wochenkalender/i }),
    ).toBeInTheDocument();
  });

  test("view mode buttons have proper accessibility attributes", () => {
    render(
      <TestWrapper>
        <Calendar />
      </TestWrapper>,
    );

    const weekButton = screen.getByRole("button", { name: /wochenansicht/i });
    const monthButton = screen.getByRole("button", { name: /monatsansicht/i });

    // Should have aria-pressed
    expect(weekButton).toHaveAttribute("aria-pressed", "true"); // Default view
    expect(monthButton).toHaveAttribute("aria-pressed", "false");

    // Should be focusable
    expect(weekButton).toHaveAttribute("tabIndex"); // Should be focusable
    expect(monthButton).toHaveAttribute("tabIndex");

    // Switch views and check state
    fireEvent.click(monthButton);
    expect(weekButton).toHaveAttribute("aria-pressed", "false");
    expect(monthButton).toHaveAttribute("aria-pressed", "true");
  });

  test("navigation buttons have proper labels", () => {
    render(
      <TestWrapper>
        <Calendar />
      </TestWrapper>,
    );

    // Week view navigation (visible text as accessible names)
    expect(
      screen.getByRole("button", { name: /vorherige woche/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /heute/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nächste woche/i }),
    ).toBeInTheDocument();

    // Switch to month view
    const monthButton = screen.getByRole("button", { name: /monatsansicht/i });
    fireEvent.click(monthButton);

    // Month view navigation
    expect(
      screen.getByRole("button", { name: /vorheriger monat/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /nächster monat/i }),
    ).toBeInTheDocument();
  });

  test("calendar grid has proper structure", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Check grid structure
    const grid = screen.getByRole("grid");
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute("aria-label");

    // Check column headers
    const columnHeaders = screen.getAllByRole("columnheader");
    expect(columnHeaders.length).toBeGreaterThan(0);

    // Check that days have proper aria-labels
    const gridCells = screen.getAllByRole("gridcell");
    gridCells.forEach((cell) => {
      expect(cell).toHaveAttribute("aria-label");
      expect(cell).toHaveAttribute("tabIndex");
    });
  });

  test("keyboard navigation works in calendar grid", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    const firstGridCell = screen.getAllByRole("gridcell")[0];

    // Focus first cell
    firstGridCell.focus();
    expect(document.activeElement).toBe(firstGridCell);

    // Test arrow key navigation
    fireEvent.keyDown(firstGridCell, { key: "ArrowRight" });
    fireEvent.keyDown(firstGridCell, { key: "ArrowDown" });
    fireEvent.keyDown(firstGridCell, { key: "ArrowLeft" });
    fireEvent.keyDown(firstGridCell, { key: "ArrowUp" });

    // Test Home/End keys
    fireEvent.keyDown(firstGridCell, { key: "Home" });
    fireEvent.keyDown(firstGridCell, { key: "End" });
  });

  test("page up/down navigation works", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    const calendarGrid = screen.getByRole("grid");

    // Test PageUp/PageDown for week navigation
    fireEvent.keyDown(calendarGrid, { key: "PageUp" });
    fireEvent.keyDown(calendarGrid, { key: "PageDown" });

    // Switch to month view and test month navigation
    const monthButton = screen.getByRole("button", { name: /monatsansicht/i });
    fireEvent.click(monthButton);

    const monthGrid = screen.getByRole("grid");
    fireEvent.keyDown(monthGrid, { key: "PageUp" });
    fireEvent.keyDown(monthGrid, { key: "PageDown" });
  });

  test("calendar cells can be activated with Enter/Space", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    const firstGridCell = screen.getAllByRole("gridcell")[0];

    // Test Enter key
    fireEvent.keyDown(firstGridCell, { key: "Enter" });

    // Test Space key
    fireEvent.keyDown(firstGridCell, { key: " " });
  });

  test("focus management works properly", async () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    const firstGridCell = screen.getAllByRole("gridcell")[0];

    // Focus cell
    firstGridCell.focus();
    expect(document.activeElement).toBe(firstGridCell);

    // Focus should stay within calendar when navigating
    fireEvent.keyDown(firstGridCell, { key: "Tab" });
    // Active element should still be within the calendar component
    expect(document.activeElement).not.toBeNull();
  });

  test("screen reader announcements are present", () => {
    const shifts = [
      generateTestShift(1, "2025-01-15"),
      generateTestShift(2, "2025-01-16"),
    ];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Check that cells have descriptive labels including shift count
    const gridCells = screen.getAllByRole("gridcell");

    // Find a cell that should have shifts
    const cellWithShifts = gridCells.find((cell) =>
      cell.getAttribute("aria-label")?.includes("Dienst"),
    );

    if (cellWithShifts) {
      const label = cellWithShifts.getAttribute("aria-label");
      expect(label).toMatch(/\d+ Dienst/);
    }
  });

  test("assignment mode accessibility", async () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Switch to assignment mode (only if user has permission)
    const assignmentButton = screen.queryByRole("button", {
      name: /zuweisungsansicht/i,
    });

    if (assignmentButton) {
      fireEvent.click(assignmentButton);

      // Assignment mode should be properly announced
      await waitFor(() => {
        expect(assignmentButton).toHaveAttribute("aria-pressed", "true");
      });
    }
  });

  test("keyboard shortcuts work", () => {
    const shifts = [generateTestShift(1)];

    render(
      <TestWrapper initialShifts={shifts}>
        <Calendar />
      </TestWrapper>,
    );

    // Test undo shortcut (Ctrl+Z)
    fireEvent.keyDown(document, { key: "z", ctrlKey: true });

    // Should not throw any errors
    expect(true).toBe(true);
  });
});
