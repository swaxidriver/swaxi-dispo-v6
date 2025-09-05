/**
 * Core Shift Operations - Domain Functions for AI Consumption
 * 
 * Pure domain functions for shift management operations.
 * These functions are designed to be consumed by AI assistants and
 * other automated systems that need predictable, well-typed interfaces.
 * 
 * @module shift-operations
 */

import { SHIFT_STATUS } from "../utils/constants";
import { STATUS, assertTransition } from "../domain/status";
import { generateId } from "../utils/id";
import { checkShiftConflicts } from "../utils/shifts";
import { enhance_shift_with_datetime } from "../utils/time-utils";

/**
 * @typedef {Object} Shift
 * @property {string} id - Unique identifier
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {string} start - Start time in HH:MM format
 * @property {string} end - End time in HH:MM format
 * @property {string} type - Shift type (e.g., 'regular', 'emergency')
 * @property {string} status - Current status
 * @property {string|null} assignedTo - User ID if assigned
 * @property {string} workLocation - Required work location
 * @property {Array} conflicts - Array of conflict objects
 * @property {boolean} [pendingSync] - Whether sync is pending
 */

/**
 * @typedef {Object} Application
 * @property {string} id - Unique identifier
 * @property {string} shiftId - ID of the shift being applied to
 * @property {string} userId - ID of the applying user
 * @property {string} status - Application status
 * @property {number} timestamp - Application timestamp
 */

/**
 * @typedef {Object} ShiftCreationData
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {string} start - Start time in HH:MM format
 * @property {string} end - End time in HH:MM format
 * @property {string} type - Shift type
 * @property {string} workLocation - Required work location
 * @property {Object} [additionalData] - Additional shift data
 */

/**
 * Create a new shift with proper validation and conflict detection
 * @param {ShiftCreationData} shiftData - The shift data
 * @param {Shift[]} existingShifts - Array of existing shifts for conflict detection
 * @param {Application[]} applications - Array of applications for conflict detection
 * @returns {{shift: Shift, conflicts: Array}} Created shift with conflicts
 */
export function createShift(shiftData, existingShifts = [], applications = []) {
  if (!shiftData.date || !shiftData.start || !shiftData.end || !shiftData.workLocation) {
    throw new Error("Missing required shift data: date, start, end, workLocation");
  }

  const naturalId = `${shiftData.date}-${shiftData.type}-${shiftData.start}-${shiftData.end}`;
  const uid = generateId();

  const shift = {
    id: naturalId,
    uid,
    date: shiftData.date,
    start: shiftData.start,
    end: shiftData.end,
    type: shiftData.type,
    status: SHIFT_STATUS.OPEN,
    assignedTo: null,
    workLocation: shiftData.workLocation,
    conflicts: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...shiftData.additionalData,
  };

  // Enhance with datetime fields
  const enhancedShift = enhance_shift_with_datetime(shift);

  // Calculate conflicts
  const conflicts = checkShiftConflicts(enhancedShift, existingShifts, applications);
  enhancedShift.conflicts = conflicts;

  return { shift: enhancedShift, conflicts };
}

/**
 * Apply a user to a shift with validation
 * @param {string} shiftId - ID of the shift
 * @param {string} userId - ID of the applying user
 * @param {Shift[]} shifts - Array of shifts to find the target
 * @param {Application[]} applications - Existing applications
 * @returns {{application: Application, updatedShift: Shift|null}} Application result
 */
export function applyToShift(shiftId, userId, shifts = [], applications = []) {
  if (!shiftId || !userId) {
    throw new Error("Missing required parameters: shiftId and userId");
  }

  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) {
    throw new Error(`Shift not found: ${shiftId}`);
  }

  if (shift.status !== SHIFT_STATUS.OPEN) {
    throw new Error(`Cannot apply to shift with status: ${shift.status}`);
  }

  // Check for duplicate application
  const existingApplication = applications.find(
    app => app.shiftId === shiftId && app.userId === userId
  );
  if (existingApplication) {
    throw new Error("User has already applied to this shift");
  }

  const application = {
    id: generateId(),
    shiftId,
    userId,
    status: "pending",
    timestamp: Date.now(),
  };

  return { application, updatedShift: shift };
}

/**
 * Assign a shift to a user with status validation
 * @param {string} shiftId - ID of the shift
 * @param {string} userId - ID of the user to assign
 * @param {Shift[]} shifts - Array of shifts
 * @returns {Shift} Updated shift
 */
export function assignShift(shiftId, userId, shifts = []) {
  if (!shiftId || !userId) {
    throw new Error("Missing required parameters: shiftId and userId");
  }

  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) {
    throw new Error(`Shift not found: ${shiftId}`);
  }

  // Validate status transition
  assertTransition(shift.status, STATUS.ASSIGNED);

  return {
    ...shift,
    status: SHIFT_STATUS.ASSIGNED,
    assignedTo: userId,
    updatedAt: Date.now(),
  };
}

/**
 * Cancel a shift with proper validation
 * @param {string} shiftId - ID of the shift to cancel
 * @param {Shift[]} shifts - Array of shifts
 * @returns {Shift} Updated shift
 */
export function cancelShift(shiftId, shifts = []) {
  if (!shiftId) {
    throw new Error("Missing required parameter: shiftId");
  }

  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) {
    throw new Error(`Shift not found: ${shiftId}`);
  }

  // Validate status transition
  assertTransition(shift.status, STATUS.CANCELLED);

  return {
    ...shift,
    status: SHIFT_STATUS.CANCELLED,
    assignedTo: null,
    updatedAt: Date.now(),
  };
}

/**
 * Update shift status with validation
 * @param {string} shiftId - ID of the shift
 * @param {string} newStatus - New status to set
 * @param {Shift[]} shifts - Array of shifts
 * @returns {Shift} Updated shift
 */
export function updateShiftStatus(shiftId, newStatus, shifts = []) {
  if (!shiftId || !newStatus) {
    throw new Error("Missing required parameters: shiftId and newStatus");
  }

  const shift = shifts.find(s => s.id === shiftId);
  if (!shift) {
    throw new Error(`Shift not found: ${shiftId}`);
  }

  // Validate status transition
  assertTransition(shift.status, newStatus);

  return {
    ...shift,
    status: newStatus,
    updatedAt: Date.now(),
  };
}

/**
 * Withdraw an application with validation
 * @param {string} applicationId - ID of the application to withdraw
 * @param {Application[]} applications - Array of applications
 * @returns {Application} Updated application
 */
export function withdrawApplication(applicationId, applications = []) {
  if (!applicationId) {
    throw new Error("Missing required parameter: applicationId");
  }

  const application = applications.find(app => app.id === applicationId);
  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  if (application.status !== "pending") {
    throw new Error(`Cannot withdraw application with status: ${application.status}`);
  }

  return {
    ...application,
    status: "withdrawn",
    updatedAt: Date.now(),
  };
}

/**
 * Get shifts filtered by status
 * @param {Shift[]} shifts - Array of shifts
 * @param {string} status - Status to filter by
 * @returns {Shift[]} Filtered shifts
 */
export function getShiftsByStatus(shifts = [], status) {
  if (!status) {
    return shifts;
  }
  return shifts.filter(shift => shift.status === status);
}

/**
 * Get open shifts (convenience function)
 * @param {Shift[]} shifts - Array of shifts
 * @returns {Shift[]} Open shifts
 */
export function getOpenShifts(shifts = []) {
  return getShiftsByStatus(shifts, SHIFT_STATUS.OPEN);
}

/**
 * Get conflicted shifts
 * @param {Shift[]} shifts - Array of shifts
 * @returns {Shift[]} Shifts with conflicts
 */
export function getConflictedShifts(shifts = []) {
  return shifts.filter(shift => shift.conflicts && shift.conflicts.length > 0);
}

/**
 * Apply to multiple shifts in a series
 * @param {string[]} shiftIds - Array of shift IDs
 * @param {string} userId - ID of the applying user
 * @param {Shift[]} shifts - Array of shifts
 * @param {Application[]} applications - Existing applications
 * @returns {Application[]} Array of created applications
 */
export function applyToSeries(shiftIds, userId, shifts = [], applications = []) {
  if (!Array.isArray(shiftIds) || shiftIds.length === 0) {
    throw new Error("shiftIds must be a non-empty array");
  }
  if (!userId) {
    throw new Error("Missing required parameter: userId");
  }

  const results = [];
  const errors = [];

  for (const shiftId of shiftIds) {
    try {
      const result = applyToShift(shiftId, userId, shifts, applications);
      results.push(result.application);
    } catch (error) {
      errors.push({ shiftId, error: error.message });
    }
  }

  if (errors.length > 0) {
    throw new Error(`Some applications failed: ${JSON.stringify(errors)}`);
  }

  return results;
}