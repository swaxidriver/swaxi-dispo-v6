/**
 * Bulk Operations Module
 * Provides multi-assign, swap, and copy week functionality
 */

import { AuditService } from "../services/auditService";

/**
 * Copy shifts from one week to the next week with date shifting
 * @param {Array} shifts - Array of shift objects to copy
 * @param {Object} repository - Repository instance for persistence
 * @param {Object} userContext - Current user context for audit
 * @returns {Promise<Array>} - Array of newly created shifts
 */
export async function copyWeekToNext(shifts, repository, userContext = {}) {
  if (!shifts || shifts.length === 0) {
    throw new Error("No shifts provided to copy");
  }

  const { actor = "Unknown User", role = "USER" } = userContext;

  try {
    // Group shifts by week to ensure we're copying a complete week
    const weekGroups = groupShiftsByWeek(shifts);
    const copiedShifts = [];

    for (const [weekStart, weekShifts] of Object.entries(weekGroups)) {
      const nextWeekStart = new Date(weekStart);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);

      // Create new shifts for next week
      const newShifts = weekShifts.map((shift) => ({
        ...shift,
        id: generateShiftId(nextWeekStart, shift.type, shift.start),
        date: shiftDateToNextWeek(shift.date),
        status: "open",
        assignedTo: null, // Reset assignments for copied week
        created_at: new Date(),
        updated_at: new Date(),
      }));

      // Persist new shifts
      for (const newShift of newShifts) {
        await repository.create(newShift);
        copiedShifts.push(newShift);
      }
    }

    // Log audit trail
    AuditService.logAction(
      "week_copied",
      actor,
      role,
      {
        sourceWeekCount: shifts.length,
        copiedWeekCount: copiedShifts.length,
        sourceWeeks: Object.keys(weekGroups),
      },
      copiedShifts.length,
    );

    return copiedShifts;
  } catch (error) {
    AuditService.logAction("week_copy_failed", actor, role, {
      error: error.message,
      shiftCount: shifts.length,
    });
    throw error;
  }
}

/**
 * Swap assignments between two Disponenten with audit trail
 * @param {string} assignment1Id - First assignment ID
 * @param {string} assignment2Id - Second assignment ID
 * @param {Object} repository - Repository instance for persistence
 * @param {Object} userContext - Current user context for audit
 * @returns {Promise<void>}
 */
export async function swapAssignments(
  assignment1Id,
  assignment2Id,
  repository,
  userContext = {},
) {
  if (!assignment1Id || !assignment2Id) {
    throw new Error("Both assignment IDs are required for swap");
  }

  const { actor = "Unknown User", role = "USER" } = userContext;

  try {
    // Get current assignments for audit trail
    const assignment1 = await repository.findById(assignment1Id);
    const assignment2 = await repository.findById(assignment2Id);

    if (!assignment1 || !assignment2) {
      throw new Error("One or both assignments not found");
    }

    // Perform the swap using repository method
    await repository.swapAssignments(assignment1Id, assignment2Id);

    // Log detailed audit trail
    AuditService.logAction(
      "assignments_swapped",
      actor,
      role,
      {
        assignment1: {
          id: assignment1Id,
          disponentFrom: assignment1.assignedTo,
          shiftId: assignment1.shift_instance_id,
        },
        assignment2: {
          id: assignment2Id,
          disponentFrom: assignment2.assignedTo,
          shiftId: assignment2.shift_instance_id,
        },
        swapTimestamp: new Date().toISOString(),
      },
      2,
    );
  } catch (error) {
    AuditService.logAction("assignments_swap_failed", actor, role, {
      error: error.message,
      assignment1Id,
      assignment2Id,
    });
    throw error;
  }
}

/**
 * Multi-select assign shifts to a specific Disponent
 * @param {Array<string>} shiftIds - Array of shift IDs to assign
 * @param {string} disponentName - Name of the Disponent to assign to
 * @param {Object} repository - Repository instance for persistence
 * @param {Object} userContext - Current user context for audit
 * @returns {Promise<Array>} - Array of assignment results
 */
export async function multiAssignShifts(
  shiftIds,
  disponentName,
  repository,
  userContext = {},
) {
  if (!shiftIds || shiftIds.length === 0) {
    throw new Error("No shift IDs provided for assignment");
  }

  if (!disponentName) {
    throw new Error("Disponent name is required for assignment");
  }

  const { actor = "Unknown User", role = "USER" } = userContext;

  try {
    const assignments = [];
    const failures = [];

    // Process each shift assignment
    for (const shiftId of shiftIds) {
      try {
        const assignment = {
          id: generateAssignmentId(),
          shift_instance_id: shiftId,
          assignedTo: disponentName,
          status: "assigned",
          created_at: new Date(),
          updated_at: new Date(),
        };

        await repository.create(assignment);
        assignments.push(assignment);
      } catch (error) {
        failures.push({ shiftId, error: error.message });
      }
    }

    // Log audit trail
    AuditService.logAction(
      "multi_assign_completed",
      actor,
      role,
      {
        disponentName,
        successfulAssignments: assignments.length,
        failedAssignments: failures.length,
        failures: failures.length > 0 ? failures : undefined,
      },
      assignments.length,
    );

    return { assignments, failures };
  } catch (error) {
    AuditService.logAction("multi_assign_failed", actor, role, {
      error: error.message,
      shiftIds,
      disponentName,
    });
    throw error;
  }
}

/**
 * Multi-select unassign shifts (remove assignments)
 * @param {Array<string>} shiftIds - Array of shift IDs to unassign
 * @param {Object} repository - Repository instance for persistence
 * @param {Object} userContext - Current user context for audit
 * @returns {Promise<Array>} - Array of unassignment results
 */
export async function multiUnassignShifts(
  shiftIds,
  repository,
  userContext = {},
) {
  if (!shiftIds || shiftIds.length === 0) {
    throw new Error("No shift IDs provided for unassignment");
  }

  const { actor = "Unknown User", role = "USER" } = userContext;

  try {
    const unassignments = [];
    const failures = [];

    // Process each shift unassignment
    for (const shiftId of shiftIds) {
      try {
        // Find existing assignments for this shift
        const existingAssignments = await repository.listAssignments({
          shift_instance_id: shiftId,
        });

        for (const assignment of existingAssignments) {
          await repository.delete(assignment.id);
          unassignments.push({ shiftId, removedAssignment: assignment.id });
        }
      } catch (error) {
        failures.push({ shiftId, error: error.message });
      }
    }

    // Log audit trail
    AuditService.logAction(
      "multi_unassign_completed",
      actor,
      role,
      {
        successfulUnassignments: unassignments.length,
        failedUnassignments: failures.length,
        failures: failures.length > 0 ? failures : undefined,
      },
      unassignments.length,
    );

    return { unassignments, failures };
  } catch (error) {
    AuditService.logAction("multi_unassign_failed", actor, role, {
      error: error.message,
      shiftIds,
    });
    throw error;
  }
}

/**
 * Enhanced multi-select with shift+click support
 * @param {Array} currentSelection - Currently selected items
 * @param {string} clickedItemId - ID of the clicked item
 * @param {Array} allItems - All available items for range selection
 * @param {boolean} isShiftClick - Whether shift key was held during click
 * @param {boolean} isCtrlClick - Whether ctrl/cmd key was held during click
 * @returns {Array} - New selection array
 */
export function handleMultiSelect(
  currentSelection,
  clickedItemId,
  allItems,
  isShiftClick = false,
  isCtrlClick = false,
) {
  const selection = new Set(currentSelection);

  if (isShiftClick && currentSelection.length > 0) {
    // Range selection: from last selected to clicked item
    const lastSelected = currentSelection[currentSelection.length - 1];
    const lastIndex = allItems.findIndex((item) => item.id === lastSelected);
    const clickedIndex = allItems.findIndex(
      (item) => item.id === clickedItemId,
    );

    if (lastIndex !== -1 && clickedIndex !== -1) {
      const start = Math.min(lastIndex, clickedIndex);
      const end = Math.max(lastIndex, clickedIndex);

      // Clear existing selection first, then add range
      selection.clear();

      // Add all items in range to selection
      for (let i = start; i <= end; i++) {
        selection.add(allItems[i].id);
      }
    }
  } else if (isCtrlClick) {
    // Toggle individual item
    if (selection.has(clickedItemId)) {
      selection.delete(clickedItemId);
    } else {
      selection.add(clickedItemId);
    }
  } else {
    // Regular click: replace selection
    selection.clear();
    selection.add(clickedItemId);
  }

  return Array.from(selection);
}

// Helper functions

function groupShiftsByWeek(shifts) {
  const groups = {};

  for (const shift of shifts) {
    const shiftDate = new Date(shift.date);
    const weekStart = getWeekStart(shiftDate);
    const weekKey = weekStart.toISOString().slice(0, 10);

    if (!groups[weekKey]) {
      groups[weekKey] = [];
    }
    groups[weekKey].push(shift);
  }

  return groups;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  return new Date(d.setDate(diff));
}

function shiftDateToNextWeek(date) {
  const nextWeekDate = new Date(date);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  return nextWeekDate;
}

function generateShiftId(date, type, start) {
  const dateStr = date.toISOString().slice(0, 10);
  const startStr = start ? start.replace(":", "") : "unknown";
  return `${dateStr}_${type}_${startStr}`;
}

function generateAssignmentId() {
  return `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
