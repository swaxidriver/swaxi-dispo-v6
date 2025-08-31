/**
 * Assignment Feature - Assignment logic and utilities
 * 
 * This module contains utilities for managing shift assignments,
 * applications, and related business logic.
 */

/**
 * Apply a user to a shift
 * @param {string} shiftId - ID of the shift
 * @param {string} userId - ID of the user
 * @param {Array} existingApplications - Existing applications to check against
 * @returns {Object} Result with success flag and any errors
 */
export function applyUserToShift(shiftId, userId, existingApplications = []) {
  // Check if user already applied
  const existingApplication = existingApplications.find(app => 
    app.shiftId === shiftId && app.userId === userId
  )
  
  if (existingApplication) {
    return {
      success: false,
      error: 'User has already applied to this shift'
    }
  }
  
  return {
    success: true,
    application: {
      id: `${shiftId}_${userId}_${Date.now()}`,
      shiftId,
      userId,
      appliedAt: new Date().toISOString(),
      status: 'pending'
    }
  }
}

/**
 * Assign a user to a shift
 * @param {string} shiftId - ID of the shift
 * @param {string} userId - ID of the user to assign
 * @param {Object} shift - The shift object to update
 * @returns {Object} Updated shift object
 */
export function assignUserToShift(shiftId, userId, shift) {
  return {
    ...shift,
    assignedTo: userId,
    status: 'assigned',
    assignedAt: new Date().toISOString()
  }
}

/**
 * Remove assignment from a shift
 * @param {Object} shift - The shift object to update
 * @returns {Object} Updated shift object
 */
export function unassignShift(shift) {
  return {
    ...shift,
    assignedTo: null,
    status: 'open',
    assignedAt: null
  }
}

/**
 * Get applications for a specific shift
 * @param {string} shiftId - ID of the shift
 * @param {Array} applications - All applications
 * @returns {Array} Applications for the specified shift
 */
export function getApplicationsForShift(shiftId, applications) {
  return applications.filter(app => app.shiftId === shiftId)
}

/**
 * Get applications by a specific user
 * @param {string} userId - ID of the user
 * @param {Array} applications - All applications
 * @returns {Array} Applications by the specified user
 */
export function getApplicationsByUser(userId, applications) {
  return applications.filter(app => app.userId === userId)
}

/**
 * Check if a user can be assigned to a shift
 * @param {Object} shift - The shift
 * @param {string} userId - User ID to check
 * @param {Array} existingShifts - Other shifts to check for conflicts
 * @returns {Object} Result with canAssign boolean and reasons
 */
export function canAssignUserToShift(shift, userId, existingShifts = []) {
  const reasons = []
  
  // Check if shift is already assigned
  if (shift.assignedTo && shift.assignedTo !== userId) {
    reasons.push('Shift is already assigned to another user')
  }
  
  // Check for time conflicts with other assigned shifts
  const conflictingShifts = existingShifts.filter(existingShift => 
    existingShift.assignedTo === userId &&
    existingShift.date === shift.date &&
    existingShift.id !== shift.id
  )
  
  if (conflictingShifts.length > 0) {
    reasons.push('User has conflicting shifts on the same day')
  }
  
  return {
    canAssign: reasons.length === 0,
    reasons
  }
}