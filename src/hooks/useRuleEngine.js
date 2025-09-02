/**
 * React hook for rule engine integration
 * Provides easy access to rule validation and override functionality
 */

import { useState, useCallback } from "react";
import RuleEngineService from "../services/ruleEngineService.js";

/**
 * Hook for managing rule engine interactions
 * @param {Object} options - Hook configuration options
 * @returns {Object} Rule engine functions and state
 */
export function useRuleEngine(options = {}) {
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingOverride, setIsCreatingOverride] = useState(false);
  const [lastValidation, setLastValidation] = useState(null);
  const [activeOverrides, setActiveOverrides] = useState([]);

  /**
   * Validate shift assignment against rules
   */
  const validateAssignment = useCallback(
    async (shift, existingShifts = [], applications = []) => {
      setIsValidating(true);
      try {
        const result = await RuleEngineService.validateAssignment(
          shift,
          existingShifts,
          applications,
        );
        setLastValidation(result);
        return result;
      } catch (error) {
        console.error("Validation error:", error);
        return {
          isValid: false,
          error: error.message,
          violations: [],
        };
      } finally {
        setIsValidating(false);
      }
    },
    [],
  );

  /**
   * Check if assignment is permitted
   */
  const checkAssignmentPermission = useCallback(
    async (shift, existingShifts = [], applications = []) => {
      return await RuleEngineService.checkAssignmentPermission(
        shift,
        existingShifts,
        applications,
      );
    },
    [],
  );

  /**
   * Create rule override
   */
  const createOverride = useCallback(async (shift, ruleId, overrideData) => {
    setIsCreatingOverride(true);
    try {
      const result = await RuleEngineService.createOverride(
        shift,
        ruleId,
        overrideData,
      );
      if (result.success) {
        // Refresh active overrides after creation
        refreshActiveOverrides();
      }
      return result;
    } catch (error) {
      console.error("Override creation error:", error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      setIsCreatingOverride(false);
    }
  }, []);

  /**
   * Enforce assignment with rules
   */
  const enforceAssignment = useCallback(
    async (shift, existingShifts = [], applications = [], options = {}) => {
      return await RuleEngineService.enforceAssignment(
        shift,
        existingShifts,
        applications,
        options,
      );
    },
    [],
  );

  /**
   * Remove override
   */
  const removeOverride = useCallback(async (overrideId) => {
    const result = await RuleEngineService.removeOverride(overrideId);
    if (result.success) {
      refreshActiveOverrides();
    }
    return result;
  }, []);

  /**
   * Refresh active overrides list
   */
  const refreshActiveOverrides = useCallback(() => {
    const overrides = RuleEngineService.getActiveOverrides();
    setActiveOverrides(overrides);
  }, []);

  /**
   * Get rules for display
   */
  const getRulesForUI = useCallback(() => {
    return RuleEngineService.getRulesForUI();
  }, []);

  /**
   * Format violations for display
   */
  const formatViolations = useCallback((violations) => {
    return RuleEngineService.formatViolationsForDisplay(violations);
  }, []);

  /**
   * Create override dialog data
   */
  const createOverrideDialogData = useCallback((shift, violations) => {
    return RuleEngineService.createOverrideDialogData(shift, violations);
  }, []);

  /**
   * Check if assignment can proceed
   */
  const canProceedWithAssignment = useCallback((validationResult) => {
    if (!validationResult) return false;
    if (validationResult.isValid) return true;

    // Can proceed if all blocking violations can be overridden
    const blockingViolations =
      validationResult.violations?.filter((v) => v.isBlocking) || [];
    return blockingViolations.every((v) => v.canOverride);
  }, []);

  /**
   * Get violation summary for display
   */
  const getViolationSummary = useCallback((validationResult) => {
    if (!validationResult || !validationResult.violations) {
      return { message: "", severity: "info" };
    }

    const { violations } = validationResult;
    const blockingCount = violations.filter((v) => v.isBlocking).length;
    const warningCount = violations.filter((v) => !v.isBlocking).length;

    if (blockingCount > 0) {
      return {
        message: `${blockingCount} blocking rule${blockingCount > 1 ? "s" : ""} violated`,
        severity: "error",
        details: violations.filter((v) => v.isBlocking).map((v) => v.ruleName),
      };
    }

    if (warningCount > 0) {
      return {
        message: `${warningCount} warning${warningCount > 1 ? "s" : ""}`,
        severity: "warning",
        details: violations.filter((v) => !v.isBlocking).map((v) => v.ruleName),
      };
    }

    return {
      message: "No rule violations",
      severity: "success",
    };
  }, []);

  /**
   * Initialize hook - refresh overrides on mount
   */
  useState(() => {
    if (options.loadOverridesOnMount !== false) {
      refreshActiveOverrides();
    }
  });

  return {
    // State
    isValidating,
    isCreatingOverride,
    lastValidation,
    activeOverrides,

    // Actions
    validateAssignment,
    checkAssignmentPermission,
    createOverride,
    enforceAssignment,
    removeOverride,
    refreshActiveOverrides,

    // Utility functions
    getRulesForUI,
    formatViolations,
    createOverrideDialogData,
    canProceedWithAssignment,
    getViolationSummary,
  };
}

/**
 * Hook specifically for assignment validation
 * Simplified interface for common validation scenarios
 */
export function useAssignmentValidation() {
  const [validationState, setValidationState] = useState({
    isValid: true,
    violations: [],
    isLoading: false,
    lastChecked: null,
  });

  const validateShiftAssignment = useCallback(
    async (shift, existingShifts = [], applications = []) => {
      setValidationState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await RuleEngineService.validateAssignment(
          shift,
          existingShifts,
          applications,
        );

        setValidationState({
          isValid: result.isValid,
          violations: result.violations || [],
          overrides: result.overrides || [],
          summary: result.summary,
          requiresOverride: result.requiresOverride,
          isLoading: false,
          lastChecked: new Date().toISOString(),
          error: result.error,
        });

        return result;
      } catch (error) {
        setValidationState({
          isValid: false,
          violations: [],
          isLoading: false,
          lastChecked: new Date().toISOString(),
          error: error.message,
        });

        throw error;
      }
    },
    [],
  );

  const clearValidation = useCallback(() => {
    setValidationState({
      isValid: true,
      violations: [],
      isLoading: false,
      lastChecked: null,
    });
  }, []);

  return {
    validationState,
    validateShiftAssignment,
    clearValidation,
    hasViolations: validationState.violations.length > 0,
    hasBlockingViolations: validationState.violations.some((v) => v.isBlocking),
    canOverride: validationState.violations.some((v) => v.canOverride),
  };
}

export default useRuleEngine;
