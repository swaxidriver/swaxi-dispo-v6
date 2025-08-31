/**
 * Rule Engine Service - Frontend integration for rule engine
 * Provides high-level interface for UI components to interact with rule engine
 */

import { ruleEngine } from '../../backend/rule-engine.js';
import { useAuth } from '../contexts/useAuth.js';

/**
 * Service for managing business rules in shift assignments
 */
export class RuleEngineService {
  /**
   * Validate shift assignment against business rules
   * @param {Object} shift - Shift to validate
   * @param {Array} existingShifts - Current shifts
   * @param {Array} applications - Shift applications
   * @returns {Object} Validation result with UI-friendly format
   */
  static async validateAssignment(shift, existingShifts = [], applications = []) {
    try {
      const evaluation = ruleEngine.evaluateRules(shift, existingShifts, applications);
      
      return {
        isValid: evaluation.canAssign,
        violations: evaluation.violations.map(v => ({
          ruleId: v.rule.id,
          ruleName: v.rule.name,
          description: v.rule.description,
          severity: v.severity,
          isBlocking: v.isBlocking,
          canOverride: v.canOverride,
          conflicts: v.conflicts
        })),
        overrides: evaluation.overrides,
        summary: evaluation.summary,
        requiresOverride: !evaluation.canAssign && evaluation.violations.some(v => v.canOverride)
      };
    } catch (error) {
      console.error('Error validating assignment:', error);
      return {
        isValid: false,
        error: 'Failed to validate assignment',
        violations: [],
        overrides: [],
        summary: { totalViolations: 0, blockingViolations: 0 }
      };
    }
  }

  /**
   * Check if user can assign shifts (considers rules)
   * @param {Object} shift - Shift to assign
   * @param {Array} existingShifts - Current shifts
   * @param {Array} applications - Applications
   * @returns {Object} Assignment check result
   */
  static async checkAssignmentPermission(shift, existingShifts = [], applications = []) {
    const validation = await this.validateAssignment(shift, existingShifts, applications);
    
    if (validation.isValid) {
      return {
        canAssign: true,
        message: 'Assignment allowed'
      };
    }

    const blockingViolations = validation.violations.filter(v => v.isBlocking);
    const hasOverridableViolations = validation.violations.some(v => v.canOverride);

    if (blockingViolations.length > 0 && !hasOverridableViolations) {
      return {
        canAssign: false,
        message: 'Assignment blocked by non-overridable rules',
        violations: validation.violations
      };
    }

    return {
      canAssign: false,
      message: 'Assignment requires override approval',
      violations: validation.violations,
      requiresOverride: true
    };
  }

  /**
   * Create rule override with current user context
   * @param {Object} shift - Shift for override
   * @param {string} ruleId - Rule to override
   * @param {Object} overrideData - Override details
   * @returns {Object} Override creation result
   */
  static async createOverride(shift, ruleId, overrideData) {
    try {
      // Note: In a real app, this would get user from context/hook
      // For now, we'll accept it as a parameter or use a mock
      const currentUser = overrideData.currentUser || {
        name: 'System User',
        role: 'admin'
      };

      const actor = {
        name: currentUser.name || currentUser.email || 'Unknown User',
        role: currentUser.role || 'disponent'
      };

      const result = ruleEngine.createOverride(shift, ruleId, overrideData, actor);
      
      return {
        success: result.success,
        override: result.override,
        message: result.message
      };
    } catch (error) {
      console.error('Error creating override:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to create override'
      };
    }
  }

  /**
   * Enforce rules during shift assignment
   * @param {Object} shift - Shift being assigned
   * @param {Array} existingShifts - Current shifts
   * @param {Array} applications - Applications
   * @param {Object} options - Assignment options
   * @returns {Object} Enforcement result
   */
  static async enforceAssignment(shift, existingShifts = [], applications = [], options = {}) {
    try {
      // Note: In a real app, this would get user from context/hook
      const currentUser = options.currentUser || {
        name: 'System User',
        role: 'admin'
      };

      const actor = {
        name: currentUser.name || currentUser.email || 'Unknown User',
        role: currentUser.role || 'disponent'
      };

      const result = ruleEngine.enforceRules(shift, existingShifts, applications, actor, options);
      
      return {
        success: result.success,
        blocked: result.blocked,
        message: result.message,
        evaluation: result.evaluation,
        canProceed: result.success || options.forceAssign
      };
    } catch (error) {
      console.error('Error enforcing assignment:', error);
      return {
        success: false,
        blocked: true,
        error: error.message,
        message: 'Failed to enforce assignment rules',
        canProceed: false
      };
    }
  }

  /**
   * Get active overrides for UI display
   * @returns {Array} List of active overrides
   */
  static getActiveOverrides() {
    try {
      return ruleEngine.getActiveOverrides().map(override => ({
        ...override,
        createdAtFormatted: new Date(override.createdAt).toLocaleDateString(),
        ruleName: ruleEngine.getRules()[override.ruleId]?.name || override.ruleId
      }));
    } catch (error) {
      console.error('Error getting active overrides:', error);
      return [];
    }
  }

  /**
   * Remove override with current user context
   * @param {string} overrideId - Override to remove
   * @returns {Object} Removal result
   */
  static async removeOverride(overrideId) {
    try {
      // Note: In a real app, this would get user from context/hook
      const currentUser = {
        name: 'System User',
        role: 'admin'
      };

      const actor = {
        name: currentUser.name || 'Unknown User',
        role: currentUser.role || 'disponent'
      };

      return ruleEngine.removeOverride(overrideId, actor);
    } catch (error) {
      console.error('Error removing override:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to remove override'
      };
    }
  }

  /**
   * Get available rules for UI display
   * @returns {Object} Available rules with UI-friendly format
   */
  static getRulesForUI() {
    try {
      const rules = ruleEngine.getRules();
      return Object.values(rules).map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        allowOverride: rule.allowOverride,
        isBlocking: rule.severity === 'BLOCKING'
      }));
    } catch (error) {
      console.error('Error getting rules for UI:', error);
      return [];
    }
  }

  /**
   * Format violations for user display
   * @param {Array} violations - Rule violations
   * @returns {Object} Formatted violation data
   */
  static formatViolationsForDisplay(violations = []) {
    const blocking = violations.filter(v => v.isBlocking);
    const warnings = violations.filter(v => !v.isBlocking);

    return {
      hasViolations: violations.length > 0,
      hasBlockingViolations: blocking.length > 0,
      canOverride: violations.some(v => v.canOverride),
      blocking: blocking.map(v => ({
        name: v.ruleName,
        description: v.description,
        canOverride: v.canOverride
      })),
      warnings: warnings.map(v => ({
        name: v.ruleName,
        description: v.description
      })),
      summary: {
        total: violations.length,
        blocking: blocking.length,
        warnings: warnings.length
      }
    };
  }

  /**
   * Create override dialog data for UI
   * @param {Object} shift - Shift requiring override
   * @param {Array} violations - Rule violations
   * @returns {Object} Dialog data
   */
  static createOverrideDialogData(shift, violations = []) {
    const overridableViolations = violations.filter(v => v.canOverride);
    
    return {
      shiftId: shift.id,
      shiftDetails: {
        date: shift.date,
        time: `${shift.start} - ${shift.end}`,
        assignedTo: shift.assignedTo,
        location: shift.workLocation
      },
      violations: overridableViolations.map(v => ({
        ruleId: v.ruleId,
        name: v.ruleName,
        description: v.description,
        severity: v.severity
      })),
      requiresApprover: true,
      suggestedReasons: [
        'Emergency coverage required',
        'Staff shortage - temporary exception',
        'Special circumstances approved by management',
        'Training/orientation requirements',
        'Other (please specify)'
      ]
    };
  }
}

export default RuleEngineService;