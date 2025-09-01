import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import AssignmentDragDrop from "../../ui/assignment-dnd";
import { renderWithProviders } from "../testUtils";

// Mock data for tests
const mockShifts = [
  {
    id: "shift-1",
    type: "morning",
    date: "2024-01-15",
    start: "08:00",
    end: "16:00",
    status: "open",
    workLocation: "office",
  },
  {
    id: "shift-2",
    type: "afternoon",
    date: "2024-01-15",
    start: "14:00",
    end: "22:00",
    status: "open",
    workLocation: "office",
  },
  {
    id: "shift-3",
    type: "night",
    date: "2024-01-16",
    start: "22:00",
    end: "06:00",
    status: "open",
    workLocation: "home",
  },
];

const mockUser = {
  id: "chief-1",
  name: "Chief User",
  role: "chief",
};

describe("Multi-select Assignment UI", () => {
  test("should display multi-select controls on service list", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Check for "Alle Schichten auswählen" button (using aria-label)
    expect(
      screen.getByRole("button", { name: "Alle Schichten auswählen" }),
    ).toBeInTheDocument();

    // Check for "Alle Auswahlen entfernen" button (using aria-label)
    expect(
      screen.getByRole("button", { name: "Alle Auswahlen entfernen" }),
    ).toBeInTheDocument();

    // Check that individual shift items have checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(mockShifts.length);
  });

  test("should track selected services with visual feedback", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Select first shift
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);

    // Check that checkbox is checked
    expect(firstCheckbox).toBeChecked();

    // Check for selection badge
    expect(screen.getByText("1 ausgewählt")).toBeInTheDocument();

    // Check for "Ausgewählt" indicator
    expect(screen.getByText("✓ Ausgewählt")).toBeInTheDocument();
  });

  test("should show bulk toolbar when items are selected", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Initially, bulk toolbar should not be visible
    expect(screen.queryByText(/sammelzuweisung.*\(/i)).not.toBeInTheDocument();

    // Select a shift
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);

    // Now bulk toolbar should be visible
    expect(screen.getByText(/sammelzuweisung.*\(/i)).toBeInTheDocument();
    expect(
      screen.getByText("Schichten für Sammelzuweisung bereit"),
    ).toBeInTheDocument();
  });

  test("should persist selection until user cancels/confirms", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Select multiple shifts
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Verify both are selected
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(screen.getByText("2 ausgewählt")).toBeInTheDocument();

    // Selection should persist (not automatically cleared)
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
  });

  test("should allow deselecting individual items", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Select first shift
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).toBeChecked();

    // Deselect it
    fireEvent.click(firstCheckbox);
    expect(firstCheckbox).not.toBeChecked();

    // Selection count should be updated (no selection elements visible)
    expect(screen.queryByText("1 ausgewählt")).not.toBeInTheDocument();
  });

  test("should allow canceling selection", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Select shifts
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);

    // Click cancel button (in the top indicator)
    const cancelButtons = screen.getAllByRole("button", { name: /abbrechen/i });
    fireEvent.click(cancelButtons[0]);

    // All selections should be cleared
    expect(checkboxes[0]).not.toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(screen.queryByText("2 ausgewählt")).not.toBeInTheDocument();
  });

  test("should show selection indicator when items are selected", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Initially no selection indicator
    expect(screen.queryByText(/mehrfachauswahl/i)).not.toBeInTheDocument();

    // Select a shift
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);

    // Selection indicator should appear
    expect(screen.getByText(/mehrfachauswahl/i)).toBeInTheDocument();
    expect(screen.getByText("1 Schicht ausgewählt")).toBeInTheDocument();
  });

  test("should trigger batch assignment modal", () => {
    renderWithProviders(<AssignmentDragDrop />, {
      authUser: mockUser,
      providerProps: { initialShifts: mockShifts },
    });

    // Select shifts
    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(firstCheckbox);

    // Click batch assignment button (using the actual aria-label)
    const batchButton = screen.getByRole("button", {
      name: "1 Schichten als Sammelzuweisung zuweisen",
    });
    fireEvent.click(batchButton);

    // Modal should open (check for modal content)
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
