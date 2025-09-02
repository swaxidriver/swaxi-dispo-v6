import { canAssignUserToShift } from "../features/assignments/assignments";

/**
 * Auto-assignment utilities for generating assignment previews and executing assignments
 */

/**
 * Generate automatic assignment plans for open shifts
 * @param {Array} shifts - All shifts
 * @param {Array} disponenten - Available disponenten/users
 * @returns {Array} Array of planned assignments with conflict detection
 */
export function generateAutoAssignmentPlan(shifts, disponenten) {
  const openShifts = shifts.filter((shift) => shift.status === "open");
  const availableDisponenten = disponenten.filter(
    (disp) => disp.availability === "available",
  );

  if (openShifts.length === 0 || availableDisponenten.length === 0) {
    return [];
  }

  const plannedAssignments = [];
  const usedDisponenten = new Set();

  // Simple round-robin assignment strategy
  // In a real system, this could be more sophisticated (considering skills, workload, etc.)
  for (let i = 0; i < openShifts.length; i++) {
    const shift = openShifts[i];
    const availableIndex = i % availableDisponenten.length;
    const disponent = availableDisponenten[availableIndex];

    if (!disponent) continue;

    // Check for conflicts
    const conflictCheck = canAssignUserToShift(shift, disponent.id, shifts);
    const hasConflicts = !conflictCheck.canAssign;

    const assignment = {
      shift,
      disponent,
      hasConflicts,
      conflictReasons: conflictCheck.reasons || [],
    };

    plannedAssignments.push(assignment);
    usedDisponenten.add(disponent.id);
  }

  return plannedAssignments;
}

/**
 * Execute auto-assignment plan
 * @param {Array} plannedAssignments - Array of planned assignments
 * @param {Function} assignShift - Function to execute individual assignments
 * @returns {Promise<Object>} Result with success count and any errors
 */
export async function executeAutoAssignmentPlan(
  plannedAssignments,
  assignShift,
) {
  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  for (const assignment of plannedAssignments) {
    try {
      await assignShift(assignment.shift.id, assignment.disponent.id);
      results.successCount++;
    } catch (error) {
      results.errorCount++;
      results.errors.push({
        shiftId: assignment.shift.id,
        disponentId: assignment.disponent.id,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Get assignment statistics for display
 * @param {Array} plannedAssignments - Array of planned assignments
 * @returns {Object} Statistics object
 */
export function getAssignmentStatistics(plannedAssignments) {
  const total = plannedAssignments.length;
  const withConflicts = plannedAssignments.filter(
    (assignment) => assignment.hasConflicts,
  ).length;
  const withoutConflicts = total - withConflicts;

  return {
    total,
    withConflicts,
    withoutConflicts,
    hasAnyConflicts: withConflicts > 0,
  };
}
