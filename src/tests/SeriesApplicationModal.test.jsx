import SeriesApplicationModal from "../components/SeriesApplicationModal";
import { SHIFT_STATUS } from "../utils/constants";
import * as useShiftsModule from "../contexts/useShifts";

import { renderWithProviders } from "./testUtils";
import { screen, fireEvent } from "./testUtils";

// Mock useShifts to observe applyToSeries calls without full provider complexity
const mockApplyToSeries = jest.fn();

jest
  .spyOn(useShiftsModule, "useShifts")
  .mockImplementation(() => ({ applyToSeries: mockApplyToSeries }));

function makeShift(id, dateStr, type = "evening") {
  return {
    id,
    date: new Date(dateStr),
    type,
    start: "18:00",
    end: "20:00",
    status: SHIFT_STATUS.OPEN,
  };
}

describe("SeriesApplicationModal", () => {
  beforeEach(() => {
    mockApplyToSeries.mockClear();
  });

  it("renders available shifts and allows selecting multiple via type shortcut", () => {
    const shifts = [
      makeShift("s1", "2025-08-25", "evening"),
      makeShift("s2", "2025-08-26", "evening"),
      makeShift("s3", "2025-08-27", "night"),
    ];
    renderWithProviders(
      <SeriesApplicationModal isOpen onClose={() => {}} shifts={shifts} />,
    );

    // 3 checkboxes for open shifts
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes.length).toBe(3);

    // Click shortcut for all evening shifts
    fireEvent.click(screen.getByText(/Alle Abend-Dienste/i));

    // Both evening shifts selected
    expect(boxes[0]).toBeChecked();
    expect(boxes[1]).toBeChecked();
    expect(boxes[2]).not.toBeChecked();

    // Submit
    fireEvent.click(screen.getByText("Bewerben"));
    expect(mockApplyToSeries).toHaveBeenCalledTimes(1);
    const [ids, user] = mockApplyToSeries.mock.calls[0];
    expect(ids.sort()).toEqual(["s1", "s2"]);
    expect(user).toBe("current-user");
  });

  it("disables submit when no selection and enables after selecting one", () => {
    const shifts = [makeShift("s1", "2025-08-25", "evening")];
    renderWithProviders(
      <SeriesApplicationModal isOpen onClose={() => {}} shifts={shifts} />,
    );
    const submit = screen.getByText("Bewerben");
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(submit).not.toBeDisabled();
  });
});
