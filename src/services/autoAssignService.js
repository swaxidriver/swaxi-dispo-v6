// Auto-assignment algorithm for fair distribution of shifts
// Considers conflicts, role capabilities, and fair distribution

import { ROLES } from '../utils/constants'

/**
 * Default user list if no users provided (fallback for demo/testing)
 */
const DEFAULT_USERS = [
  { id: 'user1', name: 'Anna Schmidt', role: ROLES.DISPONENT, preferences: { workLocation: 'office' } },
  { id: 'user2', name: 'Max Müller', role: ROLES.DISPONENT, preferences: { workLocation: 'office' } },
  { id: 'user3', name: 'Lisa Weber', role: ROLES.DISPONENT, preferences: { workLocation: 'home' } },
  { id: 'user4', name: 'Tom Bauer', role: ROLES.DISPONENT, preferences: { workLocation: 'office' } }
]

/**
 * Calculate workload score for a user based on current assignments
 */
function calculateWorkload(userId, shifts) {
  const userShifts = shifts.filter(s => s.assignedTo === userId)
  return userShifts.length
}

/**
 * Check if user can work at the shift's location
 */
function isLocationCompatible(user, shift) {
  // If user has no location preference, they can work anywhere
  if (!user.preferences?.workLocation) return true
  
  // If shift has no location requirement, anyone can work
  if (!shift.workLocation) return true
  
  // Check if preferences match
  return user.preferences.workLocation === shift.workLocation
}

/**
 * Check if user has capability to work this shift type
 * For now, all DISPONENT and above can work any shift
 */
function hasShiftCapability(user, _shift) {
  const capableRoles = [ROLES.ADMIN, ROLES.CHIEF, ROLES.DISPONENT]
  return capableRoles.includes(user.role)
}

/**
 * Score a user for assignment to a shift
 * Lower score = better candidate
 */
function scoreUserForShift(user, shift, allShifts, applications) {
  let score = 0
  
  // Base workload score (prefer users with fewer assignments)
  score += calculateWorkload(user.id, allShifts) * 10
  
  // Location compatibility bonus
  if (!isLocationCompatible(user, shift)) {
    score += 1000 // Very high penalty for incompatible location
  }
  
  // Capability penalty
  if (!hasShiftCapability(user, shift)) {
    score += 1000 // Very high penalty for incapable users
  }
  
  // Application bonus (prefer users who applied)
  const hasApplied = applications.some(app => app.shiftId === shift.id && app.userId === user.id)
  if (hasApplied) {
    score -= 5 // Bonus for having applied
  }
  
  // Add some randomness for equal scores
  score += Math.random() * 0.1
  
  return score
}

/**
 * Auto-assign algorithm - fair distribution considering conflicts and roles
 * @param {Array} openShifts - Shifts with status 'open'
 * @param {Array} allShifts - All shifts for conflict checking
 * @param {Array} applications - Current applications
 * @param {Array} users - Available users (optional, falls back to defaults)
 * @returns {Array} Assignment recommendations: { shiftId, recommendedUser, reason, conflicts? }
 */
export function autoAssignShifts(openShifts, allShifts, applications = [], users = DEFAULT_USERS) {
  const recommendations = []
  
  // Filter shifts that are actually open and not assigned
  const assignableShifts = openShifts.filter(shift => 
    shift.status === 'open' && !shift.assignedTo
  )
  
  // Sort shifts by priority (earliest first, then by type)
  const sortedShifts = [...assignableShifts].sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime()
    }
    // Secondary sort by shift type priority
    const typePriority = { 'night': 0, 'evening': 1, 'early': 2 }
    return (typePriority[a.type] || 99) - (typePriority[b.type] || 99)
  })
  
  for (const shift of sortedShifts) {
    // Score all users for this shift
    const userScores = users.map(user => ({
      user,
      score: scoreUserForShift(user, shift, allShifts, applications)
    }))
    
    // Sort by score (lowest = best)
    userScores.sort((a, b) => a.score - b.score)
    
    // Find the best user without conflicts
    let bestAssignment = null
    
    for (const { user, score } of userScores) {
      // Skip if score is too high (incapable or incompatible)
      if (score >= 1000) continue
      
      // Create a test assignment to check for conflicts
      const testShift = { ...shift, assignedTo: user.id, status: 'assigned' }
      
      // Simple conflict check: no overlapping shifts for the same user on the same day
      const hasConflict = allShifts.some(existingShift => {
        if (existingShift.assignedTo !== user.id || existingShift.id === shift.id) {
          return false
        }
        
        // Convert date to Date object if it's a string
        const existingDate = existingShift.date instanceof Date 
          ? existingShift.date 
          : new Date(existingShift.date)
        const shiftDate = shift.date instanceof Date 
          ? shift.date 
          : new Date(shift.date)
          
        return existingDate.toDateString() === shiftDate.toDateString()
      })
      
      // Skip if there are conflicts
      if (hasConflict) {
        continue
      }
      
      // This is our best assignment
      bestAssignment = {
        shiftId: shift.id,
        recommendedUser: user,
        reason: score < 100 ? 'good_match' : 'available',
        confidence: Math.max(0, Math.min(1, (1000 - score) / 1000))
      }
      break
    }
    
    if (bestAssignment) {
      recommendations.push(bestAssignment)
      // Simulate the assignment for subsequent conflict checking
      allShifts = allShifts.map(s => 
        s.id === shift.id 
          ? { ...s, assignedTo: bestAssignment.recommendedUser.id, status: 'assigned' }
          : s
      )
    } else {
      // No suitable assignment found
      const reasons = []
      if (userScores.every(u => u.score >= 1000)) {
        reasons.push('no_capable_users')
      } else {
        reasons.push('conflicts_prevent_assignment')
      }
      
      recommendations.push({
        shiftId: shift.id,
        recommendedUser: null,
        reason: reasons.join(', '),
        confidence: 0
      })
    }
  }
  
  return recommendations
}

/**
 * Get assignment statistics for reporting
 */
export function getAssignmentStats(recommendations) {
  const total = recommendations.length
  const assigned = recommendations.filter(r => r.recommendedUser).length
  const unassigned = total - assigned
  
  const userCounts = {}
  recommendations.forEach(r => {
    if (r.recommendedUser) {
      const userId = r.recommendedUser.id
      userCounts[userId] = (userCounts[userId] || 0) + 1
    }
  })
  
  return {
    total,
    assigned,
    unassigned,
    assignmentRate: total > 0 ? (assigned / total) : 0,
    userDistribution: userCounts
  }
}