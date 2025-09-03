/**
 * Test for P1 Issue: Enhanced Conflict Summary Panel in BatchAssignmentModal
 * Tests the detailed conflict summary functionality for batch assignments
 */

import React from "react";
import { render, screen } from "@testing-library/react";

import "@testing-library/jest-dom";
import BatchAssignmentModal from "../features/assignments/components/BatchAssignmentModal";

// Mock shift data with conflicts for testing
const mockShiftsWithConflicts = [
  {
    id: "shift1",
    date: "2025-01-15",
    start: "08:00",
    end: "16:00",
    type: "Frühdienst",
    workLocation: "Office A",
    status: "open",
    assignedTo: null,
  },
  {
    id: "shift2",
    date: "2025-01-15",
    start: "14:00", // Overlaps with shift1
    end: "22:00",
    type: "Spätdienst",
    workLocation: "Office A",
    status: "open",
    assignedTo: null,
  },
  {
    id: "shift3",
    date: "2025-01-16",
    start: "08:00",
    end: "16:00",
    type: "Frühdienst",
    workLocation: "Office B", // Different location
    status: "assigned",
    assignedTo: "Hans Mueller",
  },
];

const mockApplicationsWithConflicts = [
  {
    id: "app1",
    shiftId: "shift1",
    userId: "user1",
    status: "pending",
    appliedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "app2",
    shiftId: "shift2",
    userId: "user1", // Same user applies to overlapping shifts
    status: "pending",
    appliedAt: "2025-01-10T11:00:00Z",
  },
  {
    id: "app3",
    shiftId: "shift3",
    userId: "user2",
    status: "pending",
    appliedAt: "2025-01-10T12:00:00Z",
  },
];

// Mock shifts without conflicts
const mockShiftsNoConflicts = [
  {
    id: "shift1",
    date: "2025-01-15",
    start: "08:00",
    end: "16:00",
    type: "Frühdienst",
    status: "open",
  },
  {
    id: "shift2",
    date: "2025-01-16", // Different day, no overlap
    start: "08:00",
    end: "16:00",
    type: "Frühdienst",
    status: "open",
  },
];

const mockUser = {
  id: "chief",
  name: "Chief User",
  role: "chief",
};

// Mock functions
const mockOnClose = jest.fn();
const mockAssignShift = jest.fn();

// Mock ShiftContext with conflicts
jest.mock("../contexts/useShifts", () => ({
  useShifts: () => ({
    state: {
      shifts: mockShiftsWithConflicts,
      applications: mockApplicationsWithConflicts,
    },
    assignShift: mockAssignShift,
  }),
}));

// Mock AuthContext to provide chief user
jest.mock("../contexts/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

describe("Enhanced Conflict Summary Panel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("displays enhanced conflict summary header", () => {
    render(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift1", "shift2"]} // These overlap
        disponenten={[]}
      />,
    );

    // Check that enhanced conflict summary header is displayed
    expect(
      screen.getByText(/Konflikte bei Sammelzuweisung erkannt/),
    ).toBeInTheDocument();
  });

  test("shows detailed conflict breakdown section", () => {
    render(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift1", "shift2"]}
        disponenten={[]}
      />,
    );

    // Check for detailed conflict breakdown section
    expect(screen.getByText(/Betroffene Schichten:/)).toBeInTheDocument();
  });

  test("displays conflict type counts", () => {
    render(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift1", "shift2"]}
        disponenten={[]}
      />,
    );

    // Check for conflict type count indicators in the summary section
    expect(
      screen.getByText(/🚫 Blockierende Konflikte \(/),
    ).toBeInTheDocument();
  });

  test("shows enhanced conflict information in individual shift cards", () => {
    render(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift1", "shift2"]}
        disponenten={[]}
      />,
    );

    // Should show enhanced conflict indicators in shift cards (multiple expected)
    const conflictIndicators = screen.getAllByText(/⚠️ Konflikt/);
    expect(conflictIndicators.length).toBeGreaterThan(0);
  });

  test("includes hint about conflict resolution", () => {
    render(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift1", "shift2"]}
        disponenten={[]}
      />,
    );

    // Should show guidance about conflicts
    expect(screen.getByText(/Hinweis:/)).toBeInTheDocument();
  });
});
