/**
 * Unit Tests for Core Scheduling Utilities - Edge Cases and Error Scenarios
 *
 * This file contains comprehensive unit tests for pure scheduling utilities
 * from the scheduling library, focusing on edge cases and boundary conditions.
 */

import {
  calculateTimeOverlap,
  calculateShiftDuration,
  findSchedulingConflicts,
  checkShortTurnaround,
  generateShiftsFromTemplate,
  SCHEDULING_CONFLICT_CODES,
} from "../../lib/scheduling.js";

describe("Core Scheduling Utilities - Edge Cases", () => {
  describe("calculateTimeOverlap edge cases", () => {
    test("handles null/undefined time inputs", () => {
      expect(calculateTimeOverlap(null, "12:00", "10:00", "14:00")).toBe(false);
      expect(calculateTimeOverlap("10:00", null, "10:00", "14:00")).toBe(false);
      expect(calculateTimeOverlap(undefined, "12:00", "10:00", "14:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("10:00", "12:00", null, "14:00")).toBe(false);
    });

    test("handles empty string inputs", () => {
      expect(calculateTimeOverlap("", "12:00", "10:00", "14:00")).toBe(false);
      expect(calculateTimeOverlap("10:00", "", "10:00", "14:00")).toBe(false);
    });

    test("handles invalid time formats", () => {
      expect(calculateTimeOverlap("25:00", "12:00", "10:00", "14:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("12:60", "16:00", "10:00", "14:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("abc:def", "16:00", "10:00", "14:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("12", "16:00", "10:00", "14:00")).toBe(false);
    });

    test("handles boundary time cases", () => {
      // Exact boundary - should not overlap
      expect(calculateTimeOverlap("08:00", "12:00", "12:00", "16:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("12:00", "16:00", "08:00", "12:00")).toBe(
        false,
      );

      // One minute overlap
      expect(calculateTimeOverlap("08:00", "12:01", "12:00", "16:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("08:00", "12:00", "11:59", "16:00")).toBe(
        true,
      );
    });

    test("handles midnight boundary cases", () => {
      expect(calculateTimeOverlap("00:00", "08:00", "07:59", "16:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("00:00", "08:00", "08:00", "16:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("23:59", "00:01", "00:00", "01:00")).toBe(
        true,
      );
    });

    test("handles overnight shift overlaps comprehensively", () => {
      // Two overnight shifts with various overlaps
      expect(calculateTimeOverlap("22:00", "06:00", "23:00", "07:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("21:00", "05:00", "04:00", "08:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("20:00", "04:00", "03:00", "09:00")).toBe(
        true,
      );

      // Overnight vs regular at exact boundaries
      expect(calculateTimeOverlap("22:00", "06:00", "06:00", "14:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("22:00", "06:01", "06:00", "14:00")).toBe(
        true,
      );
    });

    test("handles same time inputs", () => {
      expect(calculateTimeOverlap("12:00", "12:00", "12:00", "12:00")).toBe(
        false,
      );
      expect(calculateTimeOverlap("08:00", "16:00", "08:00", "16:00")).toBe(
        true,
      );
    });

    test("handles maximum time values", () => {
      expect(calculateTimeOverlap("00:00", "23:59", "12:00", "13:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("23:59", "00:00", "23:30", "00:30")).toBe(
        true,
      );
    });
  });

  describe("calculateShiftDuration edge cases", () => {
    test("handles null/undefined inputs", () => {
      expect(calculateShiftDuration(null, "16:00")).toBe(0);
      expect(calculateShiftDuration("08:00", null)).toBe(0);
      expect(calculateShiftDuration(null, null)).toBe(0);
    });

    test("handles invalid time formats", () => {
      expect(calculateShiftDuration("invalid", "16:00")).toBe(0);
      expect(calculateShiftDuration("25:00", "16:00")).toBe(0);
      expect(calculateShiftDuration("08:60", "16:00")).toBe(0);
    });

    test("handles zero duration cases", () => {
      expect(calculateShiftDuration("12:00", "12:00")).toBe(0);
      expect(calculateShiftDuration("00:00", "00:00")).toBe(0);
    });

    test("handles overnight duration edge cases", () => {
      expect(calculateShiftDuration("23:59", "00:01")).toBe(2); // 2 minutes
      expect(calculateShiftDuration("23:00", "01:00")).toBe(120); // 2 hours
      expect(calculateShiftDuration("22:00", "06:00")).toBe(480); // 8 hours
      expect(calculateShiftDuration("00:01", "23:59")).toBe(1438); // Almost full day
    });

    test("handles maximum durations", () => {
      expect(calculateShiftDuration("00:00", "23:59")).toBe(1439); // 23:59
      expect(calculateShiftDuration("00:01", "00:00")).toBe(1439); // 23:59 overnight
    });

    test("handles boundary minute cases", () => {
      expect(calculateShiftDuration("00:00", "00:01")).toBe(1);
      expect(calculateShiftDuration("23:59", "23:59")).toBe(0);
      expect(calculateShiftDuration("23:58", "23:59")).toBe(1);
    });
  });

  describe("findSchedulingConflicts edge cases", () => {
    test("handles null/undefined inputs", () => {
      expect(findSchedulingConflicts(null, [], [])).toEqual([]);
      expect(findSchedulingConflicts({}, null, [])).toEqual([]);
      expect(findSchedulingConflicts({}, [], null)).toEqual([]);
    });

    test("handles target shift without required fields", () => {
      const incompleteShift = { id: "incomplete" };
      const existingShifts = [
        { id: "existing", date: "2025-01-15", start: "10:00", end: "14:00" },
      ];

      expect(() =>
        findSchedulingConflicts(incompleteShift, existingShifts, []),
      ).not.toThrow();
    });

    test("handles existing shifts without required fields", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      const incompleteShifts = [
        { id: "incomplete1" }, // Missing date/times
        { id: "incomplete2", date: "2025-01-15" }, // Missing times
        { id: "incomplete3", start: "10:00", end: "14:00" }, // Missing date
      ];

      const conflicts = findSchedulingConflicts(
        targetShift,
        incompleteShifts,
        [],
      );
      expect(conflicts).toEqual([]); // Should handle gracefully
    });

    test("handles empty arrays", () => {
      const shift = {
        id: "shift1",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      expect(findSchedulingConflicts(shift, [], [])).toEqual([]);
    });

    test("handles different dates (no overlap)", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      const existingShifts = [
        { id: "other1", date: "2025-01-16", start: "10:00", end: "14:00" },
        { id: "other2", date: "2025-01-14", start: "10:00", end: "14:00" },
      ];

      const conflicts = findSchedulingConflicts(
        targetShift,
        existingShifts,
        [],
      );
      expect(conflicts).toEqual([]);
    });

    test("handles complex assignment collision scenarios", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
        workLocation: "office",
      };

      const overlappingShifts = [
        {
          id: "overlap1",
          date: "2025-01-15",
          start: "10:00",
          end: "14:00",
          assignedTo: "user1",
          workLocation: "office",
        },
        {
          id: "overlap2",
          date: "2025-01-15",
          start: "12:00",
          end: "18:00",
          assignedTo: "user1",
          workLocation: "home",
        },
        {
          id: "overlap3",
          date: "2025-01-15",
          start: "14:00",
          end: "20:00",
          assignedTo: "user2",
          workLocation: "office",
        },
      ];

      const conflicts = findSchedulingConflicts(
        targetShift,
        overlappingShifts,
        [],
      );

      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
      expect(conflicts).toContain(
        SCHEDULING_CONFLICT_CODES.ASSIGNMENT_COLLISION,
      );
      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.LOCATION_MISMATCH);
    });

    test("handles location conflicts with null/undefined locations", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
        assignedTo: "user1",
        workLocation: null,
      };

      const overlappingShift = {
        id: "overlap",
        date: "2025-01-15",
        start: "10:00",
        end: "14:00",
        assignedTo: "user1",
        workLocation: "office",
      };

      const conflicts = findSchedulingConflicts(
        targetShift,
        [overlappingShift],
        [],
      );

      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
      expect(conflicts).toContain(
        SCHEDULING_CONFLICT_CODES.ASSIGNMENT_COLLISION,
      );
      expect(conflicts).not.toContain(
        SCHEDULING_CONFLICT_CODES.LOCATION_MISMATCH,
      );
    });

    test("handles complex double application scenarios", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      const overlappingShifts = [
        { id: "overlap1", date: "2025-01-15", start: "10:00", end: "14:00" },
        { id: "overlap2", date: "2025-01-15", start: "11:00", end: "15:00" },
      ];

      const applications = [
        { shiftId: "target", userId: "user1" },
        { shiftId: "target", userId: "user2" },
        { shiftId: "overlap1", userId: "user1" }, // Double application
        { shiftId: "overlap2", userId: "user3" },
        { shiftId: "other", userId: "user1" }, // Different, non-overlapping shift
      ];

      const conflicts = findSchedulingConflicts(
        targetShift,
        overlappingShifts,
        applications,
      );

      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.DOUBLE_APPLICATION);
    });

    test("handles applications with missing fields", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      const overlappingShift = {
        id: "overlap",
        date: "2025-01-15",
        start: "10:00",
        end: "14:00",
      };

      const applications = [
        { shiftId: null, userId: "user1" },
        { shiftId: "target", userId: null },
        { userId: "user2" }, // Missing shiftId
        { shiftId: "overlap" }, // Missing userId
      ];

      expect(() =>
        findSchedulingConflicts(targetShift, [overlappingShift], applications),
      ).not.toThrow();
    });

    test("handles large datasets efficiently", () => {
      const targetShift = {
        id: "target",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };

      // Create 1000 existing shifts
      const existingShifts = Array.from({ length: 1000 }, (_, i) => ({
        id: `shift${i}`,
        date: "2025-01-15",
        start: "10:00",
        end: "14:00",
      }));

      const conflicts = findSchedulingConflicts(
        targetShift,
        existingShifts,
        [],
      );
      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
    });
  });

  describe("checkShortTurnaround edge cases", () => {
    test("handles null/undefined inputs", () => {
      const shift = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      expect(checkShortTurnaround(null, shift)).toBe(false);
      expect(checkShortTurnaround(shift, null)).toBe(false);
      expect(checkShortTurnaround(null, null)).toBe(false);
    });

    test("handles shifts without assignedTo", () => {
      const shift1 = { date: "2025-01-15", start: "08:00", end: "16:00" };
      const shift2 = { date: "2025-01-15", start: "18:00", end: "22:00" };

      expect(checkShortTurnaround(shift1, shift2)).toBe(false);
    });

    test("handles different assigned users", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-15",
        start: "18:00",
        end: "22:00",
        assignedTo: "user2",
      };

      expect(checkShortTurnaround(shift1, shift2)).toBe(false);
    });

    test("handles different dates", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-16",
        start: "18:00",
        end: "22:00",
        assignedTo: "user1",
      };

      expect(checkShortTurnaround(shift1, shift2)).toBe(false);
    });

    test("handles invalid time formats", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "invalid",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-15",
        start: "18:00",
        end: "22:00",
        assignedTo: "user1",
      };

      expect(checkShortTurnaround(shift1, shift2)).toBe(false);
    });

    test("handles custom minimum rest periods", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-15",
        start: "18:00",
        end: "22:00",
        assignedTo: "user1",
      }; // 2 hour gap

      expect(checkShortTurnaround(shift1, shift2, 60)).toBe(false); // 1 hour minimum
      expect(checkShortTurnaround(shift1, shift2, 180)).toBe(true); // 3 hour minimum
      expect(checkShortTurnaround(shift1, shift2, 120)).toBe(false); // Exactly 2 hours
    });

    test("handles zero and negative gaps", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-15",
        start: "14:00",
        end: "22:00",
        assignedTo: "user1",
      }; // Overlap

      expect(checkShortTurnaround(shift1, shift2)).toBe(false); // Negative gap should be false
    });

    test("handles exact boundary cases", () => {
      const shift1 = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      const shift2 = {
        date: "2025-01-15",
        start: "16:00",
        end: "22:00",
        assignedTo: "user1",
      }; // No gap

      expect(checkShortTurnaround(shift1, shift2, 480)).toBe(true); // 0 < 480 minutes
      expect(checkShortTurnaround(shift1, shift2, 0)).toBe(false); // 0 is not < 0
    });

    test("handles same shift comparison", () => {
      const shift = {
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "user1",
      };
      expect(checkShortTurnaround(shift, shift)).toBe(true); // 0 minute gap
    });
  });

  describe("generateShiftsFromTemplate edge cases", () => {
    test("handles null/undefined inputs", () => {
      expect(generateShiftsFromTemplate(null, [])).toEqual([]);
      expect(generateShiftsFromTemplate({}, null)).toEqual([]);
      expect(generateShiftsFromTemplate(null, null)).toEqual([]);
    });

    test("handles empty arrays", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      expect(generateShiftsFromTemplate(template, [])).toEqual([]);
    });

    test("handles template without required fields", () => {
      const incompleteTemplate = { id: "template1" };
      const dates = ["2025-01-15"];

      const result = generateShiftsFromTemplate(incompleteTemplate, dates);
      expect(result.length).toBe(1);
      expect(result[0].name).toBeUndefined();
      expect(result[0].start).toBeUndefined();
    });

    test("handles empty dates array", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      expect(generateShiftsFromTemplate(template, [])).toEqual([]);
    });

    test("handles large date ranges", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      const dates = Array.from(
        { length: 365 },
        (_, i) =>
          `2025-${String(Math.floor(i / 30) + 1).padStart(2, "0")}-${String((i % 30) + 1).padStart(2, "0")}`,
      );

      const result = generateShiftsFromTemplate(template, dates);
      expect(result.length).toBe(365);

      // Check first and last shifts
      expect(result[0].date).toBe(dates[0]);
      expect(result[364].date).toBe(dates[364]);
    });

    test("handles template with all fields", () => {
      const template = {
        id: "template1",
        name: "Morning Shift",
        start: "08:00",
        end: "16:00",
        workLocation: "office",
        customField: "preserved",
      };
      const dates = ["2025-01-15"];

      const result = generateShiftsFromTemplate(template, dates);
      expect(result[0]).toEqual({
        id: "Morning Shift_2025-01-15_0",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        name: "Morning Shift",
        assignedTo: null,
        status: "open",
        workLocation: "office",
        templateId: "template1",
      });
    });

    test("handles template without workLocation", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      const dates = ["2025-01-15"];

      const result = generateShiftsFromTemplate(template, dates);
      expect(result[0].workLocation).toBe("office"); // Default value
    });

    test("generates unique IDs for multiple dates", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      const dates = ["2025-01-15", "2025-01-16", "2025-01-17"];

      const result = generateShiftsFromTemplate(template, dates);
      const ids = result.map((shift) => shift.id);

      expect(new Set(ids).size).toBe(3); // All IDs should be unique
      expect(ids[0]).toBe("Test_2025-01-15_0");
      expect(ids[1]).toBe("Test_2025-01-16_1");
      expect(ids[2]).toBe("Test_2025-01-17_2");
    });

    test("handles special characters in template name", () => {
      const template = {
        id: "template1",
        name: "Night/Weekend-Shift",
        start: "22:00",
        end: "06:00",
      };
      const dates = ["2025-01-15"];

      const result = generateShiftsFromTemplate(template, dates);
      expect(result[0].id).toBe("Night/Weekend-Shift_2025-01-15_0");
      expect(result[0].name).toBe("Night/Weekend-Shift");
    });

    test("handles duplicate dates", () => {
      const template = {
        id: "template1",
        name: "Test",
        start: "08:00",
        end: "16:00",
      };
      const dates = ["2025-01-15", "2025-01-15", "2025-01-15"];

      const result = generateShiftsFromTemplate(template, dates);
      expect(result.length).toBe(3);

      // Should still generate unique IDs despite duplicate dates
      const ids = result.map((shift) => shift.id);
      expect(new Set(ids).size).toBe(3);
    });
  });
});
