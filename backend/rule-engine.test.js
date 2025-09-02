/**
 * Tests for Rule Engine - Double-booking prevention with override mechanism
 */

import { RuleEngine, RULES, ruleEngine } from "./rule-engine.js";
import { CONFLICT_CODES } from "../src/features/shifts/shifts.js";

// Mock the audit service for testing
jest.mock("../src/services/auditService.js", () => ({
  AuditService: {
    logAction: jest.fn(),
  },
}));

describe("Rule Engine", () => {
  let engine;
  let mockActor;

  beforeEach(() => {
    engine = new RuleEngine();
    mockActor = {
      name: "John Admin",
      role: "ADMIN",
    };
    jest.clearAllMocks();
  });

  describe("Rule Definitions", () => {
    test("should have predefined rules", () => {
      const rules = engine.getRules();

      expect(rules.PREVENT_DOUBLE_BOOKING).toBeDefined();
      expect(rules.PREVENT_DOUBLE_BOOKING.severity).toBe("BLOCKING");
      expect(rules.PREVENT_DOUBLE_BOOKING.allowOverride).toBe(true);

      expect(rules.LOCATION_CONSISTENCY).toBeDefined();
      expect(rules.LOCATION_CONSISTENCY.severity).toBe("WARNING");

      expect(rules.REST_PERIOD).toBeDefined();
      expect(rules.REST_PERIOD.severity).toBe("WARNING");
    });
  });

  describe("Rule Evaluation", () => {
    test("should allow assignment with no conflicts", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "17:00",
          end: "23:00",
          assignedTo: "Anna Schmidt",
          status: "assigned",
        },
      ];

      const result = engine.evaluateRules(targetShift, existingShifts, []);

      expect(result.canAssign).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.summary.totalViolations).toBe(0);
      expect(result.summary.blockingViolations).toBe(0);
    });

    test("should detect double-booking violation", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00", // Overlaps with target shift
          end: "22:00",
          assignedTo: "Hans Mueller", // Same person
          status: "assigned",
        },
      ];

      const result = engine.evaluateRules(targetShift, existingShifts, []);

      expect(result.canAssign).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].rule.id).toBe("PREVENT_DOUBLE_BOOKING");
      expect(result.violations[0].isBlocking).toBe(true);
      expect(result.summary.blockingViolations).toBe(1);
    });

    test("should detect location mismatch as warning", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
        workLocation: "office",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00",
          end: "22:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
          workLocation: "home", // Different location
        },
      ];

      const result = engine.evaluateRules(targetShift, existingShifts, []);

      // Should still be assignable since location mismatch is just a warning
      expect(result.canAssign).toBe(false); // But will be false due to time overlap
      expect(result.violations.length).toBeGreaterThan(0);

      // Check for location mismatch violation
      const locationViolation = result.violations.find(
        (v) => v.rule.id === "LOCATION_CONSISTENCY",
      );
      expect(locationViolation).toBeDefined();
      expect(locationViolation.isBlocking).toBe(false);
    });

    test("should detect short turnaround as warning", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "22:00",
        end: "06:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-16",
          start: "07:00", // Only 1 hour after target shift ends
          end: "15:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
        },
      ];

      const result = engine.evaluateRules(targetShift, existingShifts, []);

      const restViolation = result.violations.find(
        (v) => v.rule.id === "REST_PERIOD",
      );
      expect(restViolation).toBeDefined();
      expect(restViolation.isBlocking).toBe(false);
    });
  });

  describe("Override Mechanism", () => {
    test("should create override for valid rule", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
      };

      const override = {
        reason: "Emergency coverage needed",
        approver: "Jane Manager",
        approverRole: "CHIEF",
      };

      const result = engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        override,
        mockActor,
      );

      expect(result.success).toBe(true);
      expect(result.override).toBeDefined();
      expect(result.override.reason).toBe(override.reason);
      expect(result.override.approver).toBe(override.approver);
      expect(result.override.createdBy).toBe(mockActor.name);
      expect(result.override.isActive).toBe(true);
    });

    test("should reject override for non-existent rule", () => {
      const targetShift = { id: "shift-1" };
      const override = { reason: "Test" };

      expect(() => {
        engine.createOverride(targetShift, "INVALID_RULE", override, mockActor);
      }).toThrow("Rule INVALID_RULE not found");
    });

    test("should allow assignment with valid override", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00",
          end: "22:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
        },
      ];

      // First, create override
      engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Emergency coverage", approver: "Manager" },
        mockActor,
      );

      // Then evaluate rules
      const result = engine.evaluateRules(targetShift, existingShifts, []);

      expect(result.canAssign).toBe(true); // Should be allowed due to override
      expect(result.overrides).toHaveLength(1);
      expect(result.overrides[0].reason).toBe("Emergency coverage");
    });
  });

  describe("Rule Enforcement", () => {
    test("should block assignment without override", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00",
          end: "22:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
        },
      ];

      const result = engine.enforceRules(
        targetShift,
        existingShifts,
        [],
        mockActor,
      );

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.message).toContain("Assignment blocked by rules");
    });

    test("should allow assignment with valid override", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00",
          end: "22:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
        },
      ];

      // Create override first
      engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Emergency", approver: "Manager" },
        mockActor,
      );

      const result = engine.enforceRules(
        targetShift,
        existingShifts,
        [],
        mockActor,
      );

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.message).toContain("allowed with rule overrides");
    });

    test("should allow assignment with no violations", () => {
      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = []; // No conflicts

      const result = engine.enforceRules(
        targetShift,
        existingShifts,
        [],
        mockActor,
      );

      expect(result.success).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.message).toBe("Assignment allowed");
    });
  });

  describe("Override Management", () => {
    test("should list active overrides", () => {
      const targetShift = { id: "shift-1", assignedTo: "Hans" };

      engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Test override" },
        mockActor,
      );

      const overrides = engine.getActiveOverrides();
      expect(overrides).toHaveLength(1);
      expect(overrides[0].reason).toBe("Test override");
      expect(overrides[0].isActive).toBe(true);
    });

    test("should remove override by ID", () => {
      const targetShift = { id: "shift-1", assignedTo: "Hans" };

      const createResult = engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Test override" },
        mockActor,
      );

      const removeResult = engine.removeOverride(
        createResult.override.id,
        mockActor,
      );

      expect(removeResult.success).toBe(true);
      expect(engine.getActiveOverrides()).toHaveLength(0);
    });

    test("should fail to remove non-existent override", () => {
      const result = engine.removeOverride("invalid-id", mockActor);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Override not found");
    });
  });

  describe("Audit Integration", () => {
    test("should log rule evaluation", () => {
      const { AuditService } = require("../src/services/auditService.js");

      const targetShift = { id: "shift-1", assignedTo: "Hans" };

      engine.enforceRules(targetShift, [], [], mockActor);

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "rule_evaluation",
        mockActor.name,
        mockActor.role,
        expect.objectContaining({
          shiftId: "shift-1",
          canAssign: expect.any(Boolean),
        }),
      );
    });

    test("should log override creation", () => {
      const { AuditService } = require("../src/services/auditService.js");

      const targetShift = { id: "shift-1", assignedTo: "Hans" };

      engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Emergency" },
        mockActor,
      );

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "rule_override_created",
        mockActor.name,
        mockActor.role,
        expect.objectContaining({
          ruleId: "PREVENT_DOUBLE_BOOKING",
          shiftId: "shift-1",
          reason: "Emergency",
        }),
      );
    });

    test("should log override application", () => {
      const { AuditService } = require("../src/services/auditService.js");

      const targetShift = {
        id: "shift-1",
        date: "2025-01-15",
        start: "08:00",
        end: "16:00",
        assignedTo: "Hans Mueller",
        status: "assigned",
      };

      const existingShifts = [
        {
          id: "shift-2",
          date: "2025-01-15",
          start: "14:00",
          end: "22:00",
          assignedTo: "Hans Mueller",
          status: "assigned",
        },
      ];

      // Create override and enforce
      engine.createOverride(
        targetShift,
        "PREVENT_DOUBLE_BOOKING",
        { reason: "Emergency" },
        mockActor,
      );

      jest.clearAllMocks(); // Clear the override creation call

      engine.enforceRules(targetShift, existingShifts, [], mockActor);

      expect(AuditService.logAction).toHaveBeenCalledWith(
        "rule_override_applied",
        mockActor.name,
        mockActor.role,
        expect.objectContaining({
          shiftId: "shift-1",
          overrideCount: 1,
        }),
      );
    });
  });

  describe("Default Instance", () => {
    test("should provide default rule engine instance", () => {
      expect(ruleEngine).toBeInstanceOf(RuleEngine);
      expect(ruleEngine.getRules()).toEqual(RULES);
    });
  });
});
