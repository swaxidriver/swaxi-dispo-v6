import {
  overlaps,
  computeDuration,
  computeShiftConflicts,
  isShortTurnaround,
  minutesBetweenShifts,
  detectShiftOverlap,
} from "../utils/shifts";
import { enhance_shift_with_datetime } from "../utils/time-utils";

describe("shifts utils", () => {
  test("overlaps detects same-day overlap and non-overlap", () => {
    expect(overlaps("08:00", "10:00", "09:30", "11:00")).toBe(true);
    expect(overlaps("08:00", "10:00", "10:00", "12:00")).toBe(false);
  });

  test("overlaps detects cross-midnight overlap", () => {
    // Shift A 22:00-02:00 overlaps shift B 01:00-03:00
    expect(overlaps("22:00", "02:00", "01:00", "03:00")).toBe(true);
  });

  test("computeDuration handles over-midnight", () => {
    expect(computeDuration("22:00", "02:00")).toBe(240);
  });

  test("computeShiftConflicts detects multiple conflict types", () => {
    const shiftA = {
      id: "A",
      date: "2024-07-01",
      start: "09:00",
      end: "11:00",
      status: "assigned",
      assignedTo: "U1",
      workLocation: "office",
    };
    const shiftB = {
      id: "B",
      date: "2024-07-01",
      start: "10:00",
      end: "12:00",
      status: "assigned",
      assignedTo: "U1",
      workLocation: "home",
    };
    const apps = [
      { id: "appA", shiftId: "A", userId: "userX" },
      { id: "appB", shiftId: "B", userId: "userX" },
    ];
    const conflicts = computeShiftConflicts(shiftA, [shiftB], apps);
    expect(conflicts).toEqual(
      expect.arrayContaining([
        "TIME_OVERLAP",
        "ASSIGNMENT_COLLISION",
        "LOCATION_MISMATCH",
        "DOUBLE_APPLICATION",
      ]),
    );
  });

  test("isShortTurnaround true for small gap", () => {
    const s1 = enhance_shift_with_datetime({
      id: "s1",
      date: "2024-07-01",
      start: "08:00",
      end: "10:00",
      status: "assigned",
    });
    const s2 = enhance_shift_with_datetime({
      id: "s2",
      date: "2024-07-01",
      start: "15:00",
      end: "18:00",
      status: "assigned",
    });
    // Gap 5h (300m) < 480
    expect(isShortTurnaround(s1, s2, 480)).toBe(true);
  });

  test("minutesBetweenShifts uses datetime for cross-midnight", () => {
    const s1 = enhance_shift_with_datetime({
      id: "c1",
      date: "2024-07-01",
      start: "22:00",
      end: "02:00",
    });
    const s2 = enhance_shift_with_datetime({
      id: "c2",
      date: "2024-07-02",
      start: "03:00",
      end: "05:00",
    });
    const gap = minutesBetweenShifts(s1, s2);
    // s1 ends 02:00 next day, s2 starts 03:00 -> 60 minutes
    expect(gap).toBe(60);
  });

  test("detectShiftOverlap handles cross-date via enhancement", () => {
    const a = { id: "d1", date: "2024-07-01", start: "23:00", end: "01:00" };
    const b = { id: "d2", date: "2024-07-02", start: "00:30", end: "02:00" };
    // Mixed enhancement internally
    expect(detectShiftOverlap(a, b)).toBe(true);
  });
});
