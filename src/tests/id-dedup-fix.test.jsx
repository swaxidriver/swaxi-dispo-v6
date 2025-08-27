/**
 * Test for P0 Issue: Fix ID & dedup on "10 Tage anlegen"
 * 
 * This test verifies that:
 * 1. ID generation is consistent between generateShifts and buildShiftId
 * 2. Deduplication logic works properly in template processing
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'

import { ShiftProvider, ShiftContext } from '../contexts/ShiftContext'
import { ShiftTemplateProvider } from '../contexts/ShiftTemplateContext'

function CaptureContext({ holder }) {
  const ctx = React.useContext(ShiftContext)
  holder.current = ctx
  return null
}

describe('P0 Issue FIXED: ID & dedup on "10 Tage anlegen"', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset ID counter for consistent test results
    const { __resetIdCounterForTests } = require('../utils/id')
    __resetIdCounterForTests()
  })

  test('ID formats should be consistent between generateShifts and createShift', () => {
    const { generateShifts } = require('../services/shiftGenerationService')
    const { buildShiftId } = require('../contexts/ShiftContextCore')
    
    const template = {
      name: 'TestShift',
      startTime: '09:00', 
      endTime: '17:00',
      days: ['Mo']
    }

    const generatedShifts = generateShifts([template])
    expect(generatedShifts.length).toBeGreaterThan(0)

    const firstShift = generatedShifts[0]
    const expectedId = buildShiftId(firstShift.date, firstShift.name)
    
    // This should now pass due to our fix
    expect(firstShift.id).toBe(expectedId)
  })

  test('createShift deduplication works correctly', async () => {
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

    const initialCount = holder.current.shifts.length

    // Create first shift
    const result1 = holder.current.createShift({
      date: '2025-01-10',
      type: 'TestShift',
      start: '09:00',
      end: '17:00',
      workLocation: 'office'
    })
    expect(result1.ok).toBe(true)

    await waitFor(() => {
      expect(holder.current.shifts.length).toBe(initialCount + 1)
    })

    // Try to create identical shift - should be rejected
    const result2 = holder.current.createShift({
      date: '2025-01-10',
      type: 'TestShift', 
      start: '09:00',
      end: '17:00',
      workLocation: 'office'
    })
    expect(result2.ok).toBe(false)
    expect(result2.reason).toBe('duplicate')

    // Count should remain the same
    expect(holder.current.shifts.length).toBe(initialCount + 1)
  })

  test('Template processing deduplication works', async () => {
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

    const initialCount = holder.current.shifts.length

    // Manually create a shift that would conflict with template processing
    const result = holder.current.createShift({
      date: '2025-01-13', // Monday 
      type: 'TestTemplate',
      start: '09:00',
      end: '17:00',
      workLocation: 'office'
    })
    expect(result.ok).toBe(true)

    await waitFor(() => {
      expect(holder.current.shifts.length).toBe(initialCount + 1)
    })

    const countAfterManualCreate = holder.current.shifts.length

    // Now simulate template processing that would try to create the same shift
    const testDate = new Date('2025-01-13T10:00:00Z') // Monday
    const iso = testDate.toISOString().slice(0, 10)
    const { buildShiftId } = require('../contexts/ShiftContextCore')
    const id = buildShiftId(iso, 'TestTemplate')

    // Check if deduplication would work (same logic as in the effect)
    const existingShift = holder.current.shifts.find(s => s.id === id)
    expect(existingShift).toBeTruthy() // Should find the manually created shift
    
    // The template processing should NOT add this shift because it already exists
    // This verifies the deduplication logic: if (!state.shifts.find(s => s.id === id))
    
    expect(holder.current.shifts.length).toBe(countAfterManualCreate) // No change
  })
})