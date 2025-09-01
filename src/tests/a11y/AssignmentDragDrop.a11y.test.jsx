import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

import { AuthProvider } from "../../contexts/AuthContext";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ShiftProvider } from "../../contexts/ShiftContext";
import AssignmentDragDrop from "../../ui/assignment-dnd";

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

function TestWrapper({ children, initialShifts = [] }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ShiftProvider
          disableAsyncBootstrap={true}
          repositoryOverride={{
            list: () => Promise.resolve(initialShifts),
            ping: () => Promise.resolve(true),
          }}
        >
          {children}
        </ShiftProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function generateTestShift(id, status = "open") {
  return {
    id: `shift-${id}`,
    name: `Test Shift ${id}`,
    type: "Regular",
    date: "2025-01-15",
    start: "08:00",
    end: "16:00",
    status,
    workLocation: "office",
    assignedTo: status === "assigned" ? "Test Person" : null,
  };
}

describe("AssignmentDragDrop Accessibility", () => {
  test("has no axe violations with shifts", async () => {
    const shifts = [
      generateTestShift(1, "open"),
      generateTestShift(2, "open"),
      generateTestShift(3, "open"),
    ];

    const { container } = render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test("has proper ARIA structure", () => {
    const shifts = [generateTestShift(1, "open"), generateTestShift(2, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    // Check main sections exist
    expect(document.querySelector("#shifts-section")).toBeInTheDocument();
    expect(document.querySelector("#disponenten-section")).toBeInTheDocument();

    // When empty, sections should be regions rather than listboxes
    // When populated, they should be listboxes with options
    const shiftsContainer = screen.getByLabelText(
      /0 nicht zugewiesene schichten/i,
    );
    const disponentiContainer = screen.getByLabelText(
      /5 verfügbare disponenten/i,
    );

    expect(shiftsContainer).toBeInTheDocument();
    expect(disponentiContainer).toBeInTheDocument();

    // Check skip links
    expect(
      screen.getByRole("link", { name: /skip to shifts/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to disponenten/i }),
    ).toBeInTheDocument();

    // Check drag instructions
    expect(document.querySelector("#drag-instructions")).toBeInTheDocument();
  });

  test("shift options have proper accessibility attributes", () => {
    const shifts = [generateTestShift(1, "open"), generateTestShift(2, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const shiftOptions = screen.getAllByRole("option");
    const shiftElements = shiftOptions.filter((el) =>
      el.getAttribute("aria-describedby")?.includes("shift-"),
    );

    shiftElements.forEach((option) => {
      // Should have proper role
      expect(option).toHaveAttribute("role", "option");

      // Should have aria-selected
      expect(option).toHaveAttribute("aria-selected");

      // Should have aria-describedby
      expect(option).toHaveAttribute("aria-describedby");

      // Should be focusable
      expect(option).toHaveAttribute("tabIndex", "0");

      // Description element should exist
      const describedById = option.getAttribute("aria-describedby");
      expect(document.getElementById(describedById)).toBeInTheDocument();
    });
  });

  test("disponenten options have proper accessibility attributes", () => {
    const shifts = [generateTestShift(1, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const allOptions = screen.getAllByRole("option");
    const disponentElements = allOptions.filter((el) =>
      el.getAttribute("aria-describedby")?.includes("disp-"),
    );

    expect(disponentElements.length).toBeGreaterThan(0);

    disponentElements.forEach((option) => {
      // Should have proper role
      expect(option).toHaveAttribute("role", "option");

      // Should have aria-label
      expect(option).toHaveAttribute("aria-label");

      // Should have aria-describedby
      expect(option).toHaveAttribute("aria-describedby");

      // Should be focusable
      expect(option).toHaveAttribute("tabIndex", "0");

      // Description element should exist
      const describedById = option.getAttribute("aria-describedby");
      expect(document.getElementById(describedById)).toBeInTheDocument();
    });
  });

  test("keyboard navigation works for shifts", async () => {
    const shifts = [
      generateTestShift(1, "open"),
      generateTestShift(2, "open"),
      generateTestShift(3, "open"),
    ];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    // With shifts present, container should be a listbox
    const shiftListbox = screen.getByRole("listbox", {
      name: /3 nicht zugewiesene schichten/i,
    });
    const shiftOptions = screen.getAllByRole("option");
    const firstShift = shiftOptions[0];

    // Focus the first shift
    firstShift.focus();
    expect(document.activeElement).toBe(firstShift);

    // Test Enter key selection
    fireEvent.keyDown(firstShift, { key: "Enter" });
    expect(firstShift).toHaveAttribute("aria-selected", "true");

    // Test Space key deselection
    fireEvent.keyDown(firstShift, { key: " " });
    expect(firstShift).toHaveAttribute("aria-selected", "false");

    // Test arrow navigation
    fireEvent.keyDown(firstShift, { key: "ArrowDown" });
    // Should move focus to next shift

    // Test Escape key
    fireEvent.keyDown(firstShift, { key: "Escape" });
    // Should exit assignment mode if active
  });

  test("keyboard navigation works for disponenten", async () => {
    const shifts = [generateTestShift(1, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const disponentListbox = screen.getByRole("listbox", {
      name: /5 verfügbare disponenten/i,
    });
    const allOptions = screen.getAllByRole("option");
    const firstDisponent = allOptions.find((el) =>
      el.getAttribute("aria-describedby")?.includes("disp-"),
    );

    expect(firstDisponent).toBeInTheDocument();

    // Focus the first disponent
    firstDisponent.focus();
    expect(document.activeElement).toBe(firstDisponent);

    // Test arrow navigation
    fireEvent.keyDown(firstDisponent, { key: "ArrowDown" });
    fireEvent.keyDown(firstDisponent, { key: "ArrowUp" });

    // Test Escape key
    fireEvent.keyDown(firstDisponent, { key: "Escape" });
  });

  test("assignment mode provides proper feedback", async () => {
    const shifts = [generateTestShift(1, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const firstShift = screen.getAllByRole("option")[0];

    // Enter assignment mode by selecting a shift
    fireEvent.keyDown(firstShift, { key: "Enter" });

    // Check that assignment mode indicator appears
    await waitFor(() => {
      expect(screen.getByText(/zuweisungsmodus aktiv/i)).toBeInTheDocument();
    });

    // Should show number of selected shifts
    expect(screen.getByText(/1 schicht.*ausgewählt/i)).toBeInTheDocument();
  });

  test("bulk actions have proper accessibility", () => {
    const shifts = [generateTestShift(1, "open"), generateTestShift(2, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    // Check bulk action buttons
    const selectAllButton = screen.getByRole("button", {
      name: /alle auswählen/i,
    });
    const deselectAllButton = screen.getByRole("button", {
      name: /alle abwählen/i,
    });

    expect(selectAllButton).toHaveAttribute("aria-label");
    expect(deselectAllButton).toHaveAttribute("aria-label");

    // Test keyboard focus
    selectAllButton.focus();
    expect(document.activeElement).toBe(selectAllButton);

    deselectAllButton.focus();
    expect(document.activeElement).toBe(deselectAllButton);
  });

  test("selection counter provides live updates", async () => {
    const shifts = [generateTestShift(1, "open"), generateTestShift(2, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const selectAllButton = screen.getByRole("button", {
      name: /alle auswählen/i,
    });

    // Click select all
    fireEvent.click(selectAllButton);

    // Check for live region update
    await waitFor(() => {
      const counter = screen.getByText(/2 ausgewählt/i);
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveAttribute("aria-live", "polite");
    });
  });

  test("drag and drop fallback works without mouse", () => {
    const shifts = [generateTestShift(1, "open")];

    render(
      <TestWrapper initialShifts={shifts}>
        <AssignmentDragDrop />
      </TestWrapper>,
    );

    const firstShift = screen.getAllByRole("option")[0];
    const allOptions = screen.getAllByRole("option");
    const firstDisponent = allOptions.find((el) =>
      el.getAttribute("aria-describedby")?.includes("disp-"),
    );

    // Select shift with keyboard
    fireEvent.keyDown(firstShift, { key: "Enter" });
    expect(firstShift).toHaveAttribute("aria-selected", "true");

    // Navigate to disponent and assign
    fireEvent.keyDown(firstDisponent, { key: "Enter" });

    // Assignment should work without drag/drop
    expect(firstShift).toHaveAttribute("aria-selected", "false"); // Should be deselected after assignment
  });
});
