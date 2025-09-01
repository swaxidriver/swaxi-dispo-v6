import { waitFor } from "@testing-library/react";

import ApplicationConfirmationModal from "../components/ApplicationConfirmationModal";

import { renderWithProviders } from "./testUtils";
import { screen, fireEvent } from "./testUtils";

const mockShift = {
  id: "s1",
  date: new Date("2025-08-25"),
  start: "18:00",
  end: "20:00",
  type: "evening",
};

const mockShifts = [
  mockShift,
  {
    id: "s2",
    date: new Date("2025-08-26"),
    start: "19:00",
    end: "21:00",
    type: "night",
  },
];

describe("ApplicationConfirmationModal", () => {
  it("does not render when closed", () => {
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        shift={mockShift}
        isMultiple={false}
      />,
    );
    expect(screen.queryByText("Bewerbung bestätigen")).not.toBeInTheDocument();
  });

  it("renders single shift confirmation dialog", () => {
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    expect(screen.getByText("Bewerbung bestätigen")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sie bewerben sich für diesen Dienst. Möchten Sie fortfahren?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/18:00 bis 20:00/)).toBeInTheDocument();
    expect(screen.getByText(/evening/)).toBeInTheDocument();
  });

  it("renders multiple shifts confirmation dialog", () => {
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        shifts={mockShifts}
        isMultiple={true}
      />,
    );

    expect(screen.getByText("Bewerbung bestätigen")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sie bewerben sich für 2 Dienste. Möchten Sie fortfahren?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Ausgewählte Dienste:")).toBeInTheDocument();
    expect(screen.getByText(/18:00 bis 20:00/)).toBeInTheDocument();
    expect(screen.getByText(/19:00 bis 21:00/)).toBeInTheDocument();
    expect(screen.getByText(/evening/)).toBeInTheDocument();
    expect(screen.getByText(/night/)).toBeInTheDocument();
  });

  it("allows entering a comment", () => {
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    const commentField = screen.getByLabelText("Kommentar (optional)");
    fireEvent.change(commentField, {
      target: { value: "Kann flexibel starten" },
    });
    expect(commentField.value).toBe("Kann flexibel starten");
  });

  it("calls onConfirm with comment when confirmed", async () => {
    const mockOnConfirm = jest.fn();
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={mockOnConfirm}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    const commentField = screen.getByLabelText("Kommentar (optional)");
    fireEvent.change(commentField, { target: { value: "Test comment" } });

    const confirmButton = screen.getByText("Bewerben");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith("Test comment");
    });
  });

  it("calls onClose when cancelled", () => {
    const mockOnClose = jest.fn();
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={() => {}}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    const cancelButton = screen.getByText("Abbrechen");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("shows loading state during submission", async () => {
    const mockOnConfirm = jest.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={mockOnConfirm}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    const confirmButton = screen.getByText("Bewerben");
    fireEvent.click(confirmButton);

    expect(screen.getByText("Bewerbe...")).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it("handles keyboard navigation", () => {
    const mockOnClose = jest.fn();
    renderWithProviders(
      <ApplicationConfirmationModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={() => {}}
        shift={mockShift}
        isMultiple={false}
      />,
    );

    // Escape key should close modal
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
