/**
 * Tests for template validation with cross-midnight support
 */

import { 
  validateTemplate, 
  createTemplate, 
  normalizeTemplate, 
  isCrossMidnightTemplate 
} from '../utils/templateValidation'

describe('Template Validation', () => {
  describe('validateTemplate', () => {
    test('validates valid template', () => {
      const template = {
        name: 'Morning Shift',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo', 'Tu', 'We', 'Th', 'Fr']
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('validates cross-midnight template with flag', () => {
      const template = {
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        days: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
        cross_midnight: true
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('rejects cross-midnight template without flag', () => {
      const template = {
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        days: ['Mo', 'Tu', 'We', 'Th', 'Fr']
        // cross_midnight flag missing
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('End time before start time requires cross_midnight flag to be true')
    })

    test('rejects template with zero duration', () => {
      const template = {
        name: 'Zero Duration',
        startTime: '12:00',
        endTime: '12:00',
        days: ['Mo']
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duration must be greater than 0 minutes')
    })

    test('rejects template with missing name', () => {
      const template = {
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo']
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Template name is required')
    })

    test('rejects template with invalid time format', () => {
      const template = {
        name: 'Invalid Time',
        startTime: '25:00', // Invalid hour
        endTime: '16:70', // Invalid minutes
        days: ['Mo']
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Start time must be in HH:MM format (24-hour)')
      expect(result.errors).toContain('End time must be in HH:MM format (24-hour)')
    })

    test('rejects template with invalid day codes', () => {
      const template = {
        name: 'Invalid Days',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Monday', 'XX', 'Fr'] // Invalid day codes
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid day codes: Monday, XX')
    })

    test('rejects template with no days selected', () => {
      const template = {
        name: 'No Days',
        startTime: '08:00',
        endTime: '16:00',
        days: []
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('At least one day must be selected')
    })

    test('rejects normal template with cross_midnight flag', () => {
      const template = {
        name: 'Day Shift',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo'],
        cross_midnight: true // Incorrect for non-cross-midnight shift
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('cross_midnight flag should only be true when end time is before start time')
    })

    test('validates template with custom timezone', () => {
      const template = {
        name: 'UTC Shift',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo'],
        timezone: 'UTC'
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('rejects template with invalid timezone type', () => {
      const template = {
        name: 'Invalid Timezone',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo'],
        timezone: 123 // Should be string
      }

      const result = validateTemplate(template)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Timezone must be a string')
    })
  })

  describe('createTemplate', () => {
    test('creates valid template with defaults', () => {
      const templateData = {
        name: 'Test Shift',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo', 'Tu']
      }

      const template = createTemplate(templateData)
      expect(template.name).toBe('Test Shift')
      expect(template.timezone).toBe('Europe/Berlin')
      expect(template.cross_midnight).toBe(false)
    })

    test('preserves existing timezone and cross_midnight', () => {
      const templateData = {
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        days: ['Mo'],
        timezone: 'UTC',
        cross_midnight: true
      }

      const template = createTemplate(templateData)
      expect(template.timezone).toBe('UTC')
      expect(template.cross_midnight).toBe(true)
    })

    test('throws error for invalid template', () => {
      const templateData = {
        name: '',
        startTime: '25:00',
        endTime: '16:00',
        days: []
      }

      expect(() => createTemplate(templateData)).toThrow('Template validation failed')
    })
  })

  describe('normalizeTemplate', () => {
    test('normalizes regular template', () => {
      const template = {
        name: 'Day Shift',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo']
      }

      const normalized = normalizeTemplate(template)
      expect(normalized.cross_midnight).toBe(false)
      expect(normalized.timezone).toBe('Europe/Berlin')
      expect(normalized.duration).toBe(8 * 60) // 8 hours in minutes
    })

    test('normalizes cross-midnight template', () => {
      const template = {
        name: 'Night Shift',
        startTime: '22:00',
        endTime: '06:00',
        days: ['Mo']
      }

      const normalized = normalizeTemplate(template)
      expect(normalized.cross_midnight).toBe(true)
      expect(normalized.duration).toBe(8 * 60) // 8 hours in minutes
    })

    test('preserves explicit cross_midnight setting', () => {
      const template = {
        name: 'Test',
        startTime: '08:00',
        endTime: '16:00',
        days: ['Mo'],
        cross_midnight: false // Explicit setting
      }

      const normalized = normalizeTemplate(template)
      expect(normalized.cross_midnight).toBe(false)
    })
  })

  describe('isCrossMidnightTemplate', () => {
    test('detects cross-midnight template', () => {
      const template = {
        startTime: '22:00',
        endTime: '06:00'
      }

      expect(isCrossMidnightTemplate(template)).toBe(true)
    })

    test('detects regular template', () => {
      const template = {
        startTime: '08:00',
        endTime: '16:00'
      }

      expect(isCrossMidnightTemplate(template)).toBe(false)
    })

    test('handles edge case of midnight', () => {
      const template = {
        startTime: '23:59',
        endTime: '00:01'
      }

      expect(isCrossMidnightTemplate(template)).toBe(true)
    })
  })

  describe('DST boundary edge cases', () => {
    test('validates template during DST transitions', () => {
      // Template during spring DST transition
      const springTemplate = {
        name: 'DST Spring',
        startTime: '01:00',
        endTime: '05:00',
        days: ['Su'], // Last Sunday in March
        timezone: 'Europe/Berlin'
      }

      const result = validateTemplate(springTemplate)
      expect(result.valid).toBe(true)
    })

    test('validates cross-midnight template during DST transitions', () => {
      // Cross-midnight template during fall DST transition
      const fallTemplate = {
        name: 'DST Fall',
        startTime: '23:00',
        endTime: '03:00',
        days: ['Sa'], // Last Saturday in October
        timezone: 'Europe/Berlin',
        cross_midnight: true
      }

      const result = validateTemplate(fallTemplate)
      expect(result.valid).toBe(true)
    })
  })

  describe('Swaxi operating pattern templates', () => {
    test('validates Mon-Thu evening and night pattern', () => {
      const eveningTemplate = {
        name: 'Abend',
        startTime: '18:00',
        endTime: '21:00',
        days: ['Mo', 'Tu', 'We', 'Th'],
        timezone: 'Europe/Berlin'
      }

      const nightTemplate = {
        name: 'Nacht',
        startTime: '21:00',
        endTime: '05:00',
        days: ['Mo', 'Tu', 'We', 'Th'],
        timezone: 'Europe/Berlin',
        cross_midnight: true
      }

      expect(validateTemplate(eveningTemplate).valid).toBe(true)
      expect(validateTemplate(nightTemplate).valid).toBe(true)
    })

    test('validates Fri-Sun early and night pattern', () => {
      const earlyTemplate = {
        name: 'Früh',
        startTime: '12:00',
        endTime: '21:00',
        days: ['Fr', 'Sa', 'Su'],
        timezone: 'Europe/Berlin'
      }

      const nightTemplate = {
        name: 'Nacht',
        startTime: '21:00',
        endTime: '05:00',
        days: ['Fr', 'Sa', 'Su'],
        timezone: 'Europe/Berlin',
        cross_midnight: true
      }

      expect(validateTemplate(earlyTemplate).valid).toBe(true)
      expect(validateTemplate(nightTemplate).valid).toBe(true)
    })
  })
})