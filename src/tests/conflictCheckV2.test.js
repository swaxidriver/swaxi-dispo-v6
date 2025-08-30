/**
 * Integration test for P0 Issue #63: Conflict check v2
 * Tests the complete conflict detection overhaul including overnight overlaps and warnings
 */

import { computeShiftConflicts, CONFLICT_CODES } from '../utils/shifts'
import { categorizeConflicts, CONFLICT_SEVERITY } from '../utils/conflicts'
import { enhance_shift_with_datetime } from '../utils/time-utils'

describe('Conflict Check v2 - Complete Scenario Tests', () => {
  test('Case 1: Assignment across midnight with short turnaround detection', () => {
    // Test scenario: Night shift followed by early morning shift for same person
    const nightShift = {
      id: 'night-1',
      date: '2025-01-15',
      start: '22:00',
      end: '06:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned',
      workLocation: 'office'
    }
    
    const morningShift = {
      id: 'morning-1',
      date: '2025-01-16',
      start: '08:00', // Only 2 hours after night shift ends
      end: '16:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned',
      workLocation: 'office'
    }
    
    const conflicts = computeShiftConflicts(nightShift, [morningShift], [])
    
    // Should detect short turnaround (not time overlap since they don't actually overlap)
    expect(conflicts).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
    expect(conflicts).not.toContain(CONFLICT_CODES.TIME_OVERLAP)
    
    // Categorize conflicts
    const { warnings, blocking } = categorizeConflicts(conflicts)
    expect(warnings).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
    expect(blocking).toHaveLength(0) // Short turnaround is a warning, not blocking
  })

  test('Case 2: Overnight overlap detection across dates', () => {
    // Test scenario: Two night shifts that overlap across midnight
    const nightShift1 = {
      id: 'night-1',
      date: '2025-01-15',
      start: '22:00',
      end: '06:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned',
      workLocation: 'office'
    }
    
    const nightShift2 = {
      id: 'night-2', 
      date: '2025-01-16',
      start: '02:00', // Overlaps with first shift (2-6 AM)
      end: '10:00',
      assignedTo: 'Maria Schmidt',
      status: 'assigned',
      workLocation: 'office'
    }
    
    const conflicts = computeShiftConflicts(nightShift1, [nightShift2], [])
    
    // Should detect time overlap across midnight
    expect(conflicts).toContain(CONFLICT_CODES.TIME_OVERLAP)
    
    // Should not detect assignment collision (different people)
    expect(conflicts).not.toContain(CONFLICT_CODES.ASSIGNMENT_COLLISION)
  })

  test('Case 3: Multiple conflict types with severity categorization', () => {
    // Test scenario: Overlapping shifts with same person assigned to both with location mismatch
    const officeShift = {
      id: 'office-1',
      date: '2025-01-15',
      start: '08:00',
      end: '16:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned',
      workLocation: 'office'
    }
    
    const homeShift = {
      id: 'home-1',
      date: '2025-01-15',
      start: '14:00', // Overlaps 14:00-16:00
      end: '22:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned',
      workLocation: 'home'
    }
    
    // Applications for both shifts from same user
    const applications = [
      { id: 'app-1', shiftId: 'office-1', userId: 'hans.mueller' },
      { id: 'app-2', shiftId: 'home-1', userId: 'hans.mueller' }
    ]
    
    const conflicts = computeShiftConflicts(officeShift, [homeShift], applications)
    
    // Should detect all relevant conflicts
    expect(conflicts).toContain(CONFLICT_CODES.TIME_OVERLAP)
    expect(conflicts).toContain(CONFLICT_CODES.ASSIGNMENT_COLLISION)
    expect(conflicts).toContain(CONFLICT_CODES.LOCATION_MISMATCH)
    expect(conflicts).toContain(CONFLICT_CODES.DOUBLE_APPLICATION)
    
    // Categorize by severity
    const { warnings, blocking } = categorizeConflicts(conflicts)
    
    // Blocking conflicts
    expect(blocking).toContain(CONFLICT_CODES.TIME_OVERLAP)
    expect(blocking).toContain(CONFLICT_CODES.ASSIGNMENT_COLLISION)
    
    // Warning conflicts
    expect(warnings).toContain(CONFLICT_CODES.LOCATION_MISMATCH)
    expect(warnings).toContain(CONFLICT_CODES.DOUBLE_APPLICATION)
  })

  test('Case 4: Manual override scenario - warnings should not be hard blocks', () => {
    // Test that warning-level conflicts allow override
    const shift1 = {
      id: 'shift-1',
      date: '2025-01-15',
      start: '22:00',
      end: '06:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned'
    }
    
    const shift2 = {
      id: 'shift-2',
      date: '2025-01-16',
      start: '07:00', // 1 hour rest - short turnaround
      end: '15:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned'
    }
    
    const conflicts = computeShiftConflicts(shift1, [shift2], [])
    const { warnings, blocking } = categorizeConflicts(conflicts)
    
    // Should be warning only (allows override)
    expect(conflicts).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
    expect(warnings).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
    expect(blocking).toHaveLength(0)
    
    // This demonstrates that the UI can allow override for warnings
    const canOverride = blocking.length === 0
    expect(canOverride).toBe(true)
  })

  test('Case 5: Enhanced datetime overlap detection works correctly', () => {
    // Test that the enhanced datetime overlap detection works for cross-midnight scenarios
    const shift1 = {
      id: 'shift-1',
      date: '2025-01-15',
      start: '23:00',
      end: '01:00' // Crosses midnight
    }
    
    const shift2 = {
      id: 'shift-2',
      date: '2025-01-16',
      start: '00:30', // Overlaps with shift1 (00:30-01:00)
      end: '08:00'
    }
    
    // Enhance shifts with datetime for accurate cross-midnight detection
    const enhanced1 = enhance_shift_with_datetime(shift1)
    const enhanced2 = enhance_shift_with_datetime(shift2)
    
    const conflicts = computeShiftConflicts(enhanced1, [enhanced2], [])
    
    // Should detect overlap even across different dates
    expect(conflicts).toContain(CONFLICT_CODES.TIME_OVERLAP)
  })

  test('Export functionality includes conflicts in shift data', () => {
    // Test that shift objects contain conflicts property for export
    const nightShift = {
      id: 'night-1',
      date: '2025-01-15',
      start: '22:00',
      end: '06:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned'
    }
    
    const morningShift = {
      id: 'morning-1',
      date: '2025-01-16',
      start: '08:00',
      end: '16:00',
      assignedTo: 'Hans Mueller',
      status: 'assigned'
    }
    
    const conflicts = computeShiftConflicts(nightShift, [morningShift], [])
    
    // Simulate adding conflicts to shift object (as would happen in the application)
    const shiftWithConflicts = {
      ...nightShift,
      conflicts: conflicts
    }
    
    // Verify conflicts are present for export
    expect(shiftWithConflicts.conflicts).toBeDefined()
    expect(shiftWithConflicts.conflicts).toContain(CONFLICT_CODES.SHORT_TURNAROUND)
    
    // Simulate JSON export (as done in AutosaveManager)
    const exportData = {
      shifts: [shiftWithConflicts],
      exportTime: new Date().toISOString()
    }
    
    const jsonExport = JSON.stringify(exportData, null, 2)
    expect(jsonExport).toContain('SHORT_TURNAROUND')
    expect(jsonExport).toContain('conflicts')
  })
})