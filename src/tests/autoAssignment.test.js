import {
  generateAutoAssignmentPlan,
  executeAutoAssignmentPlan,
  getAssignmentStatistics,
} from "../utils/autoAssignment";

// Mock the assignment validation
jest.mock("../features/assignments/assignments", () => ({
  canAssignUserToShift: jest.fn(),
}));

import { canAssignUserToShift } from "../features/assignments/assignments";

describe("autoAssignment utils", () => {
  const mockShifts = [
    {
      id: "shift_1",
      date: "2025-01-06",
      start: "06:00",
      end: "14:00",
      status: "open",
    },
    {
      id: "shift_2",
      date: "2025-01-06",
      start: "22:00",
      end: "06:00",
      status: "open",
    },
    {
      id: "shift_3",
      date: "2025-01-06",
      start: "14:00",
      end: "22:00",
      status: "assigned", // Should be skipped
    },
  ];

  const mockDisponenten = [
    {
      id: "disp_1",
      name: "Anna Schmidt",
      availability: "available",
    },
    {
      id: "disp_2",
      name: "Max Weber",
      availability: "available",
    },
    {
      id: "disp_3",
      name: "Lisa Müller",
      availability: "busy", // Should be skipped
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAutoAssignmentPlan", () => {
    test("should generate assignments for open shifts with available disponenten", () => {
      canAssignUserToShift.mockReturnValue({ canAssign: true, reasons: [] });

      const result = generateAutoAssignmentPlan(mockShifts, mockDisponenten);

      expect(result).toHaveLength(2); // Only 2 open shifts
      expect(result[0].shift.id).toBe("shift_1");
      expect(result[0].disponent.name).toBe("Anna Schmidt");
      expect(result[0].hasConflicts).toBe(false);
      expect(result[1].shift.id).toBe("shift_2");
      expect(result[1].disponent.name).toBe("Max Weber");
    });

    test("should detect conflicts in assignments", () => {
      canAssignUserToShift
        .mockReturnValueOnce({ canAssign: true, reasons: [] })
        .mockReturnValueOnce({
          canAssign: false,
          reasons: ["Conflict detected"],
        });

      const result = generateAutoAssignmentPlan(mockShifts, mockDisponenten);

      expect(result[0].hasConflicts).toBe(false);
      expect(result[1].hasConflicts).toBe(true);
      expect(result[1].conflictReasons).toEqual(["Conflict detected"]);
    });

    test("should return empty array when no open shifts", () => {
      const assignedShifts = mockShifts.map((shift) => ({
        ...shift,
        status: "assigned",
      }));
      const result = generateAutoAssignmentPlan(
        assignedShifts,
        mockDisponenten,
      );

      expect(result).toHaveLength(0);
    });

    test("should return empty array when no available disponenten", () => {
      const busyDisponenten = mockDisponenten.map((disp) => ({
        ...disp,
        availability: "busy",
      }));
      const result = generateAutoAssignmentPlan(mockShifts, busyDisponenten);

      expect(result).toHaveLength(0);
    });
  });

  describe("executeAutoAssignmentPlan", () => {
    test("should execute all assignments successfully", async () => {
      const mockAssignShift = jest.fn().mockResolvedValue();
      const plannedAssignments = [
        {
          shift: { id: "shift_1" },
          disponent: { id: "disp_1" },
        },
        {
          shift: { id: "shift_2" },
          disponent: { id: "disp_2" },
        },
      ];

      const result = await executeAutoAssignmentPlan(
        plannedAssignments,
        mockAssignShift,
      );

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockAssignShift).toHaveBeenCalledTimes(2);
    });

    test("should handle assignment errors", async () => {
      const mockAssignShift = jest
        .fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error("Assignment failed"));

      const plannedAssignments = [
        {
          shift: { id: "shift_1" },
          disponent: { id: "disp_1" },
        },
        {
          shift: { id: "shift_2" },
          disponent: { id: "disp_2" },
        },
      ];

      const result = await executeAutoAssignmentPlan(
        plannedAssignments,
        mockAssignShift,
      );

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe("Assignment failed");
    });
  });

  describe("getAssignmentStatistics", () => {
    test("should calculate statistics correctly", () => {
      const plannedAssignments = [
        { hasConflicts: false },
        { hasConflicts: true },
        { hasConflicts: false },
        { hasConflicts: true },
      ];

      const stats = getAssignmentStatistics(plannedAssignments);

      expect(stats.total).toBe(4);
      expect(stats.withConflicts).toBe(2);
      expect(stats.withoutConflicts).toBe(2);
      expect(stats.hasAnyConflicts).toBe(true);
    });

    test("should handle empty assignments", () => {
      const stats = getAssignmentStatistics([]);

      expect(stats.total).toBe(0);
      expect(stats.withConflicts).toBe(0);
      expect(stats.withoutConflicts).toBe(0);
      expect(stats.hasAnyConflicts).toBe(false);
    });
  });
});
