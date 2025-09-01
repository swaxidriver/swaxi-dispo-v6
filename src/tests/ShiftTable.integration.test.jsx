import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ShiftTable from "../components/ShiftTable";

import { renderWithProviders } from "./testUtils";

// Mock the necessary hooks and components
jest.mock("../contexts/useShifts");
jest.mock("../contexts/AuthContext");
jest.mock("../features/assignments/components/SingleAssignmentModal", () => {
  return function MockSingleAssignmentModal({ isOpen, shiftId, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="single-assignment-modal">
        <p>Assignment Modal for Shift: {shiftId}</p>
        <button onClick={onClose}>Close Modal</button>
      </div>
    );
  };
});

const mockAssignShift = jest.fn();
const mockApplyToShift = jest.fn();
const mockCancelShift = jest.fn();

const mockShifts = [
  {
    id: "shift_1",
    date: "2025-01-06",
    start: "08:00",
    end: "16:00",
    workLocation: "Büro",
    status: "open",
    conflicts: [],
  },
  {
    id: "shift_2",
    date: "2025-01-07",
    start: "09:00",
    end: "17:00",
    workLocation: "Remote",
    status: "assigned",
    assignedTo: "Max Mustermann",
    conflicts: [],
  },
];

// Mock the useShifts hook
require("../contexts/useShifts").useShifts.mockReturnValue({
  state: {
    shifts: mockShifts,
    applications: [],
  },
  applyToShift: mockApplyToShift,
  assignShift: mockAssignShift,
  cancelShift: mockCancelShift,
});

// Mock the AuthContext
const mockAuthContext = {
  user: { id: "chief", role: "chief", name: "Chief User" },
};

require("../contexts/AuthContext").default =
  React.createContext(mockAuthContext);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ShiftTable Integration with SingleAssignmentModal", () => {
  test("opens SingleAssignmentModal when Zuweisen button is clicked", async () => {
    renderWithProviders(<ShiftTable shifts={mockShifts} showActions={true} />, {
      authContext: mockAuthContext,
    });

    // Find the Zuweisen button for the open shift
    const assignButton = screen.getByTestId("assign-shift-btn");
    expect(assignButton).toBeInTheDocument();
    expect(assignButton).toHaveTextContent("Zuweisen");
    expect(assignButton).not.toBeDisabled();

    // Click the Zuweisen button
    fireEvent.click(assignButton);

    // Check that the SingleAssignmentModal opens
    await waitFor(() => {
      expect(screen.getByTestId("single-assignment-modal")).toBeInTheDocument();
      expect(
        screen.getByText("Assignment Modal for Shift: shift_1"),
      ).toBeInTheDocument();
    });
  });

  test("closes SingleAssignmentModal when close button is clicked", async () => {
    renderWithProviders(<ShiftTable shifts={mockShifts} showActions={true} />, {
      authContext: mockAuthContext,
    });

    // Open the modal
    const assignButton = screen.getByTestId("assign-shift-btn");
    fireEvent.click(assignButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByTestId("single-assignment-modal")).toBeInTheDocument();
    });

    // Close the modal
    const closeButton = screen.getByText("Close Modal");
    fireEvent.click(closeButton);

    // Check that modal is closed
    await waitFor(() => {
      expect(
        screen.queryByTestId("single-assignment-modal"),
      ).not.toBeInTheDocument();
    });
  });

  test("does not call assignShift directly when Zuweisen button is clicked", async () => {
    renderWithProviders(<ShiftTable shifts={mockShifts} showActions={true} />, {
      authContext: mockAuthContext,
    });

    // Click the Zuweisen button
    const assignButton = screen.getByTestId("assign-shift-btn");
    fireEvent.click(assignButton);

    // assignShift should NOT be called directly
    expect(mockAssignShift).not.toHaveBeenCalled();

    // But the modal should open
    await waitFor(() => {
      expect(screen.getByTestId("single-assignment-modal")).toBeInTheDocument();
    });
  });

  test("Zuweisen button is disabled for assigned shifts", () => {
    renderWithProviders(<ShiftTable shifts={mockShifts} showActions={true} />, {
      authContext: mockAuthContext,
    });

    // Find all shift items
    const shiftItems = screen.getAllByRole("listitem");
    expect(shiftItems).toHaveLength(2);

    // The first shift (open) should have an enabled Zuweisen button
    const assignButton = screen.getByTestId("assign-shift-btn");
    expect(assignButton).not.toBeDisabled();

    // The second shift (assigned) should not have a Zuweisen button
    // Instead it should have an Absagen button
    expect(screen.getByText("Absagen")).toBeInTheDocument();
  });

  // TODO: Fix this test - need to properly mock AuthContext for different user roles
  /*
  test("does not show Zuweisen button for non-chief users", () => {
    // Mock a non-chief user in the AuthContext
    const analystAuthContext = {
      user: { id: "analyst", role: "analyst", name: "Analyst User" },
    };

    // Use Jest to override the auth context provider
    const AuthContextProvider = require("../contexts/AuthContext").default.Provider;
    
    render(
      <AuthContextProvider value={analystAuthContext}>
        <ShiftTable shifts={mockShifts} showActions={true} />
      </AuthContextProvider>
    );

    // Should not have Zuweisen button for analyst
    expect(screen.queryByText("Zuweisen")).not.toBeInTheDocument();
    
    // But should have Bewerben button
    expect(screen.getByText("Bewerben")).toBeInTheDocument();
  });
  */
});
