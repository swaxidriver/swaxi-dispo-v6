/**
 * Tests for the shift operations domain functions
 */

import {
  createShift,
  applyToShift,
  assignShift,
  cancelShift,
  updateShiftStatus,
  withdrawApplication,
  getOpenShifts,
  getConflictedShifts,
  applyToSeries,
} from "../../lib/shift-operations";
import { SHIFT_STATUS } from "../../utils/constants";

describe("Shift Operations Domain Functions", () => {
  
  describe("createShift", () => {
    it("creates a valid shift with required data", () => {
      const shiftData = {
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: "regular",
        workLocation: "Station A",
      };

      const result = createShift(shiftData);
      
      expect(result.shift).toBeDefined();
      expect(result.shift.id).toContain(shiftData.date);
      expect(result.shift.status).toBe(SHIFT_STATUS.OPEN);
      expect(result.shift.assignedTo).toBeNull();
      expect(result.shift.workLocation).toBe(shiftData.workLocation);
      expect(result.shift.conflicts).toEqual([]);
    });

    it("throws error for missing required data", () => {
      const incompleteData = {
        date: "2024-01-15",
        start: "08:00",
        // missing end and workLocation
      };

      expect(() => createShift(incompleteData)).toThrow(
        "Missing required shift data: date, start, end, workLocation"
      );
    });

    it("includes additional data when provided", () => {
      const shiftData = {
        date: "2024-01-15",
        start: "08:00",
        end: "16:00",
        type: "regular",
        workLocation: "Station A",
        additionalData: {
          notes: "Special equipment required",
          priority: "high",
        },
      };

      const result = createShift(shiftData);
      
      expect(result.shift.notes).toBe("Special equipment required");
      expect(result.shift.priority).toBe("high");
    });
  });

  describe("applyToShift", () => {
    const mockShifts = [
      {
        id: "shift-1",
        status: SHIFT_STATUS.OPEN,
        date: "2024-01-15",
      },
      {
        id: "shift-2", 
        status: SHIFT_STATUS.ASSIGNED,
        date: "2024-01-16",
      },
    ];

    it("creates application for open shift", () => {
      const result = applyToShift("shift-1", "user-1", mockShifts, []);
      
      expect(result.application).toBeDefined();
      expect(result.application.shiftId).toBe("shift-1");
      expect(result.application.userId).toBe("user-1");
      expect(result.application.status).toBe("pending");
      expect(result.updatedShift).toBe(mockShifts[0]);
    });

    it("throws error for non-open shift", () => {
      expect(() => 
        applyToShift("shift-2", "user-1", mockShifts, [])
      ).toThrow("Cannot apply to shift with status: assigned");
    });

    it("throws error for duplicate application", () => {
      const existingApplications = [
        { shiftId: "shift-1", userId: "user-1", status: "pending" }
      ];

      expect(() => 
        applyToShift("shift-1", "user-1", mockShifts, existingApplications)
      ).toThrow("User has already applied to this shift");
    });

    it("throws error for missing parameters", () => {
      expect(() => applyToShift("", "user-1", mockShifts, [])).toThrow(
        "Missing required parameters: shiftId and userId"
      );
    });

    it("throws error for non-existent shift", () => {
      expect(() => 
        applyToShift("nonexistent", "user-1", mockShifts, [])
      ).toThrow("Shift not found: nonexistent");
    });
  });

  describe("assignShift", () => {
    const mockShifts = [
      {
        id: "shift-1",
        status: SHIFT_STATUS.OPEN,
        assignedTo: null,
      },
    ];

    it("assigns shift to user successfully", () => {
      const result = assignShift("shift-1", "user-1", mockShifts);
      
      expect(result.status).toBe(SHIFT_STATUS.ASSIGNED);
      expect(result.assignedTo).toBe("user-1");
      expect(result.updatedAt).toBeDefined();
    });

    it("throws error for missing parameters", () => {
      expect(() => assignShift("", "user-1", mockShifts)).toThrow(
        "Missing required parameters: shiftId and userId"
      );
    });

    it("throws error for non-existent shift", () => {
      expect(() => assignShift("nonexistent", "user-1", mockShifts)).toThrow(
        "Shift not found: nonexistent"
      );
    });
  });

  describe("cancelShift", () => {
    const mockShifts = [
      {
        id: "shift-1",
        status: SHIFT_STATUS.OPEN,
        assignedTo: null,
      },
    ];

    it("cancels shift successfully", () => {
      const result = cancelShift("shift-1", mockShifts);
      
      expect(result.status).toBe(SHIFT_STATUS.CANCELLED);
      expect(result.assignedTo).toBeNull();
      expect(result.updatedAt).toBeDefined();
    });

    it("throws error for missing parameter", () => {
      expect(() => cancelShift("", mockShifts)).toThrow(
        "Missing required parameter: shiftId"
      );
    });

    it("throws error for non-existent shift", () => {
      expect(() => cancelShift("nonexistent", mockShifts)).toThrow(
        "Shift not found: nonexistent"
      );
    });
  });

  describe("updateShiftStatus", () => {
    const mockShifts = [
      {
        id: "shift-1",
        status: SHIFT_STATUS.OPEN,
      },
    ];

    it("updates shift status successfully", () => {
      const result = updateShiftStatus("shift-1", SHIFT_STATUS.ASSIGNED, mockShifts);
      
      expect(result.status).toBe(SHIFT_STATUS.ASSIGNED);
      expect(result.updatedAt).toBeDefined();
    });

    it("throws error for missing parameters", () => {
      expect(() => updateShiftStatus("", SHIFT_STATUS.ASSIGNED, mockShifts)).toThrow(
        "Missing required parameters: shiftId and newStatus"
      );
    });
  });

  describe("withdrawApplication", () => {
    const mockApplications = [
      {
        id: "app-1",
        status: "pending",
        shiftId: "shift-1",
      },
      {
        id: "app-2",
        status: "approved",
        shiftId: "shift-2",
      },
    ];

    it("withdraws pending application successfully", () => {
      const result = withdrawApplication("app-1", mockApplications);
      
      expect(result.status).toBe("withdrawn");
      expect(result.updatedAt).toBeDefined();
    });

    it("throws error for non-pending application", () => {
      expect(() => withdrawApplication("app-2", mockApplications)).toThrow(
        "Cannot withdraw application with status: approved"
      );
    });

    it("throws error for non-existent application", () => {
      expect(() => withdrawApplication("nonexistent", mockApplications)).toThrow(
        "Application not found: nonexistent"
      );
    });
  });

  describe("getOpenShifts", () => {
    const mockShifts = [
      { id: "shift-1", status: SHIFT_STATUS.OPEN },
      { id: "shift-2", status: SHIFT_STATUS.ASSIGNED },
      { id: "shift-3", status: SHIFT_STATUS.OPEN },
    ];

    it("returns only open shifts", () => {
      const result = getOpenShifts(mockShifts);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("shift-1");
      expect(result[1].id).toBe("shift-3");
    });

    it("returns empty array when no open shifts", () => {
      const result = getOpenShifts([
        { id: "shift-1", status: SHIFT_STATUS.ASSIGNED },
      ]);
      
      expect(result).toHaveLength(0);
    });
  });

  describe("getConflictedShifts", () => {
    const mockShifts = [
      { id: "shift-1", conflicts: [] },
      { id: "shift-2", conflicts: ["conflict-1"] },
      { id: "shift-3", conflicts: ["conflict-2", "conflict-3"] },
    ];

    it("returns only shifts with conflicts", () => {
      const result = getConflictedShifts(mockShifts);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("shift-2");
      expect(result[1].id).toBe("shift-3");
    });

    it("returns empty array when no conflicts", () => {
      const result = getConflictedShifts([
        { id: "shift-1", conflicts: [] },
      ]);
      
      expect(result).toHaveLength(0);
    });
  });

  describe("applyToSeries", () => {
    const mockShifts = [
      { id: "shift-1", status: SHIFT_STATUS.OPEN },
      { id: "shift-2", status: SHIFT_STATUS.OPEN },
      { id: "shift-3", status: SHIFT_STATUS.ASSIGNED },
    ];

    it("applies to multiple open shifts successfully", () => {
      const result = applyToSeries(["shift-1", "shift-2"], "user-1", mockShifts, []);
      
      expect(result).toHaveLength(2);
      expect(result[0].shiftId).toBe("shift-1");
      expect(result[1].shiftId).toBe("shift-2");
    });

    it("throws error for empty shift IDs array", () => {
      expect(() => applyToSeries([], "user-1", mockShifts, [])).toThrow(
        "shiftIds must be a non-empty array"
      );
    });

    it("throws error when some applications fail", () => {
      expect(() => 
        applyToSeries(["shift-1", "shift-3"], "user-1", mockShifts, [])
      ).toThrow("Some applications failed");
    });
  });
});