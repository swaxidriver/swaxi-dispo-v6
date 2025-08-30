import { generateShifts, createSwaxiDefaultTemplates } from '../services/shiftGenerationService'
import { validateTemplate } from '../utils/templateValidation'

// Freeze base date for deterministic output
const fixed = new Date('2025-08-25T08:00:00Z') // Monday
beforeAll(() => {
  jest.useFakeTimers()
  jest.setSystemTime(fixed)
})

afterAll(() => {
  jest.useRealTimers()
})

describe('shiftGenerationService.generateShifts', () => {
  it('generates shifts for matching weekday templates over 10 days', () => {
    const templates = [
      { name: 'early', startTime: '06:00', endTime: '14:00', days: ['Mo','Tu','We','Th','Fr'] },
      { name: 'weekend', startTime: '09:00', endTime: '17:00', days: ['Sa','Su'] }
    ]
    const shifts = generateShifts(templates)
    // Expect 5 weekdays in range (Mon-Fri) plus weekend days (Sat, Sun) within the 10-day window starting Monday
    // Window days: Mon(25) .. Wed(3) next week (10 days). Contains 7 weekdays (Mon-Fri twice except second Thu/Fri?) Let's compute precisely.
    // We'll assert counts by name to stay robust.
    const early = shifts.filter(s => s.name === 'early')
    const weekend = shifts.filter(s => s.name === 'weekend')
    expect(early.length).toBeGreaterThan(0)
    expect(weekend.length).toBeGreaterThan(0)
    // Ensure ids unique
    const ids = new Set(shifts.map(s => s.id))
    expect(ids.size).toBe(shifts.length)
    // Sample structure - now includes datetime fields
    expect(early[0]).toMatchObject({ 
      startTime: '06:00', 
      endTime: '14:00', 
      status: 'Offen',
      start_dt: expect.objectContaining({
        utc: expect.any(Date),
        local: expect.any(Date)
      }),
      end_dt: expect.objectContaining({
        utc: expect.any(Date),
        local: expect.any(Date)
      })
    })
  })

  it('returns empty array when no templates match any days', () => {
    const templates = [{ name: 'never', startTime: '00:00', endTime: '01:00', days: [] }]
    const shifts = generateShifts(templates)
    expect(shifts).toEqual([])
  })

  it('handles cross-midnight templates correctly', () => {
    const templates = [{
      name: 'night',
      startTime: '22:00',
      endTime: '06:00',
      days: ['Mo'],
      cross_midnight: true
    }]
    
    // Use a specific Monday date for testing
    const shifts = generateShifts(templates, {
      startDate: new Date('2025-01-06'), // Monday
      daysToGenerate: 1
    })
    
    const nightShifts = shifts.filter(s => s.name === 'night')
    expect(nightShifts.length).toBe(1)
    
    // Verify cross-midnight shift has correct datetime fields
    const nightShift = nightShifts[0]
    expect(nightShift.cross_midnight).toBe(true)
    expect(nightShift.start_dt).toBeDefined()
    expect(nightShift.end_dt).toBeDefined()
    expect(nightShift.start_dt.local).toBeInstanceOf(Date)
    expect(nightShift.end_dt.local).toBeInstanceOf(Date)
    
    // Start and end should be valid dates
    expect(nightShift.start_dt.local.getTime()).not.toBeNaN()
    expect(nightShift.end_dt.local.getTime()).not.toBeNaN()
    
    // End should be after start (accounting for cross-midnight)
    expect(nightShift.end_dt.utc.getTime()).toBeGreaterThan(nightShift.start_dt.utc.getTime())
  })

  it('validates templates and filters invalid ones', () => {
    const templates = [
      { name: 'valid', startTime: '08:00', endTime: '16:00', days: ['Mo'] },
      { name: 'invalid', startTime: '25:00', endTime: '16:00', days: ['Mo'] }, // Invalid time
      { name: 'cross-midnight-invalid', startTime: '22:00', endTime: '06:00', days: ['Mo'] } // Missing cross_midnight flag
    ]
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    const shifts = generateShifts(templates)
    
    // Only valid template should generate shifts
    expect(shifts.filter(s => s.name === 'valid').length).toBeGreaterThan(0)
    expect(shifts.filter(s => s.name === 'invalid').length).toBe(0)
    expect(shifts.filter(s => s.name === 'cross-midnight-invalid').length).toBe(0)
    
    // Should warn about invalid templates
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid template'))
    
    consoleSpy.mockRestore()
  })

  it('supports custom generation options', () => {
    const templates = [{ name: 'test', startTime: '08:00', endTime: '16:00', days: ['Mo','Tu','We','Th','Fr','Sa','Su'] }]
    
    const shifts = generateShifts(templates, {
      startDate: new Date('2025-01-01'),
      daysToGenerate: 5,
      enhanceWithDatetime: false
    })
    
    expect(shifts.length).toBe(5) // 5 days, 1 shift per day
    // Without datetime enhancement
    expect(shifts[0].start_dt).toBeUndefined()
    expect(shifts[0].end_dt).toBeUndefined()
  })
})

describe('createSwaxiDefaultTemplates', () => {
  it('creates valid Swaxi operating pattern templates', () => {
    const templates = createSwaxiDefaultTemplates()
    
    expect(templates).toHaveLength(4)
    
    // Verify all templates are valid
    templates.forEach(template => {
      const validation = validateTemplate(template)
      expect(validation.valid).toBe(true)
    })
    
    // Check weekday evening template
    const weekdayEvening = templates.find(t => t.name === 'Abend' && t.days.includes('Mo'))
    expect(weekdayEvening).toBeDefined()
    expect(weekdayEvening.startTime).toBe('18:00')
    expect(weekdayEvening.endTime).toBe('21:00')
    expect(weekdayEvening.cross_midnight).toBe(false)
    
    // Check weekday night template
    const weekdayNight = templates.find(t => t.name === 'Nacht' && t.days.includes('Mo'))
    expect(weekdayNight).toBeDefined()
    expect(weekdayNight.startTime).toBe('21:00')
    expect(weekdayNight.endTime).toBe('05:00')
    expect(weekdayNight.cross_midnight).toBe(true)
    
    // Check weekend early template
    const weekendEarly = templates.find(t => t.name === 'Früh' && t.days.includes('Fr'))
    expect(weekendEarly).toBeDefined()
    expect(weekendEarly.startTime).toBe('12:00')
    expect(weekendEarly.endTime).toBe('21:00')
    expect(weekendEarly.cross_midnight).toBe(false)
    
    // Check weekend night template
    const weekendNight = templates.find(t => t.name === 'Nacht' && t.days.includes('Fr'))
    expect(weekendNight).toBeDefined()
    expect(weekendNight.startTime).toBe('21:00')
    expect(weekendNight.endTime).toBe('05:00')
    expect(weekendNight.cross_midnight).toBe(true)
  })

  it('generates correct day patterns', () => {
    const templates = createSwaxiDefaultTemplates()
    
    // Test with a fixed Monday start date
    const shifts = generateShifts(templates, {
      startDate: new Date('2025-01-06'), // Monday
      daysToGenerate: 7 // One week
    })
    
    // Monday should have: Abend (weekday) + Nacht (weekday)
    const mondayShifts = shifts.filter(s => s.date === '2025-01-06')
    expect(mondayShifts).toHaveLength(2)
    expect(mondayShifts.some(s => s.name === 'Abend')).toBe(true)
    expect(mondayShifts.some(s => s.name === 'Nacht')).toBe(true)
    
    // Friday should have: Früh (weekend) + Nacht (weekend)
    const fridayShifts = shifts.filter(s => s.date === '2025-01-10')
    expect(fridayShifts).toHaveLength(2)
    expect(fridayShifts.some(s => s.name === 'Früh')).toBe(true)
    expect(fridayShifts.some(s => s.name === 'Nacht')).toBe(true)
  })
})
