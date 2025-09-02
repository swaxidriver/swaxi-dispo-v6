import { render, screen, fireEvent } from "@testing-library/react";

import ShiftDesigner from "../pages/ShiftDesigner";

// Mock the child components
jest.mock("../components/ShiftTemplateManager", () => {
  return function MockShiftTemplateManager() {
    return <div data-testid="shift-template-manager">Template Manager</div>;
  };
});

jest.mock("../components/ShiftWeeklyGenerator", () => {
  return function MockShiftWeeklyGenerator() {
    return <div data-testid="shift-weekly-generator">Weekly Generator</div>;
  };
});

jest.mock("../contexts/ShiftTemplateContext", () => ({
  ShiftTemplateProvider: ({ children }) => <div>{children}</div>,
}));

describe("ShiftDesigner", () => {
  test("renders with default templates tab", () => {
    render(<ShiftDesigner />);

    expect(screen.getByText("Shift Designer")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create and manage shift templates, then generate shifts for multiple weeks.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("shift-template-manager")).toBeInTheDocument();
  });

  test("switches between tabs", () => {
    render(<ShiftDesigner />);

    // Initially on templates tab
    expect(screen.getByTestId("shift-template-manager")).toBeInTheDocument();

    // Switch to generator tab
    fireEvent.click(screen.getByRole("button", { name: /Generator/i }));
    expect(screen.getByTestId("shift-weekly-generator")).toBeInTheDocument();

    // Switch back to templates tab
    fireEvent.click(screen.getByRole("button", { name: /Templates/i }));
    expect(screen.getByTestId("shift-template-manager")).toBeInTheDocument();
  });

  test("shows help section", () => {
    render(<ShiftDesigner />);

    expect(
      screen.getByText("💡 How to use the Shift Designer"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Templates Tab:/)).toBeInTheDocument();
    expect(screen.getByText(/Generator Tab:/)).toBeInTheDocument();
  });
});
