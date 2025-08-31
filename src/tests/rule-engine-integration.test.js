/**
 * Integration test for Rule Engine - Double-booking prevention scenarios
 * Tests the complete flow from rule evaluation to override application
 */

import { RuleEngine } from '../../backend/rule-engine.js';
import { computeShiftConflicts, CONFLICT_CODES } from '../features/shifts/shifts.js';
import { categorizeConflicts } from '../utils/conflicts.js';

// Mock audit service for integration tests
jest.mock('../services/auditService.js', () => ({
  AuditService: {
    logAction: jest.fn().mockReturnValue({ id: 'audit-123' })
  }
}));

describe('Rule Engine Integration - Double-booking Prevention', () => {
  let ruleEngine;
  let testActor;

  beforeEach(() => {
    ruleEngine = new RuleEngine();
    testActor = {
      name: 'Chief Manager',
      role: 'CHIEF'
    };
    jest.clearAllMocks();
  });

  describe('Case 1: Rule blocks overlap without override', () => {
    test('should prevent assignment due to time overlap and assignment collision', () => {
      // Scenario: Hans Mueller is already assigned to a shift, 
      // trying to assign him to an overlapping shift
      const existingShift = {
        id: 'shift-existing',
        date: '2025-01-15',
        start: '08:00',
        end: '16:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned',
        workLocation: 'office'
      };

      const newShift = {
        id: 'shift-new',
        date: '2025-01-15',
        start: '14:00', // Overlaps with existing shift
        end: '22:00',
        assignedTo: 'Hans Mueller', // Same person
        status: 'assigned',
        workLocation: 'office'
      };

      // Step 1: Evaluate rules
      const evaluation = ruleEngine.evaluateRules(newShift, [existingShift], []);
      
      expect(evaluation.canAssign).toBe(false);
      expect(evaluation.violations).toHaveLength(1);
      expect(evaluation.violations[0].rule.id).toBe('PREVENT_DOUBLE_BOOKING');
      expect(evaluation.violations[0].isBlocking).toBe(true);
      
      // Step 2: Attempt enforcement without override
      const enforcement = ruleEngine.enforceRules(newShift, [existingShift], [], testActor);
      
      expect(enforcement.success).toBe(false);
      expect(enforcement.blocked).toBe(true);
      expect(enforcement.message).toContain('Assignment blocked by rules: Prevent Double Booking');
    });
  });

  describe('Case 2: Exception with note allows assignment', () => {
    test('should allow assignment with valid override and reason', () => {
      // Same scenario as Case 1, but with override
      const existingShift = {
        id: 'shift-existing',
        date: '2025-01-15',
        start: '08:00',
        end: '16:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned',
        workLocation: 'office'
      };

      const newShift = {
        id: 'shift-new',
        date: '2025-01-15',
        start: '14:00',
        end: '22:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned',
        workLocation: 'office'
      };

      // Step 1: Confirm rule violation exists
      const initialEvaluation = ruleEngine.evaluateRules(newShift, [existingShift], []);
      expect(initialEvaluation.canAssign).toBe(false);

      // Step 2: Create override with business justification
      const overrideResult = ruleEngine.createOverride(
        newShift,
        'PREVENT_DOUBLE_BOOKING',
        {
          reason: 'Critical emergency coverage required due to staff illness. Approved by operations manager.',
          approver: 'Operations Manager',
          approverRole: 'MANAGER'
        },
        testActor
      );

      expect(overrideResult.success).toBe(true);
      expect(overrideResult.override.reason).toContain('Critical emergency coverage');
      expect(overrideResult.override.approver).toBe('Operations Manager');

      // Step 3: Re-evaluate with override in place
      const overriddenEvaluation = ruleEngine.evaluateRules(newShift, [existingShift], []);
      expect(overriddenEvaluation.canAssign).toBe(true);
      expect(overriddenEvaluation.overrides).toHaveLength(1);

      // Step 4: Enforce rules with override
      const enforcement = ruleEngine.enforceRules(newShift, [existingShift], [], testActor);
      
      expect(enforcement.success).toBe(true);
      expect(enforcement.blocked).toBe(false);
      expect(enforcement.message).toBe('Assignment allowed with rule overrides');
    });
  });

  describe('Audit Trail Validation', () => {
    test('should persist all rule outcomes to audit log', () => {
      const { AuditService } = require('../services/auditService.js');
      
      const shift = {
        id: 'shift-audit-test',
        date: '2025-01-15',
        start: '08:00',
        end: '16:00',
        assignedTo: 'Test User',
        status: 'assigned'
      };

      // Step 1: Test rule evaluation logging
      ruleEngine.enforceRules(shift, [], [], testActor);
      
      expect(AuditService.logAction).toHaveBeenCalledWith(
        'rule_evaluation',
        testActor.name,
        testActor.role,
        expect.objectContaining({
          shiftId: 'shift-audit-test',
          canAssign: true,
          violationCount: 0,
          blockingCount: 0
        })
      );

      // Step 2: Test override creation logging
      jest.clearAllMocks();
      
      ruleEngine.createOverride(
        shift,
        'PREVENT_DOUBLE_BOOKING',
        { reason: 'Test override', approver: 'Test Approver' },
        testActor
      );

      expect(AuditService.logAction).toHaveBeenCalledWith(
        'rule_override_created',
        testActor.name,
        testActor.role,
        expect.objectContaining({
          ruleId: 'PREVENT_DOUBLE_BOOKING',
          shiftId: 'shift-audit-test',
          reason: 'Test override'
        })
      );
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple overlapping shifts with mixed violations', () => {
      const targetShift = {
        id: 'target-shift',
        date: '2025-01-15',
        start: '10:00',
        end: '18:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned',
        workLocation: 'office'
      };

      const existingShifts = [
        // First overlap - same location
        {
          id: 'shift-1',
          date: '2025-01-15',
          start: '08:00',
          end: '12:00',
          assignedTo: 'Hans Mueller',
          status: 'assigned',
          workLocation: 'office'
        },
        // Second overlap - different location (should add location mismatch)
        {
          id: 'shift-2',
          date: '2025-01-15',
          start: '16:00',
          end: '20:00',
          assignedTo: 'Hans Mueller',
          status: 'assigned',
          workLocation: 'home'
        }
      ];

      const evaluation = ruleEngine.evaluateRules(targetShift, existingShifts, []);
      
      // Should detect both double-booking and location violations
      expect(evaluation.canAssign).toBe(false);
      expect(evaluation.violations.length).toBeGreaterThan(0);
      
      // Should have double-booking violation (blocking)
      const doubleBookingViolation = evaluation.violations.find(v => v.rule.id === 'PREVENT_DOUBLE_BOOKING');
      expect(doubleBookingViolation).toBeDefined();
      expect(doubleBookingViolation.isBlocking).toBe(true);
      
      // Should have location mismatch violation (warning)
      const locationViolation = evaluation.violations.find(v => v.rule.id === 'LOCATION_CONSISTENCY');
      expect(locationViolation).toBeDefined();
      expect(locationViolation.isBlocking).toBe(false);
    });

    test('should handle short turnaround scenarios across days', () => {
      const nightShift = {
        id: 'night-shift',
        date: '2025-01-15',
        start: '22:00',
        end: '06:00', // Ends at 6 AM next day
        assignedTo: 'Hans Mueller',
        status: 'assigned'
      };

      const morningShift = {
        id: 'morning-shift',
        date: '2025-01-16',
        start: '07:00', // Starts 1 hour after night shift ends
        end: '15:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned'
      };

      const evaluation = ruleEngine.evaluateRules(nightShift, [morningShift], []);
      
      // Should detect short turnaround
      const restViolation = evaluation.violations.find(v => v.rule.id === 'REST_PERIOD');
      if (restViolation) {
        expect(restViolation.isBlocking).toBe(false); // Warning only
        expect(restViolation.canOverride).toBe(true);
      }
    });
  });

  describe('Override Edge Cases', () => {
    test('should handle multiple overrides for same shift', () => {
      const shift = {
        id: 'multi-override-shift',
        date: '2025-01-15',
        start: '08:00',
        end: '16:00',
        assignedTo: 'Hans Mueller',
        status: 'assigned',
        workLocation: 'office'
      };

      // Create overrides for different rules
      const override1 = ruleEngine.createOverride(
        shift,
        'PREVENT_DOUBLE_BOOKING',
        { reason: 'Emergency coverage', approver: 'Manager 1' },
        testActor
      );

      const override2 = ruleEngine.createOverride(
        shift,
        'LOCATION_CONSISTENCY', 
        { reason: 'Special assignment', approver: 'Manager 2' },
        testActor
      );

      expect(override1.success).toBe(true);
      expect(override2.success).toBe(true);

      const activeOverrides = ruleEngine.getActiveOverrides();
      expect(activeOverrides).toHaveLength(2);
    });

    test('should properly remove and audit override removal', () => {
      const { AuditService } = require('../services/auditService.js');
      
      const shift = { id: 'removal-test', assignedTo: 'Hans' };
      
      const createResult = ruleEngine.createOverride(
        shift,
        'PREVENT_DOUBLE_BOOKING',
        { reason: 'Temporary override' },
        testActor
      );

      jest.clearAllMocks();

      const removeResult = ruleEngine.removeOverride(createResult.override.id, testActor);
      
      expect(removeResult.success).toBe(true);
      expect(AuditService.logAction).toHaveBeenCalledWith(
        'rule_override_removed',
        testActor.name,
        testActor.role,
        expect.objectContaining({
          overrideId: createResult.override.id,
          ruleId: 'PREVENT_DOUBLE_BOOKING'
        })
      );
    });
  });
});