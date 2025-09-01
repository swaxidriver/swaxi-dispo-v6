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
      applications: [],
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

  test("renders modal with selected shifts", () => {
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
  });

  test("enables assign button when disponent is selected", async () => {
    renderWithProviders(
      <BatchAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        selectedShifts={["shift_1", "shift_2"]}
        disponenten={mockDisponenten}
      />,
    );

    const select = screen.getByLabelText("Disponent auswählen");
    const assignButton = screen.getByRole("button", { name: /zuweisen/ });

    // Initially disabled
    expect(assignButton).toBeDisabled();

    // Select a disponent
    fireEvent.change(select, { target: { value: "Anna Schmidt (analyst)" } });

    // Should now be enabled
    await waitFor(() => {
      expect(assignButton).not.toBeDisabled();
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

    // Select disponent and assign
    const select = screen.getByLabelText("Disponent auswählen");
    fireEvent.change(select, { target: { value: "Anna Schmidt (analyst)" } });

    const assignButton = screen.getByRole("button", { name: /zuweisen/ });
    fireEvent.click(assignButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(
        screen.getByText("Sammelzuweisung bestätigen"),
      ).toBeInTheDocument();
      expect(screen.getByText(/Anna Schmidt/)).toBeInTheDocument();
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
