import RuleEngineService from "../services/ruleEngineService.js";
import { ruleEngine } from "../../backend/rule-engine.js";

// Helper to build a shift
function shift({
  id,
  date,
  start,
  end,
  assignedTo = "user1",
  status = "assigned",
  workLocation = "LOC_A",
}) {
  return { id, date, start, end, assignedTo, status, workLocation };
}

describe("RuleEngineService", () => {
  beforeEach(() => {
    // Reset overrides between tests
    ruleEngine.overrides.clear();
    // Clear audit logs side-effects
    localStorage.clear();
  });

  test("validateAssignment returns isValid true when no conflicts", async () => {
    const target = shift({
      id: "s1",
      date: "2025-08-31",
      start: "09:00",
      end: "12:00",
    });
    const result = await RuleEngineService.validateAssignment(target, [], []);
    expect(result.isValid).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test("validateAssignment reports blocking + warning violations (overlap + location mismatch)", async () => {
    const existing = [
      // Overlapping shift same person different location to trigger TIME_OVERLAP + ASSIGNMENT_COLLISION + LOCATION_MISMATCH
      shift({
        id: "e1",
        date: "2025-08-31",
        start: "10:00",
        end: "13:00",
        workLocation: "LOC_B",
      }),
    ];
    const target = shift({
      id: "t1",
      date: "2025-08-31",
      start: "11:00",
      end: "14:00",
      workLocation: "LOC_A",
    });
    const result = await RuleEngineService.validateAssignment(
      target,
      existing,
      [],
    );
    // Should be invalid due to blocking PREVENT_DOUBLE_BOOKING
    expect(result.isValid).toBe(false);
    const ruleIds = result.violations.map((v) => v.ruleId);
    expect(ruleIds).toContain("PREVENT_DOUBLE_BOOKING");
    expect(ruleIds).toContain("LOCATION_CONSISTENCY");
    const blockingRule = result.violations.find(
      (v) => v.ruleId === "PREVENT_DOUBLE_BOOKING",
    );
    expect(blockingRule.isBlocking).toBe(true);
  });

  test("override of blocking rule allows assignment after creation", async () => {
    const existing = [
      shift({
        id: "e1",
        date: "2025-08-31",
        start: "10:00",
        end: "13:00",
        workLocation: "LOC_B",
      }),
    ];
    const target = shift({
      id: "t1",
      date: "2025-08-31",
      start: "11:00",
      end: "14:00",
      workLocation: "LOC_A",
    });

    const before = await RuleEngineService.validateAssignment(
      target,
      existing,
      [],
    );
    expect(before.isValid).toBe(false);
    // Create override for blocking rule
    const ovRes = await RuleEngineService.createOverride(
      target,
      "PREVENT_DOUBLE_BOOKING",
      { reason: "Test override", approver: "Admin" },
    );
    expect(ovRes.success).toBe(true);
    const after = await RuleEngineService.validateAssignment(
      target,
      existing,
      [],
    );
    expect(after.isValid).toBe(true);
    // Ensure override is registered
    expect(after.overrides.length).toBe(1);
  });

  test("enforceAssignment blocks then succeeds with override", async () => {
    const existing = [
      shift({
        id: "e1",
        date: "2025-08-31",
        start: "10:00",
        end: "13:00",
        workLocation: "LOC_B",
      }),
    ];
    const target = shift({
      id: "t1",
      date: "2025-08-31",
      start: "11:00",
      end: "14:00",
      workLocation: "LOC_A",
    });

    const blocked = await RuleEngineService.enforceAssignment(
      target,
      existing,
      [],
      {},
    );
    expect(blocked.success).toBe(false);
    expect(blocked.blocked).toBe(true);
    expect(blocked.message).toMatch(/Prevent Double Booking/);

    await RuleEngineService.createOverride(target, "PREVENT_DOUBLE_BOOKING", {
      reason: "Allowed",
      approver: "Admin",
    });
    const allowed = await RuleEngineService.enforceAssignment(
      target,
      existing,
      [],
      {},
    );
    expect(allowed.success).toBe(true);
    expect(allowed.blocked).toBe(false);
    expect(allowed.message).toMatch(/allowed/i);
  });

  test("REST_PERIOD warning does not block assignment", async () => {
    const existing = [
      shift({ id: "prev", date: "2025-08-31", start: "14:00", end: "22:00" }),
    ];
    // Next day early shift (7h rest < 8h threshold) -> SHORT_TURNAROUND -> REST_PERIOD (warning)
    const target = shift({
      id: "early",
      date: "2025-09-01",
      start: "05:00",
      end: "09:00",
    });
    const result = await RuleEngineService.validateAssignment(
      target,
      existing,
      [],
    );
    expect(result.isValid).toBe(true); // only warning
    const restRule = result.violations.find((v) => v.ruleId === "REST_PERIOD");
    expect(restRule).toBeDefined();
    expect(restRule.isBlocking).toBe(false);
  });

  test("formatViolationsForDisplay splits blocking and warnings", () => {
    const violations = [
      {
        ruleId: "PREVENT_DOUBLE_BOOKING",
        ruleName: "Prevent Double Booking",
        description: "Overlap",
        isBlocking: true,
        canOverride: true,
      },
      {
        ruleId: "REST_PERIOD",
        ruleName: "Minimum Rest Period",
        description: "Short rest",
        isBlocking: false,
        canOverride: true,
      },
    ];
    const formatted = RuleEngineService.formatViolationsForDisplay(violations);
    expect(formatted.blocking.length).toBe(1);
    expect(formatted.warnings.length).toBe(1);
    expect(formatted.hasBlockingViolations).toBe(true);
  });

  test("createOverrideDialogData builds dialog structure with overridable violations", () => {
    const shiftObj = shift({
      id: "t1",
      date: "2025-08-31",
      start: "11:00",
      end: "14:00",
      workLocation: "LOC_A",
    });
    const violations = [
      {
        ruleId: "PREVENT_DOUBLE_BOOKING",
        ruleName: "Prevent Double Booking",
        description: "Overlap",
        severity: "BLOCKING",
        canOverride: true,
      },
      {
        ruleId: "REST_PERIOD",
        ruleName: "Minimum Rest Period",
        description: "Short rest",
        severity: "WARNING",
        canOverride: true,
      },
    ];
    const dialog = RuleEngineService.createOverrideDialogData(
      shiftObj,
      violations,
    );
    expect(dialog.shiftId).toBe("t1");
    expect(dialog.violations.length).toBe(2);
    expect(dialog.suggestedReasons.length).toBeGreaterThan(0);
  });
});
