/**
 * Core Scheduling Library - Pure Functions for Copilot
 * 
 * This module contains pure scheduling functions that can be easily
 * used by AI assistants and other consumers. All functions are:
 * - Pure (no side effects)
 * - Well-documented with clear interfaces
 * - Focused on core scheduling domain logic
 */

/**
 * Calculate if two time ranges overlap
 * @param {string} aStart - Start time in HH:MM format
 * @param {string} aEnd - End time in HH:MM format  
 * @param {string} bStart - Start time in HH:MM format
 * @param {string} bEnd - End time in HH:MM format
 * @returns {boolean} True if the time ranges overlap
 */
export function calculateTimeOverlap(aStart, aEnd, bStart, bEnd) {
  // Convert times to minutes since midnight
  const toMinutes = (timeStr) => {
    if (typeof timeStr !== 'string' || !/^[0-2]\d:[0-5]\d$/.test(timeStr)) return NaN
    if (timeStr >= '24:00') return NaN
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const aS = toMinutes(aStart); const aE = toMinutes(aEnd)
  const bS = toMinutes(bStart); const bE = toMinutes(bEnd)
  if ([aS,aE,bS,bE].some(Number.isNaN)) return false

  // Handle overnight shifts by expanding into segments
  function expandToSegments(start, end) {
    if (end >= start) return [[start, end]]
    // Overnight: split into two segments
    return [[start, start + (24*60 - start)], [0, end]]
  }
  
  const segA = expandToSegments(aS, aE)
  const segB = expandToSegments(bS, bE)
  return segA.some(([s1,e1]) => segB.some(([s2,e2]) => s1 < e2 && e1 > s2))
}

/**
 * Calculate the duration of a shift in minutes
 * @param {string} start - Start time in HH:MM format
 * @param {string} end - End time in HH:MM format
 * @returns {number} Duration in minutes
 */
export function calculateShiftDuration(start, end) {
  const toMinutes = (timeStr) => {
    if (typeof timeStr !== 'string' || !/^[0-2]\d:[0-5]\d$/.test(timeStr)) return NaN
    if (timeStr >= '24:00') return NaN
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const s = toMinutes(start)
  const e = toMinutes(end)
  if (Number.isNaN(s) || Number.isNaN(e)) return 0
  if (e >= s) return e - s
  return (24 * 60 - s) + e // Overnight shift
}

/**
 * Find scheduling conflicts for a shift
 * @param {Object} targetShift - The shift to check for conflicts
 * @param {Array} existingShifts - Array of existing shifts to compare against
 * @param {Array} applications - Array of shift applications
 * @returns {Array} Array of conflict codes
 */
export function findSchedulingConflicts(targetShift, existingShifts = [], applications = []) {
  const conflicts = []
  
  // Time overlap conflicts
  const overlappingShifts = existingShifts.filter(shift => {
    if (targetShift.date === shift.date) {
      return calculateTimeOverlap(targetShift.start, targetShift.end, shift.start, shift.end)
    }
    return false
  })
  
  if (overlappingShifts.length > 0) {
    conflicts.push('TIME_OVERLAP')
    
    // Assignment collision (same person assigned to overlapping shifts)
    if (targetShift.assignedTo) {
      const hasAssignmentCollision = overlappingShifts.some(shift => 
        shift.assignedTo === targetShift.assignedTo
      )
      if (hasAssignmentCollision) {
        conflicts.push('ASSIGNMENT_COLLISION')
      }
      
      // Location mismatch (same person in different locations)
      const hasLocationMismatch = overlappingShifts.some(shift => 
        shift.assignedTo === targetShift.assignedTo &&
        shift.workLocation !== targetShift.workLocation &&
        shift.workLocation && targetShift.workLocation
      )
      if (hasLocationMismatch) {
        conflicts.push('LOCATION_MISMATCH')
      }
    }
  }
  
  // Double application conflict
  if (applications.length > 0) {
    const targetApplications = applications.filter(app => app.shiftId === targetShift.id)
    const targetUserIds = new Set(targetApplications.map(app => app.userId))
    
    const overlapShiftIds = new Set(overlappingShifts.map(shift => shift.id))
    const hasDoubleApplication = applications.some(app => 
      overlapShiftIds.has(app.shiftId) && targetUserIds.has(app.userId)
    )
    
    if (hasDoubleApplication) {
      conflicts.push('DOUBLE_APPLICATION')
    }
  }
  
  return conflicts
}

/**
 * Check if there's a short turnaround between two shifts
 * @param {Object} shiftA - First shift
 * @param {Object} shiftB - Second shift
 * @param {number} minRestMinutes - Minimum rest time in minutes (default: 480 = 8 hours)
 * @returns {boolean} True if turnaround is too short
 */
export function checkShortTurnaround(shiftA, shiftB, minRestMinutes = 480) {
  // Simple same-day calculation for now
  if (shiftA.date !== shiftB.date) return false
  if (!shiftA.assignedTo || shiftA.assignedTo !== shiftB.assignedTo) return false
  
  const toMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }
  
  const aEnd = toMinutes(shiftA.end)
  const bStart = toMinutes(shiftB.start)
  
  if (Number.isNaN(aEnd) || Number.isNaN(bStart)) return false
  
  const gap = bStart - aEnd
  return gap >= 0 && gap < minRestMinutes
}

/**
 * Generate shifts from a template for specified dates
 * @param {Object} template - Shift template with start, end, name, etc.
 * @param {Array} dates - Array of date strings (YYYY-MM-DD)
 * @returns {Array} Array of generated shifts
 */
export function generateShiftsFromTemplate(template, dates) {
  return dates.map((date, index) => ({
    id: `${template.name}_${date}_${index}`,
    date,
    start: template.start,
    end: template.end,
    name: template.name,
    assignedTo: null,
    status: 'open',
    workLocation: template.workLocation || 'office',
    templateId: template.id
  }))
}

/**
 * Calculate optimal shift assignments based on availability and preferences
 * @param {Array} shifts - Available shifts to assign
 * @param {Array} people - Available people with preferences
 * @param {Object} constraints - Assignment constraints
 * @returns {Array} Array of suggested assignments
 */
export function calculateOptimalAssignments(shifts, people, constraints = {}) {
  const assignments = []
  
  // Simple algorithm: assign based on availability and preference score
  for (const shift of shifts) {
    if (shift.assignedTo) continue // Already assigned
    
    const availablePeople = people.filter(person => {
      // Check availability (simple implementation)
      return !person.unavailableDates?.includes(shift.date)
    })
    
    if (availablePeople.length === 0) continue
    
    // Score based on preferences (simplified)
    const scored = availablePeople.map(person => ({
      person,
      score: calculateAssignmentScore(shift, person, constraints)
    }))
    
    // Sort by score and pick the best
    scored.sort((a, b) => b.score - a.score)
    const bestMatch = scored[0]
    
    if (bestMatch.score > 0) {
      assignments.push({
        shiftId: shift.id,
        personId: bestMatch.person.id,
        score: bestMatch.score,
        reason: 'optimal_match'
      })
    }
  }
  
  return assignments
}

/**
 * Calculate assignment score for a person-shift combination
 * @param {Object} shift - The shift to assign
 * @param {Object} person - The person to potentially assign
 * @param {Object} constraints - Scoring constraints
 * @returns {number} Score (higher is better)
 */
function calculateAssignmentScore(shift, person, constraints) {
  let score = 0
  
  // Base availability score
  if (!person.unavailableDates?.includes(shift.date)) {
    score += 10
  }
  
  // Preference bonus
  if (person.preferredShiftTypes?.includes(shift.name)) {
    score += 5
  }
  
  // Location preference
  if (person.preferredLocation === shift.workLocation) {
    score += 3
  }
  
  // Experience bonus
  if (person.experience?.includes(shift.name)) {
    score += 2
  }
  
  return score
}

/**
 * Validate a shift object for completeness and correctness
 * @param {Object} shift - Shift to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateShift(shift) {
  const errors = []
  
  if (!shift.id) errors.push('Missing shift ID')
  if (!shift.date) errors.push('Missing shift date')
  if (!shift.start) errors.push('Missing start time')
  if (!shift.end) errors.push('Missing end time')
  if (!shift.name) errors.push('Missing shift name')
  
  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
  if (shift.start && !timeRegex.test(shift.start)) {
    errors.push('Invalid start time format (expected HH:MM)')
  }
  if (shift.end && !timeRegex.test(shift.end)) {
    errors.push('Invalid end time format (expected HH:MM)')
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (shift.date && !dateRegex.test(shift.date)) {
    errors.push('Invalid date format (expected YYYY-MM-DD)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export conflict codes for consistency
export const SCHEDULING_CONFLICT_CODES = {
  TIME_OVERLAP: 'TIME_OVERLAP',
  DOUBLE_APPLICATION: 'DOUBLE_APPLICATION', 
  ASSIGNMENT_COLLISION: 'ASSIGNMENT_COLLISION',
  LOCATION_MISMATCH: 'LOCATION_MISMATCH',
  SHORT_TURNAROUND: 'SHORT_TURNAROUND'
}