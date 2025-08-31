/**
 * Tests for Rule Engine Service - Frontend integration layer
 */

import RuleEngineService from './ruleEngineService.js';

// Mock the rule engine backend
jest.mock('../../backend/rule-engine.js', () => ({
  ruleEngine: {
    evaluateRules: jest.fn(),
    createOverride: jest.fn(),
    enforceRules: jest.fn(),
    removeOverride: jest.fn(),
    getActiveOverrides: jest.fn(),
    getRules: jest.fn()
  }
}));

describe('RuleEngineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateAssignment', () => {
    test('should return validation result with UI-friendly format', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      
      const mockEvaluation = {
        canAssign: false,
        violations: [{
          rule: { id: 'PREVENT_DOUBLE_BOOKING', name: 'Prevent Double Booking', description: 'Test rule' },
          severity: 'BLOCKING',
          isBlocking: true,
          canOverride: true,
          conflicts: ['TIME_OVERLAP']
        }],
        overrides: [],
        summary: { totalViolations: 1, blockingViolations: 1 }
      };

      ruleEngine.evaluateRules.mockReturnValue(mockEvaluation);

      const shift = { id: 'test-shift', assignedTo: 'Hans' };
      const result = await RuleEngineService.validateAssignment(shift, [], []);

      expect(result.isValid).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].ruleId).toBe('PREVENT_DOUBLE_BOOKING');
      expect(result.violations[0].ruleName).toBe('Prevent Double Booking');
      expect(result.requiresOverride).toBe(true);
    });

    test('should handle validation errors gracefully', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      ruleEngine.evaluateRules.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      const result = await RuleEngineService.validateAssignment({ id: 'test' }, [], []);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Failed to validate assignment');
      expect(result.violations).toEqual([]);
    });
  });

  describe('checkAssignmentPermission', () => {
    test('should allow assignment with no violations', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      ruleEngine.evaluateRules.mockReturnValue({
        canAssign: true,
        violations: [],
        overrides: [],
        summary: { totalViolations: 0, blockingViolations: 0 }
      });

      const result = await RuleEngineService.checkAssignmentPermission({ id: 'test' }, [], []);

      expect(result.canAssign).toBe(true);
      expect(result.message).toBe('Assignment allowed');
    });

    test('should require override for blocking violations', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      ruleEngine.evaluateRules.mockReturnValue({
        canAssign: false,
        violations: [{
          rule: { id: 'PREVENT_DOUBLE_BOOKING' },
          isBlocking: true,
          canOverride: true
        }],
        overrides: [],
        summary: { totalViolations: 1, blockingViolations: 1 }
      });

      const result = await RuleEngineService.checkAssignmentPermission({ id: 'test' }, [], []);

      expect(result.canAssign).toBe(false);
      expect(result.message).toBe('Assignment requires override approval');
      expect(result.requiresOverride).toBe(true);
    });
  });

  describe('createOverride', () => {
    test('should create override with current user context', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      const mockOverride = {
        success: true,
        override: { id: 'override-123', reason: 'Emergency' },
        message: 'Override created'
      };

      ruleEngine.createOverride.mockReturnValue(mockOverride);

      const shift = { id: 'test-shift' };
      const overrideData = { 
        reason: 'Emergency',
        currentUser: { name: 'Test User', role: 'chief' }
      };

      const result = await RuleEngineService.createOverride(shift, 'PREVENT_DOUBLE_BOOKING', overrideData);

      expect(result.success).toBe(true);
      expect(result.override.reason).toBe('Emergency');
      expect(ruleEngine.createOverride).toHaveBeenCalledWith(
        shift,
        'PREVENT_DOUBLE_BOOKING',
        overrideData,
        { name: 'Test User', role: 'chief' }
      );
    });

    test('should handle override creation errors', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      ruleEngine.createOverride.mockImplementation(() => {
        throw new Error('Override failed');
      });

      const result = await RuleEngineService.createOverride({ id: 'test' }, 'RULE_ID', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Override failed');
    });
  });

  describe('enforceAssignment', () => {
    test('should enforce assignment with user context', async () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      const mockEnforcement = {
        success: true,
        blocked: false,
        message: 'Assignment allowed',
        evaluation: {}
      };

      ruleEngine.enforceRules.mockReturnValue(mockEnforcement);

      const shift = { id: 'test-shift' };
      const options = { 
        forceAssign: false,
        currentUser: { name: 'Test User', role: 'chief' }
      };

      const result = await RuleEngineService.enforceAssignment(shift, [], [], options);

      expect(result.success).toBe(true);
      expect(result.canProceed).toBe(true);
      expect(ruleEngine.enforceRules).toHaveBeenCalledWith(
        shift,
        [],
        [],
        { name: 'Test User', role: 'chief' },
        options
      );
    });
  });

  describe('formatViolationsForDisplay', () => {
    test('should format violations for UI display', () => {
      const violations = [
        { isBlocking: true, ruleName: 'Blocking Rule', description: 'Blocks assignment', canOverride: true },
        { isBlocking: false, ruleName: 'Warning Rule', description: 'Warning only' }
      ];

      const result = RuleEngineService.formatViolationsForDisplay(violations);

      expect(result.hasViolations).toBe(true);
      expect(result.hasBlockingViolations).toBe(true);
      expect(result.canOverride).toBe(true);
      expect(result.blocking).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.summary.total).toBe(2);
      expect(result.summary.blocking).toBe(1);
      expect(result.summary.warnings).toBe(1);
    });

    test('should handle empty violations array', () => {
      const result = RuleEngineService.formatViolationsForDisplay([]);

      expect(result.hasViolations).toBe(false);
      expect(result.hasBlockingViolations).toBe(false);
      expect(result.canOverride).toBe(false);
      expect(result.blocking).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('createOverrideDialogData', () => {
    test('should create override dialog data for UI', () => {
      const shift = {
        id: 'shift-123',
        date: '2025-01-15',
        start: '08:00',
        end: '16:00',
        assignedTo: 'Hans Mueller',
        workLocation: 'office'
      };

      const violations = [
        { ruleId: 'PREVENT_DOUBLE_BOOKING', ruleName: 'Prevent Double Booking', description: 'Test', severity: 'BLOCKING', canOverride: true },
        { ruleId: 'NON_OVERRIDABLE', ruleName: 'Non Overridable', description: 'Test', severity: 'BLOCKING', canOverride: false }
      ];

      const result = RuleEngineService.createOverrideDialogData(shift, violations);

      expect(result.shiftId).toBe('shift-123');
      expect(result.shiftDetails.date).toBe('2025-01-15');
      expect(result.shiftDetails.time).toBe('08:00 - 16:00');
      expect(result.shiftDetails.assignedTo).toBe('Hans Mueller');
      expect(result.shiftDetails.location).toBe('office');
      expect(result.violations).toHaveLength(1); // Only overridable violations
      expect(result.violations[0].ruleId).toBe('PREVENT_DOUBLE_BOOKING');
      expect(result.requiresApprover).toBe(true);
      expect(result.suggestedReasons).toContain('Emergency coverage required');
    });
  });

  describe('getActiveOverrides', () => {
    test('should get formatted active overrides', () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      const mockOverrides = [
        {
          id: 'override-1',
          ruleId: 'PREVENT_DOUBLE_BOOKING',
          reason: 'Emergency',
          createdAt: '2025-01-15T10:00:00.000Z'
        }
      ];

      ruleEngine.getActiveOverrides.mockReturnValue(mockOverrides);
      ruleEngine.getRules.mockReturnValue({
        PREVENT_DOUBLE_BOOKING: { name: 'Prevent Double Booking' }
      });

      const result = RuleEngineService.getActiveOverrides();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('override-1');
      expect(result[0].ruleName).toBe('Prevent Double Booking');
      expect(result[0].createdAtFormatted).toBeDefined();
    });

    test('should handle errors in getting overrides', () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      ruleEngine.getActiveOverrides.mockImplementation(() => {
        throw new Error('Failed to get overrides');
      });

      const result = RuleEngineService.getActiveOverrides();

      expect(result).toEqual([]);
    });
  });

  describe('getRulesForUI', () => {
    test('should get rules formatted for UI display', () => {
      const { ruleEngine } = require('../../backend/rule-engine.js');
      const mockRules = {
        PREVENT_DOUBLE_BOOKING: {
          id: 'PREVENT_DOUBLE_BOOKING',
          name: 'Prevent Double Booking',
          description: 'Prevents overlapping assignments',
          severity: 'BLOCKING',
          allowOverride: true
        }
      };

      ruleEngine.getRules.mockReturnValue(mockRules);

      const result = RuleEngineService.getRulesForUI();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('PREVENT_DOUBLE_BOOKING');
      expect(result[0].name).toBe('Prevent Double Booking');
      expect(result[0].isBlocking).toBe(true);
      expect(result[0].allowOverride).toBe(true);
    });
  });
});