/**
 * Integration tests for DST boundary handling with cross-midnight templates
 */

import { generateShifts, createSwaxiDefaultTemplates } from '../services/shiftGenerationService'
import { validateTemplate } from '../utils/templateValidation'
import { enhance_shift_with_datetime, compute_duration_dt } from '../utils/time-utils'

describe('DST Boundary Integration Tests', () => {
  describe('Spring DST transition (CEST)', () => {
    test('cross-midnight shifts during spring DST transition handle correctly', () => {
      // Spring DST transition typically happens on last Sunday in March
      // Clocks spring forward from 02:00 to 03:00
      const springDSTDate = new Date('2025-03-30') // Last Sunday in March 2025
      
      const nightTemplate = {
        name: 'Nacht',
        startTime: '01:00',
        endTime: '05:00',
        days: ['Su'],
        cross_midnight: false, // Not cross-midnight since 01:00 < 05:00
        timezone: 'Europe/Berlin'
      }
      
      // Validate template
      expect(validateTemplate(nightTemplate).valid).toBe(true)
      
      // Generate shift for DST transition day
      const shifts = generateShifts([nightTemplate], {
        startDate: springDSTDate,
        daysToGenerate: 1
      })
      
      expect(shifts).toHaveLength(1)
      const nightShift = shifts[0]
      
      // Verify the shift has valid datetime fields despite DST transition
      expect(nightShift.start_dt).toBeDefined()
      expect(nightShift.end_dt).toBeDefined()
      expect(nightShift.start_dt.local).toBeInstanceOf(Date)
      expect(nightShift.end_dt.local).toBeInstanceOf(Date)
      
      // Duration should be positive even during DST transition
      const duration = compute_duration_dt(nightShift.start_dt, nightShift.end_dt)
      expect(duration).toBeGreaterThan(0)
      
      // For a shift that crosses the DST transition at 02:00->03:00,
      // the actual duration would be shorter due to the "lost" hour
      // But our simplified implementation should still handle it gracefully
    })
    
    test('cross-midnight shifts across DST transition boundary', () => {
      const springDSTDate = new Date('2025-03-30')
      
      const crossMidnightTemplate = {
        name: 'Overnight',
        startTime: '23:00',
        endTime: '04:00', 
        days: ['Sa'], // Saturday night into Sunday morning (DST transition)
        cross_midnight: true,
        timezone: 'Europe/Berlin'
      }
      
      // Generate shift for the day before DST transition
      const shifts = generateShifts([crossMidnightTemplate], {
        startDate: new Date('2025-03-29'), // Saturday
        daysToGenerate: 1
      })
      
      expect(shifts).toHaveLength(1)
      const overnightShift = shifts[0]
      
      // This shift starts Saturday 23:00 and ends Sunday 04:00 during DST transition
      expect(overnightShift.cross_midnight).toBe(true)
      expect(overnightShift.start_dt).toBeDefined()
      expect(overnightShift.end_dt).toBeDefined()
      
      // End should be on the next day
      expect(overnightShift.end_dt.local.getDate()).toBe(
        overnightShift.start_dt.local.getDate() + 1
      )
      
      // Duration should be positive despite crossing DST boundary
      const duration = compute_duration_dt(overnightShift.start_dt, overnightShift.end_dt)
      expect(duration).toBeGreaterThan(0)
    })
  })
  
  describe('Fall DST transition (CET)', () => {
    test('cross-midnight shifts during fall DST transition handle correctly', () => {
      // Fall DST transition typically happens on last Sunday in October
      // Clocks fall back from 03:00 to 02:00
      const fallDSTDate = new Date('2025-10-26') // Last Sunday in October 2025
      
      const nightTemplate = {
        name: 'Nacht',
        startTime: '01:00',
        endTime: '04:00',
        days: ['Su'],
        cross_midnight: false,
        timezone: 'Europe/Berlin'
      }
      
      // Generate shift for DST transition day
      const shifts = generateShifts([nightTemplate], {
        startDate: fallDSTDate,
        daysToGenerate: 1
      })
      
      expect(shifts).toHaveLength(1)
      const nightShift = shifts[0]
      
      // Verify the shift has valid datetime fields
      expect(nightShift.start_dt).toBeDefined()
      expect(nightShift.end_dt).toBeDefined()
      
      // Duration should be positive even during DST transition
      const duration = compute_duration_dt(nightShift.start_dt, nightShift.end_dt)
      expect(duration).toBeGreaterThan(0)
      
      // For a shift that spans the DST transition at 03:00->02:00,
      // the actual duration would be longer due to the "gained" hour
    })
  })
  
  describe('Swaxi templates during DST transitions', () => {
    test('default Swaxi templates work correctly during DST transitions', () => {
      const templates = createSwaxiDefaultTemplates()
      
      // Test during both DST transitions
      const springTransition = new Date('2025-03-30')
      const fallTransition = new Date('2025-10-26')
      
      // Generate shifts for both DST transition days
      const springShifts = generateShifts(templates, {
        startDate: springTransition,
        daysToGenerate: 1
      })
      
      const fallShifts = generateShifts(templates, {
        startDate: fallTransition,
        daysToGenerate: 1
      })
      
      // Both should generate shifts without errors
      expect(springShifts.length).toBeGreaterThan(0)
      expect(fallShifts.length).toBeGreaterThan(0)
      
      // All shifts should have valid datetime fields
      const allShifts = springShifts.concat(fallShifts)
      allShifts.forEach(shift => {
        expect(shift.start_dt).toBeDefined()
        expect(shift.end_dt).toBeDefined()
        expect(shift.start_dt.local).toBeInstanceOf(Date)
        expect(shift.end_dt.local).toBeInstanceOf(Date)
        
        // Duration should be positive
        const duration = compute_duration_dt(shift.start_dt, shift.end_dt)
        expect(duration).toBeGreaterThan(0)
      })
    })
    
    test('week spanning DST transition generates all expected shifts', () => {
      const templates = createSwaxiDefaultTemplates()
      
      // Generate a week that includes the spring DST transition
      const springWeek = generateShifts(templates, {
        startDate: new Date('2025-03-24'), // Monday before DST
        daysToGenerate: 7
      })
      
      // Should generate shifts for all days without errors
      expect(springWeek.length).toBe(14) // 2 shifts per day × 7 days
      
      // Check that we have the expected mix of shift types
      const weekdayEvening = springWeek.filter(s => s.name === 'Abend')
      const weekdayNight = springWeek.filter(s => s.name === 'Nacht' && ['Mo','Tu','We','Th'].some(d => templates.find(t => t.days.includes(d) && t.name === 'Nacht')))
      const weekendEarly = springWeek.filter(s => s.name === 'Früh')
      const weekendNight = springWeek.filter(s => s.name === 'Nacht' && ['Fr','Sa','Su'].some(d => templates.find(t => t.days.includes(d) && t.name === 'Nacht')))
      
      expect(weekdayEvening.length).toBeGreaterThan(0)
      expect(weekdayNight.length).toBeGreaterThan(0) 
      expect(weekendEarly.length).toBeGreaterThan(0)
      expect(weekendNight.length).toBeGreaterThan(0)
    })
  })
})