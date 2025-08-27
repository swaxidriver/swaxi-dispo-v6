/**
 * Test for P0 Issue: Midnight overlap correctness
 * 
 * This test investigates potential issues with over-midnight shifts:
 * 1. Storage/normalization consistency
 * 2. Duration calculation accuracy  
 * 3. Conflict detection completeness
 * 4. Date field handling for overnight shifts
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { ShiftProvider, ShiftContext } from '../contexts/ShiftContext'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'
import { toMinutes, computeDuration, overlaps } from '../utils/shifts'

function CaptureContext({ holder }) {
  const ctx = React.useContext(ShiftContext)
  holder.current = ctx
  return null
}

describe('P0 Issue: Midnight overlap correctness', () => {
  beforeEach(() => {
    localStorage.clear()
    const { __resetIdCounterForTests } = require('../utils/id')
    __resetIdCounterForTests()
  })

  test('Over-midnight duration calculation is correct', () => {
    // Basic midnight shift: 22:00 to 06:00 should be 8 hours
    expect(computeDuration('22:00', '06:00')).toBe(8 * 60)
    
    // Edge cases
    expect(computeDuration('23:30', '00:30')).toBe(60) // 1 hour
    expect(computeDuration('23:59', '00:01')).toBe(2) // 2 minutes
    
    // Normal (non-midnight) cases should still work
    expect(computeDuration('09:00', '17:00')).toBe(8 * 60)
  })

  test('Over-midnight overlap detection is comprehensive', () => {
    // Night shift overlapping with early morning shift
    expect(overlaps('22:00', '06:00', '05:00', '07:00')).toBe(true) // Should overlap
    
    // Night shift overlapping with late evening shift  
    expect(overlaps('22:00', '06:00', '21:00', '23:00')).toBe(true) // Should overlap
    
    // Night shift NOT overlapping with day shifts
    expect(overlaps('22:00', '06:00', '07:00', '15:00')).toBe(false)
    expect(overlaps('22:00', '06:00', '15:00', '21:00')).toBe(false)
    
    // Complex case: two overnight shifts that touch but don't overlap
    expect(overlaps('22:00', '06:00', '06:00', '14:00')).toBe(false) // Exact boundary
    
    // Complex case: two overnight shifts that do overlap
    expect(overlaps('22:00', '06:00', '04:00', '12:00')).toBe(true) // Overlap in morning
    expect(overlaps('20:00', '04:00', '22:00', '06:00')).toBe(true) // Overlap both sides
  })

  test('Over-midnight shift creation and storage', async () => {
    const holder = { current: null }
    
    render(
      <ShiftTemplateProvider>
        <ShiftProvider disableAsyncBootstrap>
          <CaptureContext holder={holder} />
        </ShiftProvider>
      </ShiftTemplateProvider>
    )

    await waitFor(() => {
      expect(holder.current).toBeTruthy()
    })

    // Create an over-midnight shift
    const result = holder.current.createShift({
      date: '2025-01-15', // Wednesday
      type: 'Nacht',
      start: '22:00',
      end: '06:00',
      workLocation: 'office'
    })

    expect(result.ok).toBe(true)

    await waitFor(() => {
      expect(holder.current.shifts.length).toBe(1)
    })

    const nightShift = holder.current.shifts[0]
    
    // Verify the shift was stored correctly
    expect(nightShift.start).toBe('22:00')
    expect(nightShift.end).toBe('06:00')
    expect(nightShift.date).toBe('2025-01-15') // Should stay on the start date
    
    // Test conflict detection with this overnight shift
    const morningResult = holder.current.createShift({
      date: '2025-01-15', // Same date
      type: 'Frueh',
      start: '05:00', // Should conflict with night shift ending at 06:00  
      end: '13:00',
      workLocation: 'office'
    })

    expect(morningResult.ok).toBe(true) // Should be created

    await waitFor(() => {
      expect(holder.current.shifts.length).toBe(2)
    })

    // Both shifts should show TIME_OVERLAP conflict
    const updatedNightShift = holder.current.shifts.find(s => s.type === 'Nacht')
    const morningShift = holder.current.shifts.find(s => s.type === 'Frueh')
    
    expect(updatedNightShift.conflicts).toContain('TIME_OVERLAP')
    expect(morningShift.conflicts).toContain('TIME_OVERLAP')
  })

  test('Over-midnight date boundaries are handled correctly', () => {
    // Key question: should an overnight shift span two calendar days?
    // Current implementation stores it on the start date only
    
    // This test documents the current behavior and can be updated
    // when the "Zeit/Über-Mitternacht" story is implemented
    
    const testDate = '2025-01-15' // Wednesday
    
    // Overnight shift 22:00 Wed -> 06:00 Thu  
    // Should this create:
    // A) One shift on 2025-01-15 with start=22:00, end=06:00 (current)
    // B) Two shifts: one on 2025-01-15 (22:00-24:00) and one on 2025-01-16 (00:00-06:00)
    // C) One shift on 2025-01-15 but with special end date field?
    
    // For now, test that the current behavior is consistent
    const shiftA = {
      id: '2025-01-15_Nacht',
      date: '2025-01-15',
      start: '22:00', 
      end: '06:00',
      type: 'Nacht'
    }
    
    const shiftB = {
      id: '2025-01-16_Frueh', 
      date: '2025-01-16', // Next day
      start: '06:00',
      end: '14:00', 
      type: 'Frueh'
    }
    
    // These should NOT conflict since they're on different dates
    // even though the times would suggest they touch
    expect(overlaps(shiftA.start, shiftA.end, shiftB.start, shiftB.end)).toBe(false)
    
    // But if both were on the same date, they would conflict:
    const shiftB_sameDate = {...shiftB, date: '2025-01-15'}
    expect(overlaps(shiftA.start, shiftA.end, shiftB_sameDate.start, shiftB_sameDate.end)).toBe(false) // Exact boundary
  })

  test('Template generation handles over-midnight correctly', () => {
    const { generateShifts } = require('../services/shiftGenerationService')
    
    const nightTemplate = {
      name: 'Nacht',
      startTime: '22:00',
      endTime: '06:00',
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] // Every day
    }
    
    const shifts = generateShifts([nightTemplate])
    
    // Should generate 10 night shifts (one for each day in the 10-day window)
    expect(shifts.length).toBe(10)
    
    // Each shift should have the correct overnight times
    shifts.forEach(shift => {
      expect(shift.startTime).toBe('22:00')
      expect(shift.endTime).toBe('06:00')
      expect(shift.name).toBe('Nacht')
      
      // Verify ID format is consistent
      expect(shift.id).toMatch(/^\d{4}-\d{2}-\d{2}_Nacht$/)
    })
  })
})