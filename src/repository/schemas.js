// Database schema definitions for the scheduling data model
// Models: ShiftTemplate, ShiftInstance, Assignment, Person

/**
 * ShiftTemplate Schema
 * @typedef {Object} ShiftTemplate
 * @property {string} id - Unique identifier
 * @property {string} name - Template name
 * @property {number} weekday_mask - Bit mask for weekdays (1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun)
 * @property {string} start_time - Start time in HH:MM format
 * @property {string} end_time - End time in HH:MM format
 * @property {boolean} cross_midnight - Whether shift crosses midnight
 * @property {string} color - Hex color for UI display
 * @property {boolean} active - Whether template is active
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * ShiftInstance Schema
 * @typedef {Object} ShiftInstance
 * @property {string} id - Unique identifier
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {Date} start_dt - Start datetime
 * @property {Date} end_dt - End datetime
 * @property {string} template_id - Reference to ShiftTemplate.id
 * @property {string} notes - Optional notes
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * Assignment Schema
 * @typedef {Object} Assignment
 * @property {string} id - Unique identifier
 * @property {string} shift_instance_id - Reference to ShiftInstance.id
 * @property {string} disponent_id - Reference to Person.id
 * @property {string} status - assigned|tentative|released
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * Person Schema
 * @typedef {Object} Person
 * @property {string} id - Unique identifier
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} role - User role
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

// IndexedDB Object Store Configurations
export const STORES = {
  SHIFT_TEMPLATES: {
    name: 'shift_templates',
    keyPath: 'id',
    indexes: [
      { name: 'active', keyPath: 'active', unique: false },
      { name: 'name', keyPath: 'name', unique: false }
    ]
  },
  SHIFT_INSTANCES: {
    name: 'shift_instances',
    keyPath: 'id',
    indexes: [
      { name: 'date', keyPath: 'date', unique: false },
      { name: 'start_dt', keyPath: 'start_dt', unique: false },
      { name: 'end_dt', keyPath: 'end_dt', unique: false },
      { name: 'template_id', keyPath: 'template_id', unique: false }
    ]
  },
  ASSIGNMENTS: {
    name: 'assignments',
    keyPath: 'id',
    indexes: [
      { name: 'shift_instance_id', keyPath: 'shift_instance_id', unique: false },
      { name: 'disponent_id', keyPath: 'disponent_id', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      // Compound index for unique constraint
      { name: 'shift_disponent', keyPath: ['shift_instance_id', 'disponent_id'], unique: true }
    ]
  },
  PERSONS: {
    name: 'persons',
    keyPath: 'id',
    indexes: [
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'role', keyPath: 'role', unique: false }
    ]
  }
};

// Database version for migrations
export const DB_VERSION = 2; // Increment from existing version 1

// Assignment status constants
export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'assigned',
  TENTATIVE: 'tentative',
  RELEASED: 'released'
};

// Helper functions for weekday mask
export const WEEKDAY_MASKS = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 4,
  THURSDAY: 8,
  FRIDAY: 16,
  SATURDAY: 32,
  SUNDAY: 64
};

/**
 * Convert day names to weekday mask
 * @param {string[]} days - Array of day names (Mo, Tu, We, Th, Fr, Sa, Su)
 * @returns {number} Bit mask
 */
export function dayNamesToMask(days) {
  const dayMap = {
    'Mo': WEEKDAY_MASKS.MONDAY,
    'Tu': WEEKDAY_MASKS.TUESDAY,
    'We': WEEKDAY_MASKS.WEDNESDAY,
    'Th': WEEKDAY_MASKS.THURSDAY,
    'Fr': WEEKDAY_MASKS.FRIDAY,
    'Sa': WEEKDAY_MASKS.SATURDAY,
    'Su': WEEKDAY_MASKS.SUNDAY
  };
  
  return days.reduce((mask, day) => mask | (dayMap[day] || 0), 0);
}

/**
 * Convert weekday mask to day names
 * @param {number} mask - Bit mask
 * @returns {string[]} Array of day names
 */
export function maskToDayNames(mask) {
  const days = [];
  if (mask & WEEKDAY_MASKS.MONDAY) days.push('Mo');
  if (mask & WEEKDAY_MASKS.TUESDAY) days.push('Tu');
  if (mask & WEEKDAY_MASKS.WEDNESDAY) days.push('We');
  if (mask & WEEKDAY_MASKS.THURSDAY) days.push('Th');
  if (mask & WEEKDAY_MASKS.FRIDAY) days.push('Fr');
  if (mask & WEEKDAY_MASKS.SATURDAY) days.push('Sa');
  if (mask & WEEKDAY_MASKS.SUNDAY) days.push('Su');
  return days;
}

/**
 * Check if a given day of week is active in the mask
 * @param {number} mask - Weekday mask
 * @param {number} dayOfWeek - Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns {boolean} Whether the day is active
 */
export function isDayActive(mask, dayOfWeek) {
  // Convert JS Date.getDay() format (0=Sunday) to our Monday-based format
  const dayMasks = [
    WEEKDAY_MASKS.SUNDAY,    // 0
    WEEKDAY_MASKS.MONDAY,    // 1
    WEEKDAY_MASKS.TUESDAY,   // 2
    WEEKDAY_MASKS.WEDNESDAY, // 3
    WEEKDAY_MASKS.THURSDAY,  // 4
    WEEKDAY_MASKS.FRIDAY,    // 5
    WEEKDAY_MASKS.SATURDAY   // 6
  ];
  
  return Boolean(mask & dayMasks[dayOfWeek]);
}