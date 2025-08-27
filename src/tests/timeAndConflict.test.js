import {
  toMinutes,
  computeDuration,
  overlaps,
  computeShiftConflicts,
} from "../utils/shifts";

describe("Time & Conflict Utilities", () => {
  test("toMinutes parses HH:MM", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("23:59")).toBe(23 * 60 + 59);
    expect(Number.isNaN(toMinutes("24:00"))).toBe(true);
  });
  test("computeDuration normal and over-midnight", () => {
    expect(computeDuration("06:00", "14:00")).toBe(8 * 60);
    expect(computeDuration("22:00", "06:00")).toBe(8 * 60);
  });
  test("overlaps handles over-midnight segments", () => {
    expect(overlaps("22:00", "06:00", "05:00", "07:00")).toBe(true); // tail overlap
    expect(overlaps("22:00", "06:00", "07:00", "09:00")).toBe(false);
  });
  test("computeShiftConflicts TIME_OVERLAP detection", () => {
    const a = {
      id: "A",
      start: "22:00",
      end: "06:00",
      assignedTo: null,
      status: "open",
      workLocation: "office",
    };
    const b = {
      id: "B",
      start: "05:00",
      end: "09:00",
      assignedTo: null,
      status: "open",
      workLocation: "office",
    };
    const conflicts = computeShiftConflicts(a, [b], []);
    expect(conflicts).toContain("TIME_OVERLAP");
  });
  test("computeShiftConflicts DOUBLE_APPLICATION & ASSIGNMENT_COLLISION & LOCATION_MISMATCH", () => {
    const a = {
      id: "A",
      start: "08:00",
      end: "12:00",
      assignedTo: "User1",
      status: "assigned",
      workLocation: "office",
    };
    const b = {
      id: "B",
      start: "10:00",
      end: "14:00",
      assignedTo: "User1",
      status: "assigned",
      workLocation: "home",
    };
    const apps = [
      { id: "A_User1", shiftId: "A", userId: "User1" },
      { id: "B_User1", shiftId: "B", userId: "User1" },
    ];
    const conflictsA = computeShiftConflicts(a, [b], apps);
    expect(conflictsA).toEqual(
      expect.arrayContaining([
        "TIME_OVERLAP",
        "ASSIGNMENT_COLLISION",
        "LOCATION_MISMATCH",
      ]),
    );
  });
});
