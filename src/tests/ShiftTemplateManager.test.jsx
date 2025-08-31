import { render, screen, fireEvent } from "@testing-library/react";

import ShiftTemplateManager from "../components/ShiftTemplateManager";

jest.mock("../contexts/useShiftTemplates", () => ({
  useShiftTemplates: jest.fn(),
}));

jest.mock("../services/auditService", () => ({
  logCurrentUserAction: jest.fn(),
}));

const { useShiftTemplates } = jest.requireMock("../contexts/useShiftTemplates");

const templates = [
  {
    id: "1",
    name: "Morning",
    startTime: "08:00",
    endTime: "12:00",
    days: ["Mo", "Tu"],
  },
];
const addTemplate = jest.fn();
const updateTemplate = jest.fn();
const deleteTemplate = jest.fn();

function setup() {
  useShiftTemplates.mockReturnValue({
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  });
  render(<ShiftTemplateManager />);
}

describe("ShiftTemplateManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete functionality
    globalThis.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    delete globalThis.confirm;
  });

  test("adds a new template", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText("Template Name"), {
      target: { value: "Late" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "" }), {
      target: { value: "Late" },
    });
    // Target time inputs via their type attribute selectors
    const timeInputs = screen.getAllByDisplayValue("");
    fireEvent.change(timeInputs[0], { target: { value: "13:00" } });
    fireEvent.change(timeInputs[1], { target: { value: "17:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Mo" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Template" }));
    expect(addTemplate).toHaveBeenCalledWith({
      name: "Late",
      startTime: "13:00",
      endTime: "17:00",
      days: ["Mo"],
      color: "#3B82F6",
    });
  });

  test("edits existing template", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const nameInput = screen.getByDisplayValue("Morning");
    fireEvent.change(nameInput, { target: { value: "Morning Shift" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Template" }));
    expect(updateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", name: "Morning Shift" }),
    );
  });

  test("deletes template", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(globalThis.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete template "Morning"?',
    );
    expect(deleteTemplate).toHaveBeenCalledWith("1");
  });
});
