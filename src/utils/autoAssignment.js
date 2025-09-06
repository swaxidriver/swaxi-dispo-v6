import { canAssignUserToShift } from "../features/assignments/assignments";

/**
 * Auto-assignment utilities for generating assignment previews and executing assignments
 */

/**
 * Calculate workload score for a disponent based on current assignments
 * @param {Object} disponent - The disponent to score
 * @param {Array} shifts - All shifts
 * @returns {number} Workload score (lower is better)
 */
function calculateWorkloadScore(disponent, shifts) {
  const assignedShifts = shifts.filter(
    (shift) => shift.assignedTo === disponent.id && shift.status === "assigned",
  );

  // Basic workload scoring: number of assigned shifts + total hours
  let score = assignedShifts.length * 10; // Base weight for number of shifts

  assignedShifts.forEach((shift) => {
    // Add hours to the score (simplified calculation)
    const start = parseInt(shift.start.split(":")[0]);
    const end = parseInt(shift.end.split(":")[0]);
    const hours = end > start ? end - start : 24 - start + end; // Handle overnight shifts
    score += hours;
  });

  return score;
}

/**
 * Score a disponent for a specific shift assignment
 * @param {Object} disponent - The disponent to score
 * @param {Object} shift - The shift to assign
 * @param {Array} allShifts - All shifts for context
 * @returns {number} Assignment score (higher is better)
 */
function scoreDisponentForShift(disponent, shift, allShifts) {
  let score = 100; // Base score

  // Availability bonus
  if (disponent.availability === "available") {
    score += 50;
  } else if (disponent.availability === "busy") {
    score -= 30;
  } else {
    score -= 100; // Unavailable
  }

  // Workload penalty (lower workload gets higher score)
  const workloadScore = calculateWorkloadScore(disponent, allShifts);
  score -= workloadScore;

  // Role matching bonus (simplified - could be more sophisticated)
  if (shift.requiredRole && disponent.role === shift.requiredRole) {
    score += 25;
  }

  // Location preference (if available in future)
  if (
    shift.workLocation &&
    disponent.preferredLocations?.includes(shift.workLocation)
  ) {
    score += 15;
  }

  return Math.max(0, score); // Ensure non-negative score
}

/**
 * Generate automatic assignment plans for open shifts
 * @param {Array} shifts - All shifts
 * @param {Array} disponenten - Available disponenten/users
 * @returns {Array} Array of planned assignments with conflict detection
 */
export function generateAutoAssignmentPlan(shifts, disponenten) {
  const openShifts = shifts.filter((shift) => shift.status === "open");
  const availableDisponenten = disponenten.filter(
    (disp) => disp.availability !== "unavailable",
  );

  if (openShifts.length === 0 || availableDisponenten.length === 0) {
    return [];
  }

  const plannedAssignments = [];

  // Sort shifts by priority (could be by date, urgency, etc.)
  const sortedShifts = [...openShifts].sort((a, b) => {
    // Prioritize earlier dates, then earlier times
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.start.localeCompare(b.start);
  });

  // For each shift, find the best available disponent
  for (const shift of sortedShifts) {
    // Score all disponenten for this shift
    const scoredDisponenten = availableDisponenten
      .map((disponent) => ({
        disponent,
        score: scoreDisponentForShift(disponent, shift, shifts),
      }))
      .filter((item) => item.score > 0) // Only consider those with positive scores
      .sort((a, b) => b.score - a.score); // Sort by score (highest first)

    if (scoredDisponenten.length === 0) {
      // No suitable disponenten found, skip this shift
      continue;
    }

    const bestMatch = scoredDisponenten[0];
    const disponent = bestMatch.disponent;

    // Check for conflicts
    const conflictCheck = canAssignUserToShift(shift, disponent.id, shifts);
    const hasConflicts = !conflictCheck.canAssign;

    const assignment = {
      shift,
      disponent,
      hasConflicts,
      conflictReasons: conflictCheck.reasons || [],
      score: bestMatch.score, // Include score for debugging/display
    };

    plannedAssignments.push(assignment);

    // Update shifts array to reflect this planned assignment for future scoring
    shifts = [
      ...shifts,
      { ...shift, assignedTo: disponent.id, status: "assigned" },
    ];
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
