/**
 * Rule Engine - Configurable business rules for shift assignments
 * Prevents double-booking and allows manual overrides with audit trail
 */

import { computeShiftConflicts, CONFLICT_CODES } from '../src/features/shifts/shifts.js';
import { categorizeConflicts, CONFLICT_SEVERITY } from '../src/utils/conflicts.js';
import { AuditService } from '../src/services/auditService.js';

// Rule definitions
export const RULES = {
  PREVENT_DOUBLE_BOOKING: {
    id: 'PREVENT_DOUBLE_BOOKING',
    name: 'Prevent Double Booking',
    description: 'Prevents assigning the same person to overlapping shifts',
    severity: 'BLOCKING',
    conflictCodes: [CONFLICT_CODES.ASSIGNMENT_COLLISION, CONFLICT_CODES.TIME_OVERLAP],
    allowOverride: true
  },
  LOCATION_CONSISTENCY: {
    id: 'LOCATION_CONSISTENCY',
    name: 'Location Consistency',
    description: 'Warns when same person assigned to different locations simultaneously',
    severity: 'WARNING',
    conflictCodes: [CONFLICT_CODES.LOCATION_MISMATCH],
    allowOverride: true
  },
  REST_PERIOD: {
    id: 'REST_PERIOD',
    name: 'Minimum Rest Period',
    description: 'Ensures adequate rest between consecutive shifts',
    severity: 'WARNING',
    conflictCodes: [CONFLICT_CODES.SHORT_TURNAROUND],
    allowOverride: true
  }
};

/**
 * Rule Engine class for managing business rules
 */
export class RuleEngine {
  constructor() {
    this.rules = { ...RULES };
    this.overrides = new Map(); // Store active overrides
  }

  /**
   * Evaluate rules against a shift assignment
   * @param {Object} targetShift - The shift being assigned
   * @param {Array} existingShifts - Current shift assignments
   * @param {Array} applications - Shift applications
   * @param {Object} options - Evaluation options
   * @returns {Object} Rule evaluation result
   */
  evaluateRules(targetShift, existingShifts = [], applications = [], options = {}) {
    // Detect conflicts using existing system
    const conflicts = computeShiftConflicts(targetShift, existingShifts, applications);
    const { warnings, blocking } = categorizeConflicts(conflicts);

    // Map conflicts to rules
    const violatedRules = [];
    const applicableOverrides = [];

    for (const rule of Object.values(this.rules)) {
      const ruleConflicts = conflicts.filter(conflict => 
        rule.conflictCodes.includes(conflict)
      );

      if (ruleConflicts.length > 0) {
        const violation = {
          rule: rule,
          conflicts: ruleConflicts,
          severity: rule.severity,
          canOverride: rule.allowOverride,
          isBlocking: rule.severity === 'BLOCKING'
        };

        violatedRules.push(violation);

        // Check for existing overrides
        const overrideKey = this.getOverrideKey(targetShift, rule.id);
        if (this.overrides.has(overrideKey)) {
          applicableOverrides.push({
            ...this.overrides.get(overrideKey),
            rule: rule
          });
        }
      }
    }

    // Determine final assignment status
    const blockingViolations = violatedRules.filter(v => v.isBlocking);
    const hasActiveOverrides = applicableOverrides.length > 0;
    
    const canAssign = blockingViolations.length === 0 || 
                     (hasActiveOverrides && this.allBlockingViolationsHaveOverrides(blockingViolations, applicableOverrides));

    return {
      canAssign,
      violations: violatedRules,
      overrides: applicableOverrides,
      conflicts: {
        all: conflicts,
        warnings,
        blocking
      },
      summary: {
        totalViolations: violatedRules.length,
        blockingViolations: blockingViolations.length,
        activeOverrides: applicableOverrides.length
      }
    };
  }

  /**
   * Create an override for a rule violation
   * @param {Object} targetShift - The shift being assigned
   * @param {string} ruleId - Rule being overridden
   * @param {Object} override - Override details (reason, approver, etc.)
   * @param {Object} actor - User creating the override
   * @returns {Object} Override result
   */
  createOverride(targetShift, ruleId, override, actor) {
    const rule = this.rules[ruleId];
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    if (!rule.allowOverride) {
      throw new Error(`Rule ${ruleId} does not allow overrides`);
    }

    const overrideKey = this.getOverrideKey(targetShift, ruleId);
    const overrideEntry = {
      id: `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId,
      shiftId: targetShift.id,
      reason: override.reason || '',
      approver: override.approver || actor.name,
      approverRole: override.approverRole || actor.role,
      createdBy: actor.name,
      createdAt: new Date().toISOString(),
      isActive: true,
      metadata: {
        shiftDate: targetShift.date,
        shiftTime: `${targetShift.start}-${targetShift.end}`,
        assignedTo: targetShift.assignedTo
      }
    };

    this.overrides.set(overrideKey, overrideEntry);

    // Log override creation to audit trail
    AuditService.logAction(
      'rule_override_created',
      actor.name,
      actor.role,
      {
        ruleId,
        shiftId: targetShift.id,
        reason: override.reason,
        approver: override.approver,
        overrideId: overrideEntry.id
      }
    );

    return {
      success: true,
      override: overrideEntry,
      message: `Override created for rule ${rule.name}`
    };
  }

  /**
   * Apply rule enforcement to a shift assignment
   * @param {Object} targetShift - The shift being assigned
   * @param {Array} existingShifts - Current shift assignments
   * @param {Array} applications - Shift applications  
   * @param {Object} actor - User performing the assignment
   * @param {Object} options - Assignment options
   * @returns {Object} Enforcement result
   */
  enforceRules(targetShift, existingShifts, applications, actor, options = {}) {
    const evaluation = this.evaluateRules(targetShift, existingShifts, applications, options);

    // Log rule evaluation
    AuditService.logAction(
      'rule_evaluation',
      actor.name,
      actor.role,
      {
        shiftId: targetShift.id,
        canAssign: evaluation.canAssign,
        violationCount: evaluation.summary.totalViolations,
        blockingCount: evaluation.summary.blockingViolations,
        overrideCount: evaluation.summary.activeOverrides,
        conflicts: evaluation.conflicts.all
      }
    );

    if (!evaluation.canAssign && !options.forceAssign) {
      // Assignment blocked by rules
      return {
        success: false,
        blocked: true,
        evaluation,
        message: this.getBlockingMessage(evaluation.violations)
      };
    }

    // Assignment allowed (either no violations or valid overrides)
    if (evaluation.summary.activeOverrides > 0) {
      // Log override usage
      AuditService.logAction(
        'rule_override_applied',
        actor.name,
        actor.role,
        {
          shiftId: targetShift.id,
          overrideCount: evaluation.summary.activeOverrides,
          overrides: evaluation.overrides.map(o => ({
            ruleId: o.ruleId,
            reason: o.reason,
            approver: o.approver
          }))
        }
      );
    }

    return {
      success: true,
      blocked: false,
      evaluation,
      message: evaluation.summary.totalViolations > 0 
        ? 'Assignment allowed with rule overrides'
        : 'Assignment allowed'
    };
  }

  /**
   * Get override key for storing overrides
   * @private
   */
  getOverrideKey(shift, ruleId) {
    return `${shift.id}_${ruleId}`;
  }

  /**
   * Check if all blocking violations have active overrides
   * @private
   */
  allBlockingViolationsHaveOverrides(blockingViolations, activeOverrides) {
    const overriddenRules = new Set(activeOverrides.map(o => o.ruleId));
    return blockingViolations.every(v => overriddenRules.has(v.rule.id));
  }

  /**
   * Generate blocking message for violations
   * @private
   */
  getBlockingMessage(violations) {
    const blocking = violations.filter(v => v.isBlocking);
    if (blocking.length === 0) return '';
    
    const ruleNames = blocking.map(v => v.rule.name);
    return `Assignment blocked by rules: ${ruleNames.join(', ')}`;
  }

  /**
   * Remove an override
   * @param {string} overrideId - Override to remove
   * @param {Object} actor - User removing the override
   * @returns {Object} Removal result
   */
  removeOverride(overrideId, actor) {
    for (const [key, override] of this.overrides.entries()) {
      if (override.id === overrideId) {
        this.overrides.delete(key);
        
        AuditService.logAction(
          'rule_override_removed',
          actor.name,
          actor.role,
          {
            overrideId,
            ruleId: override.ruleId,
            shiftId: override.shiftId,
            originalReason: override.reason
          }
        );

        return {
          success: true,
          message: 'Override removed successfully'
        };
      }
    }

    return {
      success: false,
      message: 'Override not found'
    };
  }

  /**
   * Get all active overrides
   * @returns {Array} List of active overrides
   */
  getActiveOverrides() {
    return Array.from(this.overrides.values()).filter(o => o.isActive);
  }

  /**
   * Get rule definitions
   * @returns {Object} Available rules
   */
  getRules() {
    return { ...this.rules };
  }
}

// Default instance
export const ruleEngine = new RuleEngine();

export default RuleEngine;