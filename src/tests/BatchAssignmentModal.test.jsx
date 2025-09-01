import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { BatchAssignmentModal } from "../features/assignments";
import { ShiftProvider } from "../contexts/ShiftContext";
import { AuthProvider } from "../contexts/AuthContext";

// Mock shift data for testing
const mockShifts = [
  {
    id: "shift_1",
    date: "2025-01-06",
    type: "Frueh",
    start: "06:00",
    end: "14:00",
    workLocation: "office",
    status: "open",
  },
  {
    id: "shift_2",
    date: "2025-01-06",
    type: "Nacht",
    start: "22:00",
    end: "06:00",
    workLocation: "office",
    status: "open",
  },
];

// Mock applications for testing
const mockApplications = [
  {
    id: "app_1",
    shiftId: "shift_1",
    userId: "user_1",
    appliedAt: "2025-01-05T10:00:00Z",
    status: "pending",
  },
  {
    id: "app_2",
    shiftId: "shift_1",
    userId: "user_2",
    appliedAt: "2025-01-05T11:00:00Z",
    status: "pending",
  },
  {
    id: "app_3",
    shiftId: "shift_2",
    userId: "user_1",
    appliedAt: "2025-01-05T12:00:00Z",
    status: "pending",
  },
];

const mockDisponenten = [
  { id: "disp_1", name: "Anna Schmidt", role: "analyst" },
  { id: "disp_2", name: "Max Weber", role: "manager" },
];

// Mock functions
const mockOnClose = jest.fn();
const mockAssignShift = jest.fn();

// Mock ShiftContext
jest.mock("../contexts/useShifts", () => ({
  useShifts: () => ({
    state: {
      shifts: mockShifts,
      applications: mockApplications,
    },
    assignShift: mockAssignShift,
  }),
}));

// Mock AuthContext to provide chief user
jest.mock("../contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "chief", role: "chief", name: "Chief User" },
  }),
}));

const renderWithProviders = (ui) => {
  return render(
    <AuthProvider>
      <ShiftProvider>{ui}</ShiftProvider>
    </AuthProvider>,
  );
};

describe("BatchAssignmentModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders modal with selected shifts and applicants", () => {
    renderWithProviders(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1", "shift_2"]}
        disponenten={mockDisponenten}
      />,
    );

    expect(
      screen.getByText("Sammelzuweisung (2 Schichten)"),
    ).toBeInTheDocument();
    expect(screen.getByText("2025-01-06 • Frueh")).toBeInTheDocument();
    expect(screen.getByText("2025-01-06 • Nacht")).toBeInTheDocument();

    // Check for applicant selection interface
    expect(
      screen.getByText("Ausgewählte Schichten - Bewerber auswählen"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nicht ausgewählte Bewerbungen automatisch ablehnen"),
    ).toBeInTheDocument();

    // Should show applicants for shift_1 (has 2 applications)
    expect(
      screen.getByText("Bewerber auswählen (2 Bewerbungen):"),
    ).toBeInTheDocument();

    // Should show no applicants message for shift_2 (has 1 application)
    expect(
      screen.getByText("Bewerber auswählen (1 Bewerbung):"),
    ).toBeInTheDocument();
  });

  test("enables assign button when applicant is selected", async () => {
    renderWithProviders(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1", "shift_2"]}
        disponenten={mockDisponenten}
      />,
    );

    const assignButton = screen.getByRole("button", { name: /zuweisen/ });

    // Initially disabled (no applicants selected)
    expect(assignButton).toBeDisabled();
    expect(assignButton).toHaveTextContent("0 Schichten zuweisen");

    // Select an applicant for shift_1
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons.length).toBeGreaterThan(0);

    fireEvent.click(radioButtons[0]); // Select first applicant for shift_1

    // Should now be enabled and show 1 shift
    await waitFor(() => {
      expect(assignButton).not.toBeDisabled();
      expect(assignButton).toHaveTextContent("1 Schicht zuweisen");
    });
  });

  test("displays confirmation dialog and performs assignment", async () => {
    renderWithProviders(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1", "shift_2"]}
        disponenten={mockDisponenten}
      />,
    );

    // Select applicants for both shifts
    const radioButtons = screen.getAllByRole("radio");
    fireEvent.click(radioButtons[0]); // Select applicant for shift_1
    fireEvent.click(radioButtons[2]); // Select applicant for shift_2

    const assignButton = screen.getByRole("button", { name: /zuweisen/ });
    fireEvent.click(assignButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(
        screen.getByText("Sammelzuweisung bestätigen"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Sie sind dabei, 2 Schichten an die ausgewählten Bewerber zuzuweisen/,
        ),
      ).toBeInTheDocument();
    });

    // Confirm assignment
    const confirmButton = screen.getByRole("button", { name: "Bestätigen" });
    fireEvent.click(confirmButton);

    // Should call assignShift for both shifts
    await waitFor(() => {
      expect(mockAssignShift).toHaveBeenCalledTimes(2);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  test("handles auto-reject others option", async () => {
    renderWithProviders(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1"]}
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

    const assignButton = screen.getByRole("button", { name: /zuweisen/ });
    fireEvent.click(assignButton);

    // Should show confirmation dialog with auto-reject warning
    await waitFor(() => {
      expect(
        screen.getByText("Sammelzuweisung bestätigen"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Andere Bewerbungen ablehnen/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Nicht ausgewählte Bewerbungen werden automatisch abgelehnt.",
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
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1"]}
        disponenten={mockDisponenten}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
