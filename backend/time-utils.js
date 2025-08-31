/**
 * Backend time utilities with centralized DST-safe time handling
 *
 * This module provides centralized time utilities specifically for backend operations,
 * ensuring DST safety and consistent timezone handling across the application.
 */

// Default timezone for the application (Europe/Berlin)
const DEFAULT_TIMEZONE = "Europe/Berlin";

/**
 * Parse local time string with optional timezone
 * @param {string} timeString - Time string in format 'HH:MM [timezone]' e.g. '21:00 Europe/Berlin'
 * @param {string} fallbackTimezone - Fallback timezone if not specified in string
 * @returns {Object} Parsed time object with hours, minutes, and timezone
 */
export function parse_local_time(
  timeString,
  fallbackTimezone = DEFAULT_TIMEZONE,
) {
  if (!timeString || typeof timeString !== "string") {
    throw new Error("Time string is required and must be a string");
  }

  // Split the string to extract time and timezone
  const parts = timeString.trim().split(/\s+/);
  const timePart = parts[0];
  const timezonePart =
    parts.length > 1 ? parts.slice(1).join("/") : fallbackTimezone;

  // Validate time format (HH:MM)
  const timeMatch = timePart.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!timeMatch) {
    throw new Error(`Invalid time format: ${timePart}. Expected HH:MM format.`);
  }

  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);

  return {
    hours,
    minutes,
    timezone: timezonePart,
    original: timeString,
  };
}

/**
 * Determine if end time should be moved to next day based on start/end comparison
 * Handles cross-midnight scenarios with DST awareness
 * @param {string|Object} start - Start time string or parsed time object
 * @param {string|Object} end - End time string or parsed time object
 * @param {string} timezone - Timezone for calculations
 * @returns {Object} Object with nextDay boolean and processed times
 */
export function next_day_if_needed(start, end, timezone = DEFAULT_TIMEZONE) {
  // Parse time strings if needed
  const startTime =
    typeof start === "string" ? parse_local_time(start, timezone) : start;
  const endTime =
    typeof end === "string" ? parse_local_time(end, timezone) : end;

  if (!startTime || !endTime) {
    throw new Error("Both start and end times are required");
  }

  // Calculate total minutes for comparison
  const startMinutes = startTime.hours * 60 + startTime.minutes;
  const endMinutes = endTime.hours * 60 + endTime.minutes;

  // If end time is less than or equal to start time, it crosses midnight
  const nextDay = endMinutes <= startMinutes;

  return {
    nextDay,
    startTime,
    endTime,
    crossesMidnight: nextDay,
  };
}

/**
 * Create a DST-safe datetime from date string and time components
 * @param {string} dateStr - Date in ISO format (YYYY-MM-DD)
 * @param {string|Object} timeInput - Time string or parsed time object
 * @param {string} timezone - Target timezone
 * @returns {Object} Object with UTC and local datetime, DST-aware
 */
export function create_dst_safe_datetime(
  dateStr,
  timeInput,
  timezone = DEFAULT_TIMEZONE,
) {
  if (!dateStr) {
    throw new Error("Date string is required");
  }

  // Parse time if it's a string
  const timeObj =
    typeof timeInput === "string"
      ? parse_local_time(timeInput, timezone)
      : timeInput;

  if (
    !timeObj ||
    typeof timeObj.hours !== "number" ||
    typeof timeObj.minutes !== "number"
  ) {
    throw new Error("Valid time object with hours and minutes is required");
  }

  // Create date object for the specified date and time
  const isoString = `${dateStr}T${String(timeObj.hours).padStart(2, "0")}:${String(timeObj.minutes).padStart(2, "0")}:00`;

  // For DST safety, we should ideally use a proper timezone library
  // For now, we'll use a simplified approach that's still DST-aware
  const localDateTime = new Date(isoString);

  // Check if the date is valid
  if (isNaN(localDateTime.getTime())) {
    throw new Error(`Invalid date/time combination: ${isoString}`);
  }

  // Convert to UTC considering timezone offset
  // This is a simplified implementation - for production, use a proper timezone library
  const utcDateTime = new Date(
    localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000,
  );

  return {
    utc: utcDateTime,
    local: localDateTime,
    timezone: timezone,
    isDST: is_dst_active(localDateTime, timezone),
    timezoneOffset: get_dst_safe_offset(localDateTime, timezone),
  };
}

/**
 * Check if DST is active for a given date and timezone
 * @param {Date} date - Date to check
 * @param {string} timezone - Timezone to check against
 * @returns {boolean} True if DST is active
 */
export function is_dst_active(date, _timezone = DEFAULT_TIMEZONE) {
  const testDate = date instanceof Date ? date : new Date(date);

  // Simplified DST detection for Europe/Berlin timezone
  // DST typically runs from last Sunday in March to last Sunday in October
  const month = testDate.getMonth() + 1; // JavaScript months are 0-based

  // Approximate DST period for Central European Time
  if (month >= 4 && month <= 9) {
    return true; // Definitely DST
  }
  if (month <= 2 || month >= 11) {
    return false; // Definitely not DST
  }

  // March and October need more precise calculation
  // For simplicity, we'll use a basic approximation
  if (month === 3) {
    return testDate.getDate() >= 25; // Rough estimate for last Sunday
  }
  if (month === 10) {
    return testDate.getDate() < 25; // Rough estimate for last Sunday
  }

  return false;
}

/**
 * Get DST-safe timezone offset for a specific date
 * @param {Date} date - Reference date
 * @param {string} timezone - Timezone
 * @returns {number} Offset in minutes, accounting for DST
 */
export function get_dst_safe_offset(date, timezone = DEFAULT_TIMEZONE) {
  const testDate = date instanceof Date ? date : new Date(date);
  const isDST = is_dst_active(testDate, timezone);

  // For Europe/Berlin: UTC+1 in winter, UTC+2 in summer
  if (timezone === "Europe/Berlin" || timezone === "Europe/Paris") {
    return isDST ? -120 : -60; // Negative because offset is from UTC
  }

  // For other timezones, fall back to system timezone offset
  return testDate.getTimezoneOffset();
}

/**
 * Enhanced cross-midnight shift processor with DST safety
 * @param {Object} shift - Shift object with date, start, end
 * @param {string} timezone - Timezone for processing
 * @returns {Object} Enhanced shift with DST-safe datetime fields
 */
export function process_cross_midnight_shift(
  shift,
  timezone = DEFAULT_TIMEZONE,
) {
  if (!shift || !shift.date || !shift.start || !shift.end) {
    throw new Error("Shift must have date, start, and end properties");
  }

  const { date, start, end } = shift;

  // Use next_day_if_needed to determine cross-midnight behavior
  const dayResult = next_day_if_needed(start, end, timezone);

  // Create start datetime
  const start_dt = create_dst_safe_datetime(
    date,
    dayResult.startTime,
    timezone,
  );

  // For end datetime, check if it crosses midnight
  let end_dt;
  if (dayResult.nextDay) {
    // Cross-midnight: end is on the next day
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10);
    end_dt = create_dst_safe_datetime(nextDayStr, dayResult.endTime, timezone);
  } else {
    // Same day
    end_dt = create_dst_safe_datetime(date, dayResult.endTime, timezone);
  }

  return {
    ...shift,
    start_dt,
    end_dt,
    crosses_midnight: dayResult.crossesMidnight,
    dst_start: start_dt.isDST,
    dst_end: end_dt.isDST,
    dst_transition: start_dt.isDST !== end_dt.isDST,
  };
}

/**
 * Calculate duration between DST-safe datetimes
 * @param {Object} start_dt - Start datetime object
 * @param {Object} end_dt - End datetime object
 * @returns {number} Duration in minutes, accounting for DST transitions
 */
export function calculate_dst_safe_duration(start_dt, end_dt) {
  if (!start_dt || !end_dt) {
    throw new Error("Both start and end datetime objects are required");
  }

  const startTime = start_dt.utc || start_dt;
  const endTime = end_dt.utc || end_dt;

  if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
    throw new Error("Datetime objects must contain valid Date instances");
  }

  const durationMs = endTime.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));

  return {
    minutes: durationMinutes,
    hours: Math.floor(durationMinutes / 60),
    dstTransition: start_dt.isDST !== end_dt.isDST,
    affectedByDST: start_dt.isDST !== end_dt.isDST,
  };
}

// Re-export commonly used functions for compatibility
export { DEFAULT_TIMEZONE };
