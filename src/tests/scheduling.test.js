/**
 * Tests for the core scheduling library
 */

import {
  calculateTimeOverlap,
  calculateShiftDuration,
  findSchedulingConflicts,
  checkShortTurnaround,
  validateShift,
  SCHEDULING_CONFLICT_CODES,
} from "../lib/scheduling.js";

describe("Core Scheduling Library", () => {
  describe("calculateTimeOverlap", () => {
    test("detects overlap between regular shifts", () => {
      expect(calculateTimeOverlap("08:00", "12:00", "10:00", "14:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("08:00", "12:00", "13:00", "17:00")).toBe(
        false,
      );
    });

    test("handles overnight shifts correctly", () => {
      expect(calculateTimeOverlap("22:00", "06:00", "05:00", "09:00")).toBe(
        true,
      );
      expect(calculateTimeOverlap("22:00", "06:00", "07:00", "11:00")).toBe(
        false,
      );
    });
  });

  describe("calculateShiftDuration", () => {
    test("calculates regular shift duration", () => {
      expect(calculateShiftDuration("08:00", "12:00")).toBe(240); // 4 hours
      expect(calculateShiftDuration("09:30", "17:15")).toBe(465); // 7h 45m
    });

    test("calculates overnight shift duration", () => {
      expect(calculateShiftDuration("22:00", "06:00")).toBe(480); // 8 hours
    });
  });

  describe("findSchedulingConflicts", () => {
    test("detects time overlap conflicts", () => {
      const targetShift = {
        id: "shift1",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
      };
      const existingShifts = [
        {
          id: "shift2",
          date: "2025-01-15",
          start: "10:00",
          end: "14:00",
        },
      ];

      const conflicts = findSchedulingConflicts(targetShift, existingShifts);
      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
    });

    test("detects assignment collision", () => {
      const targetShift = {
        id: "shift1",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
        assignedTo: "user1",
      };
      const existingShifts = [
        {
          id: "shift2",
          date: "2025-01-15",
          start: "10:00",
          end: "14:00",
          assignedTo: "user1",
        },
      ];

      const conflicts = findSchedulingConflicts(targetShift, existingShifts);
      expect(conflicts).toContain(SCHEDULING_CONFLICT_CODES.TIME_OVERLAP);
      expect(conflicts).toContain(
        SCHEDULING_CONFLICT_CODES.ASSIGNMENT_COLLISION,
      );
    });
  });

  describe("validateShift", () => {
    test("validates complete shift object", () => {
      const validShift = {
        id: "shift1",
        date: "2025-01-15",
        start: "08:00",
        end: "12:00",
        name: "Morning Shift",
      };

      const result = validateShift(validShift);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("identifies missing required fields", () => {
      const incompleteShift = {
        id: "shift1",
        date: "2025-01-15",
        // missing start, end, name
      };

      const result = validateShift(incompleteShift);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing start time");
      expect(result.errors).toContain("Missing end time");
      expect(result.errors).toContain("Missing shift name");
    });

    test("validates time format", () => {
      const invalidShift = {
        id: "shift1",
        date: "2025-01-15",
        start: "25:00", // Invalid hour
        end: "12:60", // Invalid minute
        name: "Invalid Shift",
      };

      const result = validateShift(invalidShift);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid start time format (expected HH:MM)",
      );
      expect(result.errors).toContain(
        "Invalid end time format (expected HH:MM)",
      );
    });
  });
});
