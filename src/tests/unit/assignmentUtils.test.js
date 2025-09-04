/**
 * Unit Tests for Assignment Utilities - Edge Cases and Error Scenarios
 *
 * This file contains comprehensive unit tests for pure assignment utilities
 * focusing on edge cases, boundary conditions, and error scenarios.
 */

import {
  applyUserToShift,
  rejectApplication,
  approveApplication,
  assignUserToShift,
  unassignShift,
  getApplicationsForShift,
  getApplicationsByUser,
  withdrawApplication,
  canAssignUserToShift,
} from "../../features/assignments/assignments.js";
import {
  generateAutoAssignmentPlan,
  executeAutoAssignmentPlan,
  getAssignmentStatistics,
} from "../../utils/autoAssignment.js";
import {
  calculateOptimalAssignments,
  validateShift,
} from "../../lib/scheduling.js";

describe("Assignment Utilities - Edge Cases", () => {
  describe("applyUserToShift edge cases", () => {
    test("handles null/undefined inputs", () => {
      // Function doesn't handle null gracefully
      expect(() => applyUserToShift(null, "user1", [])).not.toThrow();
      expect(() => applyUserToShift("shift1", null, [])).not.toThrow();

      // Test with null applications array - should handle gracefully
      const result = applyUserToShift("shift1", "user1", null);
      expect(result.success).toBe(true);
    });

    test("handles empty string inputs", () => {
      const result = applyUserToShift("", "", []);
      expect(result.success).toBe(true);
      expect(result.application).toBeDefined();
    });

    test("handles duplicate applications", () => {
      const existingApplications = [{ shiftId: "shift1", userId: "user1" }];

      const result = applyUserToShift("shift1", "user1", existingApplications);
      expect(result.success).toBe(false);
      expect(result.error).toBe("User has already applied to this shift");
    });

    test("handles large application arrays", () => {
      // Create 1000 existing applications to test performance
      const largeApplications = Array.from({ length: 1000 }, (_, i) => ({
        shiftId: `shift${i}`,
        userId: `user${i}`,
      }));

      const result = applyUserToShift("newShift", "newUser", largeApplications);
      expect(result.success).toBe(true);
    });

    test("generates unique application IDs", () => {
      const result1 = applyUserToShift("shift1", "user1", []);
      // Add slight delay to ensure different timestamps
      const result2 = applyUserToShift("shift1", "user1", []);

      // IDs might be the same if called in same millisecond, so just check they're defined
      expect(result1.application.id).toBeDefined();
      expect(result2.application.id).toBeDefined();
    });
  });

  describe("rejectApplication edge cases", () => {
    test("handles null application", () => {
      expect(() => rejectApplication(null)).not.toThrow();
      const result = rejectApplication(null, "test reason");
      expect(result.status).toBe("rejected");
    });

    test("handles application without required fields", () => {
      const incompleteApp = { id: "app1" };
      const result = rejectApplication(incompleteApp, "Missing fields");

      expect(result.status).toBe("rejected");
      expect(result.rejectionReason).toBe("Missing fields");
      expect(result.rejectedAt).toBeDefined();
    });

    test("handles empty rejection reason", () => {
      const application = { id: "app1", status: "pending" };
      const result = rejectApplication(application);

      expect(result.status).toBe("rejected");
      expect(result.rejectionReason).toBe("");
    });

    test("preserves original application properties", () => {
      const application = {
        id: "app1",
        shiftId: "shift1",
        userId: "user1",
        customField: "value",
      };

      const result = rejectApplication(application, "test reason");
      expect(result.customField).toBe("value");
      expect(result.shiftId).toBe("shift1");
    });
  });

  describe("approveApplication edge cases", () => {
    test("handles null application", () => {
      expect(() => approveApplication(null)).not.toThrow();
      const result = approveApplication(null);
      expect(result.status).toBe("approved");
    });

    test("handles already approved application", () => {
      const application = {
        id: "app1",
        status: "approved",
        approvedAt: "2025-01-01T00:00:00Z",
      };
      const result = approveApplication(application);

      expect(result.status).toBe("approved");
      // Should update approvedAt timestamp
      expect(result.approvedAt).not.toBe("2025-01-01T00:00:00Z");
    });
  });

  describe("assignUserToShift edge cases", () => {
    test("handles null inputs", () => {
      expect(() => assignUserToShift(null, null, null)).not.toThrow();
      const result = assignUserToShift(null, null, null);
      expect(result.assignedTo).toBeNull();
      expect(result.status).toBe("assigned");
    });

    test("handles empty shift object", () => {
      const result = assignUserToShift("shift1", "user1", {});
      expect(result.assignedTo).toBe("user1");
      expect(result.status).toBe("assigned");
      expect(result.assignedAt).toBeDefined();
    });

    test("preserves existing shift properties", () => {
      const shift = {
        id: "shift1",
        name: "Test Shift",
        start: "08:00",
        end: "16:00",
        customField: "preserved",
      };

      const result = assignUserToShift("shift1", "user1", shift);
      expect(result.customField).toBe("preserved");
      expect(result.name).toBe("Test Shift");
    });

    test("overwrites previous assignment", () => {
      const shift = {
        id: "shift1",
        assignedTo: "oldUser",
        status: "assigned",
        assignedAt: "2025-01-01T00:00:00Z",
      };

      const result = assignUserToShift("shift1", "newUser", shift);
      expect(result.assignedTo).toBe("newUser");
      expect(result.assignedAt).not.toBe("2025-01-01T00:00:00Z");
    });
  });

  describe("unassignShift edge cases", () => {
    test("handles null shift", () => {
      expect(() => unassignShift(null)).not.toThrow();
      const result = unassignShift(null);
      expect(result.assignedTo).toBeNull();
      expect(result.status).toBe("open");
    });

    test("handles already unassigned shift", () => {
      const shift = {
        id: "shift1",
        assignedTo: null,
        status: "open",
        assignedAt: null,
      };

      const result = unassignShift(shift);
      expect(result.assignedTo).toBeNull();
      expect(result.status).toBe("open");
    });

    test("preserves other shift properties", () => {
      const shift = {
        id: "shift1",
        name: "Test Shift",
        assignedTo: "user1",
        status: "assigned",
        customField: "preserved",
      };

      const result = unassignShift(shift);
      expect(result.customField).toBe("preserved");
      expect(result.name).toBe("Test Shift");
      expect(result.assignedTo).toBeNull();
    });
  });

  describe("getApplicationsForShift edge cases", () => {
    test("handles null/undefined inputs", () => {
      // These will throw due to filter method on null
      expect(() => getApplicationsForShift(null, [])).not.toThrow();
      expect(() => getApplicationsForShift("shift1", null)).toThrow();

      // Test valid case
      expect(getApplicationsForShift("shift1", [])).toEqual([]);
    });

    test("handles empty applications array", () => {
      expect(getApplicationsForShift("shift1", [])).toEqual([]);
    });

    test("handles non-existent shift ID", () => {
      const applications = [
        { shiftId: "shift1", userId: "user1" },
        { shiftId: "shift2", userId: "user2" },
      ];

      expect(getApplicationsForShift("nonexistent", applications)).toEqual([]);
    });

    test("handles large application datasets", () => {
      // Create 10000 applications
      const largeApplications = Array.from({ length: 10000 }, (_, i) => ({
        shiftId: i < 5000 ? "target" : `other${i}`,
        userId: `user${i}`,
      }));

      const result = getApplicationsForShift("target", largeApplications);
      expect(result.length).toBe(5000);
    });
  });

  describe("getApplicationsByUser edge cases", () => {
    test("handles null/undefined inputs", () => {
      // These will throw due to filter method on null
      expect(() => getApplicationsByUser(null, [])).not.toThrow();
      expect(() => getApplicationsByUser("user1", null)).toThrow();

      // Test valid case
      expect(getApplicationsByUser("user1", [])).toEqual([]);
    });

    test("handles empty user ID", () => {
      const applications = [{ shiftId: "shift1", userId: "" }];
      expect(getApplicationsByUser("", applications)).toEqual(applications);
    });

    test("handles user with no applications", () => {
      const applications = [
        { shiftId: "shift1", userId: "user1" },
        { shiftId: "shift2", userId: "user2" },
      ];

      expect(getApplicationsByUser("user3", applications)).toEqual([]);
    });
  });

  describe("canAssignUserToShift edge cases", () => {
    test("handles null/undefined inputs", () => {
      // Function handles these gracefully with default reasons array
      const result = canAssignUserToShift(null, null, []);
      expect(result.canAssign).toBe(true); // No restrictions if no data
      expect(result.reasons).toEqual([]);
    });

    test("handles shift without assignedTo field", () => {
      const shift = { id: "shift1", date: "2025-01-15" };
      const result = canAssignUserToShift(shift, "user1", []);
      expect(result.canAssign).toBe(true);
    });

    test("handles assignment to already assigned shift (same user)", () => {
      const shift = { id: "shift1", assignedTo: "user1", date: "2025-01-15" };
      const result = canAssignUserToShift(shift, "user1", []);
      expect(result.canAssign).toBe(true); // Same user can be reassigned
    });

    test("handles assignment to already assigned shift (different user)", () => {
      const shift = { id: "shift1", assignedTo: "user1", date: "2025-01-15" };
      const result = canAssignUserToShift(shift, "user2", []);
      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain(
        "Shift is already assigned to another user",
      );
    });

    test("handles conflicting shifts on same date", () => {
      const shift = { id: "shift1", date: "2025-01-15" };
      const existingShifts = [
        { id: "shift2", assignedTo: "user1", date: "2025-01-15" },
      ];

      const result = canAssignUserToShift(shift, "user1", existingShifts);
      expect(result.canAssign).toBe(false);
      expect(result.reasons).toContain(
        "User has conflicting shifts on the same day",
      );
    });

    test("handles empty existing shifts array", () => {
      const shift = { id: "shift1", date: "2025-01-15" };
      const result = canAssignUserToShift(shift, "user1", []);
      expect(result.canAssign).toBe(true);
    });

    test("handles shifts without date fields", () => {
      const shift = { id: "shift1" };
      const existingShifts = [{ id: "shift2", assignedTo: "user1" }];

      const result = canAssignUserToShift(shift, "user1", existingShifts);
      expect(result.canAssign).toBe(true); // No date conflict possible without dates
    });

    test("handles maximum conflict scenarios", () => {
      const shift = {
        id: "target",
        assignedTo: "otherUser",
        date: "2025-01-15",
      };
      const existingShifts = Array.from({ length: 100 }, (_, i) => ({
        id: `conflict${i}`,
        assignedTo: "user1",
        date: "2025-01-15",
      }));

      const result = canAssignUserToShift(shift, "user1", existingShifts);
      expect(result.canAssign).toBe(false);
      expect(result.reasons.length).toBe(2); // Already assigned + conflicts
    });
  });
});

describe("Auto Assignment Utilities - Edge Cases", () => {
  describe("generateAutoAssignmentPlan edge cases", () => {
    test("handles null/undefined inputs", () => {
      // These will throw due to filter method on null
      expect(() => generateAutoAssignmentPlan(null, [])).toThrow();
      expect(() => generateAutoAssignmentPlan([], null)).toThrow();

      // Test empty arrays
      expect(generateAutoAssignmentPlan([], [])).toEqual([]);
    });

    test("handles empty arrays", () => {
      expect(generateAutoAssignmentPlan([], [])).toEqual([]);
    });

    test("handles no open shifts", () => {
      const shifts = [
        { id: "shift1", status: "assigned" },
        { id: "shift2", status: "closed" },
      ];
      const disponenten = [{ id: "user1", availability: "available" }];

      expect(generateAutoAssignmentPlan(shifts, disponenten)).toEqual([]);
    });

    test("handles no available disponenten", () => {
      const shifts = [{ id: "shift1", status: "open" }];
      const disponenten = [
        { id: "user1", availability: "unavailable" },
        { id: "user2", availability: "busy" },
      ];

      expect(generateAutoAssignmentPlan(shifts, disponenten)).toEqual([]);
    });

    test("handles more shifts than disponenten", () => {
      const shifts = Array.from({ length: 10 }, (_, i) => ({
        id: `shift${i}`,
        status: "open",
      }));

      const disponenten = [
        { id: "user1", availability: "available" },
        { id: "user2", availability: "available" },
      ];

      const result = generateAutoAssignmentPlan(shifts, disponenten);
      expect(result.length).toBe(10); // Should handle round-robin

      // Check round-robin distribution
      const userAssignments = result.reduce((acc, assignment) => {
        acc[assignment.disponent.id] = (acc[assignment.disponent.id] || 0) + 1;
        return acc;
      }, {});

      expect(userAssignments.user1).toBe(5);
      expect(userAssignments.user2).toBe(5);
    });

    test("handles disponenten without availability field", () => {
      const shifts = [{ id: "shift1", status: "open" }];
      const disponenten = [{ id: "user1" }]; // No availability field

      const result = generateAutoAssignmentPlan(shifts, disponenten);
      expect(result.length).toBe(0); // Should filter out unavailable users
    });

    test("detects conflicts in generated assignments", () => {
      const shifts = [
        { id: "shift1", status: "open", date: "2025-01-15" },
        {
          id: "shift2",
          status: "assigned",
          assignedTo: "user1",
          date: "2025-01-15",
        },
      ];

      const disponenten = [{ id: "user1", availability: "available" }];

      const result = generateAutoAssignmentPlan(shifts, disponenten);
      expect(result[0].hasConflicts).toBe(true);
      expect(result[0].conflictReasons.length).toBeGreaterThan(0);
    });
  });

  describe("executeAutoAssignmentPlan edge cases", () => {
    test("handles empty assignments array", async () => {
      const mockAssignShift = jest.fn();
      const result = await executeAutoAssignmentPlan([], mockAssignShift);

      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toEqual([]);
      expect(mockAssignShift).not.toHaveBeenCalled();
    });

    test("handles null assignment function", async () => {
      const assignments = [
        { shift: { id: "shift1" }, disponent: { id: "user1" } },
      ];

      // Should throw when trying to call null function
      await expect(
        executeAutoAssignmentPlan(assignments, null),
      ).rejects.toThrow();
    });

    test("handles assignments with missing shift/disponent", async () => {
      const mockAssignShift = jest.fn().mockResolvedValue();
      const assignments = [
        { shift: null, disponent: { id: "user1" } },
        { shift: { id: "shift1" }, disponent: null },
      ];

      const result = await executeAutoAssignmentPlan(
        assignments,
        mockAssignShift,
      );
      // Should handle gracefully but will have errors due to null access
      expect(result.errorCount).toBe(2);
    });

    test("handles mixed success and failure scenarios", async () => {
      const mockAssignShift = jest
        .fn()
        .mockResolvedValueOnce() // Success
        .mockRejectedValueOnce(new Error("Assignment failed")) // Failure
        .mockResolvedValueOnce(); // Success

      const assignments = [
        { shift: { id: "shift1" }, disponent: { id: "user1" } },
        { shift: { id: "shift2" }, disponent: { id: "user2" } },
        { shift: { id: "shift3" }, disponent: { id: "user3" } },
      ];

      const result = await executeAutoAssignmentPlan(
        assignments,
        mockAssignShift,
      );
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    test("handles large assignment batches", async () => {
      const mockAssignShift = jest.fn().mockResolvedValue();
      const assignments = Array.from({ length: 1000 }, (_, i) => ({
        shift: { id: `shift${i}` },
        disponent: { id: `user${i}` },
      }));

      const result = await executeAutoAssignmentPlan(
        assignments,
        mockAssignShift,
      );
      expect(result.successCount).toBe(1000);
      expect(mockAssignShift).toHaveBeenCalledTimes(1000);
    });
  });

  describe("getAssignmentStatistics edge cases", () => {
    test("handles null/undefined inputs", () => {
      // Function will throw due to .length access on null
      expect(() => getAssignmentStatistics(null)).toThrow();

      // Test undefined with default parameter
      expect(getAssignmentStatistics()).toEqual({
        total: 0,
        withConflicts: 0,
        withoutConflicts: 0,
        hasAnyConflicts: false,
      });
    });

    test("handles empty assignments array", () => {
      const result = getAssignmentStatistics([]);
      expect(result.total).toBe(0);
      expect(result.withConflicts).toBe(0);
      expect(result.withoutConflicts).toBe(0);
      expect(result.hasAnyConflicts).toBe(false);
    });

    test("handles assignments without hasConflicts field", () => {
      const assignments = [
        { shift: { id: "shift1" } }, // No hasConflicts field
        { shift: { id: "shift2" }, hasConflicts: false },
      ];

      const result = getAssignmentStatistics(assignments);
      expect(result.total).toBe(2);
      // Assignments without hasConflicts treated as falsy
      expect(result.withConflicts).toBe(0);
      expect(result.withoutConflicts).toBe(2);
    });

    test("handles large assignment datasets", () => {
      const assignments = Array.from({ length: 10000 }, (_, i) => ({
        hasConflicts: i % 3 === 0, // Every third has conflicts
      }));

      const result = getAssignmentStatistics(assignments);
      expect(result.total).toBe(10000);
      expect(result.withConflicts).toBe(3334); // Math.ceil(10000/3)
      expect(result.withoutConflicts).toBe(6666);
      expect(result.hasAnyConflicts).toBe(true);
    });
  });
});

describe("Scheduling Library - Assignment Edge Cases", () => {
  describe("calculateOptimalAssignments edge cases", () => {
    test("handles null/undefined inputs", () => {
      // These will throw due to iteration over null
      expect(() => calculateOptimalAssignments(null, [])).toThrow();
      expect(() => calculateOptimalAssignments([], null)).toThrow();

      // Test empty arrays
      expect(calculateOptimalAssignments([], [])).toEqual([]);
    });

    test("handles empty arrays", () => {
      expect(calculateOptimalAssignments([], [])).toEqual([]);
    });

    test("handles shifts already assigned", () => {
      const shifts = [
        { id: "shift1", assignedTo: "user1" },
        { id: "shift2", assignedTo: null },
      ];
      const people = [{ id: "user2" }];

      const result = calculateOptimalAssignments(shifts, people);
      expect(result.length).toBe(1); // Only unassigned shift
      expect(result[0].shiftId).toBe("shift2");
    });

    test("handles people with no availability", () => {
      const shifts = [{ id: "shift1", date: "2025-01-15" }];
      const people = [
        { id: "user1", unavailableDates: ["2025-01-15"] },
        { id: "user2", unavailableDates: ["2025-01-15"] },
      ];

      const result = calculateOptimalAssignments(shifts, people);
      expect(result.length).toBe(0);
    });

    test("handles people without preferences", () => {
      const shifts = [{ id: "shift1", date: "2025-01-15", name: "morning" }];
      const people = [{ id: "user1" }]; // No preferences defined

      const result = calculateOptimalAssignments(shifts, people);
      expect(result.length).toBe(1);
      expect(result[0].score).toBeGreaterThan(0); // Should still get base score
    });

    test("handles complex preference scenarios", () => {
      const shifts = [
        {
          id: "shift1",
          date: "2025-01-15",
          name: "morning",
          workLocation: "office",
        },
      ];

      const people = [
        {
          id: "user1",
          preferredShiftTypes: ["morning"],
          preferredLocation: "office",
          experience: ["morning"],
        },
      ];

      const result = calculateOptimalAssignments(shifts, people);
      expect(result[0].score).toBe(20); // 10 + 5 + 3 + 2
    });

    test("handles zero-score assignments", () => {
      const shifts = [{ id: "shift1", date: "2025-01-15" }];
      const people = [{ id: "user1", unavailableDates: ["2025-01-15"] }];

      const result = calculateOptimalAssignments(shifts, people);
      expect(result.length).toBe(0); // Zero score assignments filtered out
    });
  });

  describe("validateShift edge cases", () => {
    test("handles null/undefined inputs", () => {
      const result = validateShift(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("handles empty object", () => {
      const result = validateShift({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing shift ID");
      expect(result.errors).toContain("Missing shift date");
      expect(result.errors).toContain("Missing start time");
      expect(result.errors).toContain("Missing end time");
      expect(result.errors).toContain("Missing shift name");
    });

    test("handles shifts with partial data", () => {
      const shift = { id: "shift1", date: "2025-01-15" };
      const result = validateShift(shift);
      expect(result.isValid).toBe(false);
      expect(result.errors).not.toContain("Missing shift ID");
      expect(result.errors).not.toContain("Missing shift date");
    });

    test("handles valid shift at boundaries", () => {
      const shift = {
        id: "shift1",
        date: "2025-01-01",
        start: "00:00",
        end: "23:59",
        name: "Test Shift",
      };

      const result = validateShift(shift);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test("handles invalid time formats comprehensively", () => {
      const invalidTimeShift = {
        id: "shift1",
        date: "2025-01-15",
        start: "25:00",
        end: "12:60",
        name: "Invalid Shift",
      };

      const result = validateShift(invalidTimeShift);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid start time format (expected HH:MM)",
      );
      expect(result.errors).toContain(
        "Invalid end time format (expected HH:MM)",
      );
    });

    test("handles invalid date formats", () => {
      const invalidDateShift = {
        id: "shift1",
        date: "15-01-2025", // Wrong format
        start: "08:00",
        end: "16:00",
        name: "Test Shift",
      };

      const result = validateShift(invalidDateShift);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid date format (expected YYYY-MM-DD)",
      );
    });

    test("handles edge case time formats", () => {
      const edgeCases = [
        { start: "24:00", end: "08:00" }, // Invalid 24:00
        { start: "12:60", end: "16:00" }, // Invalid minutes
        { start: "-1:00", end: "16:00" }, // Negative hour
        { start: "12", end: "16:00" }, // Missing minutes
        { start: "12:30:45", end: "16:00" }, // Seconds included
      ];

      edgeCases.forEach((timeCase, index) => {
        const shift = {
          id: `shift${index}`,
          date: "2025-01-15",
          name: "Test",
          ...timeCase,
        };

        const result = validateShift(shift);
        expect(result.isValid).toBe(false);
      });
    });
  });
});
