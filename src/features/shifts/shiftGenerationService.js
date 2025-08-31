import { addDays, format, getDay } from 'date-fns'

import { buildShiftId } from '../../contexts/ShiftContextCore'
import { validateTemplate, normalizeTemplate } from '../../utils/templateValidation'
import { enhance_shift_with_datetime } from '../../lib/time'

const dayMapping = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
}

/**
 * Generate shifts from templates with cross-midnight support
 * @param {Array} templates - Array of shift templates
 * @param {Object} options - Generation options
 * @param {Date} [options.startDate] - Start date for generation
 * @param {number} [options.daysToGenerate=10] - Number of days to generate
 * @param {boolean} [options.enhanceWithDatetime=true] - Whether to enhance with datetime fields
 * @returns {Array} Generated shifts with datetime enhancement
 */
export function generateShifts(templates, options = {}) {
  const {
    startDate = new Date(),
    daysToGenerate = 10,
    enhanceWithDatetime = true
  } = options

  const newShifts = []

  // Validate and normalize templates first
  const validTemplates = templates.filter(template => {
    const validation = validateTemplate(template)
    if (!validation.valid) {
      console.warn(`Invalid template "${template.name}": ${validation.errors.join(', ')}`)
      return false
    }
    return true
  }).map(normalizeTemplate)

  for (let i = 0; i < daysToGenerate; i++) {
    const date = addDays(startDate, i)
    const dayOfWeek = getDay(date)

    validTemplates.forEach((template) => {
      if (template.days.map(d => dayMapping[d]).includes(dayOfWeek)) {
        const dateStr = format(date, 'yyyy-MM-dd')
        
        const shift = {
          id: buildShiftId(dateStr, template.name),
          date: dateStr,
          name: template.name,
          start: template.startTime, // Use 'start' for consistency with enhance_shift_with_datetime
          end: template.endTime,     // Use 'end' for consistency with enhance_shift_with_datetime
          startTime: template.startTime, // Keep for backward compatibility
          endTime: template.endTime,     // Keep for backward compatibility
          status: 'Offen',
          assignedTo: null,
          // Include template metadata for debugging and future use
          templateId: template.id,
          cross_midnight: template.cross_midnight,
          timezone: template.timezone
        }

        // Enhance with datetime fields for cross-midnight support
        if (enhanceWithDatetime) {
          const enhancedShift = enhance_shift_with_datetime(shift)
          newShifts.push(enhancedShift)
        } else {
          newShifts.push(shift)
        }
      }
    })
  }
  
  return newShifts
}

/**
 * Create default Swaxi operating pattern templates
 * @returns {Array} Default templates matching Swaxi requirements
 */
export function createSwaxiDefaultTemplates() {
  return [
    // Mon-Thu Evening shift: 18:00-21:00
    {
      id: 'swaxi-weekday-evening',
      name: 'Abend',
      startTime: '18:00',
      endTime: '21:00',
      days: ['Mo', 'Tu', 'We', 'Th'],
      cross_midnight: false,
      timezone: 'Europe/Berlin'
    },
    // Mon-Thu Night shift: 21:00-05:00 (+1)
    {
      id: 'swaxi-weekday-night',
      name: 'Nacht',
      startTime: '21:00',
      endTime: '05:00',
      days: ['Mo', 'Tu', 'We', 'Th'],
      cross_midnight: true,
      timezone: 'Europe/Berlin'
    },
    // Fri-Sun Early shift: 12:00-21:00
    {
      id: 'swaxi-weekend-early',
      name: 'Früh',
      startTime: '12:00',
      endTime: '21:00',
      days: ['Fr', 'Sa', 'Su'],
      cross_midnight: false,
      timezone: 'Europe/Berlin'
    },
    // Fri-Sun Night shift: 21:00-05:00 (+1)
    {
      id: 'swaxi-weekend-night',
      name: 'Nacht',
      startTime: '21:00',
      endTime: '05:00',
      days: ['Fr', 'Sa', 'Su'],
      cross_midnight: true,
      timezone: 'Europe/Berlin'
    }
  ]
}
