import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import SingleAssignmentModal from "../features/assignments/components/SingleAssignmentModal";

import { renderWithProviders } from "./testUtils";

// Mock the necessary hooks
jest.mock("../contexts/useShifts");
jest.mock("../contexts/useAuth");

const mockOnClose = jest.fn();
const mockAssignShift = jest.fn();

const mockShifts = [
  {
    id: "shift_1",
    date: "2025-01-06",
    start: "08:00",
    end: "16:00",
    workLocation: "Büro",
    status: "open",
  },
];

const mockApplications = [
  {
    id: "app_1",
    shiftId: "shift_1",
    userId: "user_1",
    comment: "Kann gerne diese Schicht übernehmen",
    status: "pending",
    createdAt: "2025-01-01T10:00:00Z",
  },
  {
    id: "app_2",
    shiftId: "shift_1",
    userId: "user_2",
    comment: "Verfügbar für diese Zeit",
    status: "pending",
    createdAt: "2025-01-01T11:00:00Z",
  },
];

const mockDisponenten = [
  {
    id: "user_1",
    name: "Max Mustermann",
    role: "analyst",
    availability: "available",
    email: "max@example.com",
  },
  {
    id: "user_2",
    name: "Anna Schmidt",
    role: "analyst",
    availability: "available",
    email: "anna@example.com",
  },
];

// Mock the useShifts hook
require("../contexts/useShifts").useShifts.mockReturnValue({
  state: {
    shifts: mockShifts,
    applications: mockApplications,
  },
  assignShift: mockAssignShift,
});

// Mock the useAuth hook
require("../contexts/useAuth").useAuth.mockReturnValue({
  user: { id: "chief", role: "chief", name: "Chief User" },
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SingleAssignmentModal", () => {
  test("renders modal with shift details and applicants", () => {
    renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    // Check for modal title
    expect(screen.getByText("Schicht zuweisen")).toBeInTheDocument();

    // Check for shift details
    expect(screen.getByText("Schichtdetails")).toBeInTheDocument();
    expect(screen.getByText(/2025-01-06 • 08:00-16:00/)).toBeInTheDocument();
    expect(screen.getByText(/Büro/)).toBeInTheDocument();

    // Check for applicant selection
    expect(
      screen.getByText("Bewerber auswählen (2 Bewerbungen):"),
    ).toBeInTheDocument();

    // Check that applicants are listed
    expect(screen.getByText("Max Mustermann")).toBeInTheDocument();
    expect(screen.getByText("Anna Schmidt")).toBeInTheDocument();
    expect(
      screen.getByText("Kann gerne diese Schicht übernehmen"),
    ).toBeInTheDocument();
    expect(screen.getByText("Verfügbar für diese Zeit")).toBeInTheDocument();
  });

  test("enables assign button when applicant is selected", async () => {
    renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    const assignButton = screen.getByRole("button", { name: /zuweisen/i });

    // Initially disabled (no applicant selected)
    expect(assignButton).toBeDisabled();

    // Select an applicant
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons.length).toBe(2);

    fireEvent.click(radioButtons[0]); // Select first applicant

    // Should now be enabled
    await waitFor(() => {
      expect(assignButton).not.toBeDisabled();
    });
  });

  test("displays confirmation dialog and performs assignment", async () => {
    renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    // Select an applicant
    const radioButtons = screen.getAllByRole("radio");
    fireEvent.click(radioButtons[0]); // Select first applicant

    const assignButton = screen.getByRole("button", { name: /zuweisen/i });
    fireEvent.click(assignButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Zuweisung bestätigen")).toBeInTheDocument();
      expect(
        screen.getByText(/Sie sind dabei, die Schicht an user_1 zuzuweisen/),
      ).toBeInTheDocument();
    });

    // Confirm assignment
    const confirmButton = screen.getByRole("button", { name: "Bestätigen" });
    fireEvent.click(confirmButton);

    // Should call assignShift
    await waitFor(() => {
      expect(mockAssignShift).toHaveBeenCalledWith("shift_1", "user_1");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("handles auto-reject others option", async () => {
    renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    // Enable auto-reject option
    const autoRejectCheckbox = screen.getByLabelText(
      "Nicht ausgewählte Bewerbungen automatisch ablehnen",
    );
    fireEvent.click(autoRejectCheckbox);
    expect(autoRejectCheckbox).toBeChecked();

    // Select an applicant
    const radioButtons = screen.getAllByRole("radio");
    fireEvent.click(radioButtons[0]);

    const assignButton = screen.getByRole("button", { name: /zuweisen/i });
    fireEvent.click(assignButton);

    // Should show confirmation dialog with auto-reject warning
    await waitFor(() => {
      expect(screen.getByText("Zuweisung bestätigen")).toBeInTheDocument();
      expect(
        screen.getByText(/Andere Bewerbungen ablehnen/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "1 nicht ausgewählte Bewerbung wird automatisch abgelehnt.",
        ),
      ).toBeInTheDocument();
    });
  });

  test("does not render for non-chief users", () => {
    // Override the auth mock for this test
    jest.doMock("../contexts/useAuth", () => ({
      useAuth: () => ({
        user: { id: "user", role: "analyst", name: "Regular User" },
      }),
    }));

    const { container } = renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  test("handles shift with no applications", () => {
    // Override the useShifts mock for this test
    require("../contexts/useShifts").useShifts.mockReturnValue({
      state: {
        shifts: mockShifts,
        applications: [], // No applications
      },
      assignShift: mockAssignShift,
    });

    renderWithProviders(
      <SingleAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        shiftId="shift_1"
        disponenten={mockDisponenten}
      />,
    );

    expect(
      screen.getByText("Bewerber auswählen (0 Bewerbungen):"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Keine Bewerbungen für diese Schicht vorhanden."),
    ).toBeInTheDocument();

    // Assign button should be disabled
    const assignButton = screen.getByRole("button", { name: /zuweisen/i });
    expect(assignButton).toBeDisabled();
  });
});
