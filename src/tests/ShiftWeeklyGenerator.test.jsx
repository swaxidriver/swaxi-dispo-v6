import { render, screen, fireEvent } from "@testing-library/react";

import ShiftWeeklyGenerator from "../components/ShiftWeeklyGenerator";

// Mock dependencies
jest.mock("../contexts/useShiftTemplates", () => ({
  useShiftTemplates: jest.fn(),
}));

jest.mock("../contexts/useShifts", () => ({
  useShifts: jest.fn(),
}));

jest.mock("../services/auditService", () => ({
  logCurrentUserAction: jest.fn(),
}));

jest.mock("../services/shiftGenerationService", () => ({
  generateShifts: jest.fn(),
}));

const { useShiftTemplates } = jest.requireMock("../contexts/useShiftTemplates");
const { useShifts } = jest.requireMock("../contexts/useShifts");
const { generateShifts } = jest.requireMock(
  "../services/shiftGenerationService",
);

const mockTemplates = [
  {
    id: "1",
    name: "Morning",
    startTime: "08:00",
    endTime: "12:00",
    days: ["Mo", "Tu"],
    color: "#3B82F6",
  },
  {
    id: "2",
    name: "Evening",
    startTime: "18:00",
    endTime: "22:00",
    days: ["Fr", "Sa"],
    color: "#EF4444",
  },
];

const addShift = jest.fn();

function setup() {
  useShiftTemplates.mockReturnValue({ templates: mockTemplates });
  useShifts.mockReturnValue({ addShift });
  generateShifts.mockReturnValue([
    {
      id: "shift-1",
      name: "Morning",
      date: "2025-01-06",
      start: "08:00",
      end: "12:00",
    },
  ]);
  render(<ShiftWeeklyGenerator />);
}

describe("ShiftWeeklyGenerator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders generator form", () => {
    setup();
    expect(screen.getByText("Weekly Shift Generator")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Number of Weeks")).toBeInTheDocument();
  });

  test("displays available templates for selection", () => {
    setup();
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
    expect(screen.getByText("Select Templates")).toBeInTheDocument();
  });

  test("can select templates and generate preview", () => {
    setup();

    // Select a template
    const morningCheckbox = screen.getByRole("checkbox", { name: /Morning/i });
    fireEvent.click(morningCheckbox);

    // Generate preview
    const generateBtn = screen.getByRole("button", {
      name: "Generate Preview",
    });
    fireEvent.click(generateBtn);

    expect(generateShifts).toHaveBeenCalled();
    expect(screen.getByText("Generation Preview")).toBeInTheDocument();
  });

  test("shows message when no templates available", () => {
    useShiftTemplates.mockReturnValue({ templates: [] });
    useShifts.mockReturnValue({ addShift });
    render(<ShiftWeeklyGenerator />);

    expect(
      screen.getByText("No templates available. Create templates first."),
    ).toBeInTheDocument();
  });
});
