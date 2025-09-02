import { render, screen, fireEvent } from "@testing-library/react";

import AutoAssignModal from "../components/AutoAssignModal";

// Mock dependencies
jest.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key) => key,
  }),
}));

const mockOnClose = jest.fn();
const mockOnConfirm = jest.fn();

const samplePlannedAssignments = [
  {
    shift: {
      id: "shift_1",
      date: "2025-01-06",
      start: "06:00",
      end: "14:00",
      type: "Frueh",
    },
    disponent: {
      id: "disp_1",
      name: "Anna Schmidt",
    },
    hasConflicts: false,
    conflictReasons: [],
  },
  {
    shift: {
      id: "shift_2",
      date: "2025-01-06",
      start: "22:00",
      end: "06:00",
      type: "Nacht",
    },
    disponent: {
      id: "disp_2",
      name: "Max Weber",
    },
    hasConflicts: true,
    conflictReasons: ["User has conflicting shifts on the same day"],
  },
];

describe("AutoAssignModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should not render when isOpen is false", () => {
    render(
      <AutoAssignModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={[]}
      />,
    );

    expect(
      screen.queryByText("Automatische Zuteilung"),
    ).not.toBeInTheDocument();
  });

  test("should render modal with rules and assignments when isOpen is true", () => {
    render(
      <AutoAssignModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={samplePlannedAssignments}
      />,
    );

    // Check modal title
    expect(screen.getByText("Automatische Zuteilung")).toBeInTheDocument();

    // Check rules section
    expect(screen.getByText("Zuweisungsregeln:")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Offene Schichten werden automatisch verfügbaren Disponenten zugewiesen/,
      ),
    ).toBeInTheDocument();

    // Check planned assignments
    expect(screen.getByText("Geplante Zuweisungen:")).toBeInTheDocument();
    expect(
      screen.getByText("2025-01-06 - 06:00 bis 14:00"),
    ).toBeInTheDocument();
    expect(screen.getByText("→ Anna Schmidt")).toBeInTheDocument();
    expect(
      screen.getByText("2025-01-06 - 22:00 bis 06:00"),
    ).toBeInTheDocument();
    expect(screen.getByText("→ Max Weber")).toBeInTheDocument();

    // Check conflict warning
    expect(screen.getByText("Konflikte erkannt")).toBeInTheDocument();
    expect(screen.getByText("⚠️ Konflikt erkannt")).toBeInTheDocument();

    // Check buttons
    expect(screen.getByText("Abbrechen")).toBeInTheDocument();
    expect(screen.getByText("2 Zuweisungen bestätigen")).toBeInTheDocument();
  });

  test("should show no assignments message when no assignments available", () => {
    render(
      <AutoAssignModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={[]}
      />,
    );

    expect(
      screen.getByText(/Keine automatischen Zuweisungen möglich/),
    ).toBeInTheDocument();
    expect(screen.getByText("Keine Zuweisungen möglich")).toBeInTheDocument();
  });

  test("should call onClose when Abbrechen button is clicked", () => {
    render(
      <AutoAssignModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={samplePlannedAssignments}
      />,
    );

    fireEvent.click(screen.getByText("Abbrechen"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test("should call onConfirm when confirm button is clicked", async () => {
    mockOnConfirm.mockResolvedValue();

    render(
      <AutoAssignModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={samplePlannedAssignments}
      />,
    );

    fireEvent.click(screen.getByText("2 Zuweisungen bestätigen"));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test("should disable confirm button when no assignments", () => {
    render(
      <AutoAssignModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        plannedAssignments={[]}
      />,
    );

    const confirmButton = screen.getByText("Keine Zuweisungen möglich");
    expect(confirmButton).toBeDisabled();
  });
});
