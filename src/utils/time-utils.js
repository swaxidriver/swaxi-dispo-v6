/**
 * Time utilities for cross-midnight handling with real datetimes
 *
 * This module provides utilities for handling shifts that cross midnight
 * by storing full datetime information (UTC + local timezone) instead of
 * just times and dates.
 */

// Default timezone for the application (Europe/Berlin)
export const DEFAULT_TIMEZONE = "Europe/Berlin";

/**
 * Convert a datetime to local timezone
 * @param {Date|string} dt - UTC datetime or ISO string
 * @param {string} timezone - Target timezone (default: Europe/Berlin)
 * @returns {Date} Local datetime
 */
export function to_local(dt, timezone = DEFAULT_TIMEZONE) {
  const date = dt instanceof Date ? dt : new Date(dt);
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

/**
 * Convert a datetime to UTC
 * @param {Date|string} dt - Local datetime
 * @param {string} timezone - Source timezone (default: Europe/Berlin)
 * @returns {Date} UTC datetime
 */
export function to_utc(dt, _timezone = DEFAULT_TIMEZONE) {
  const date = dt instanceof Date ? dt : new Date(dt);
  // This is a simplified implementation - for production use a proper timezone library
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
}

/**
 * Create a datetime from date and time components
 * @param {string} dateStr - Date in ISO format (YYYY-MM-DD)
 * @param {string} timeStr - Time in HH:MM format
 * @param {string} timezone - Timezone (default: Europe/Berlin)
 * @returns {Object} Object with utc and local datetime
 */
export function create_datetime(dateStr, timeStr, timezone = DEFAULT_TIMEZONE) {
  // Validate inputs
  if (!dateStr || !timeStr) {
    throw new Error("Date and time strings are required");
  }
  // Allow Date object for dateStr (normalize)
  if (dateStr instanceof Date) {
    dateStr = dateStr.toISOString().slice(0, 10);
  }

  // Combine date and time to create local datetime
  const isoString = `${dateStr}T${timeStr}:00`;
  const localDateTime = new Date(isoString);

  // Check if the date is valid
  if (isNaN(localDateTime.getTime())) {
    throw new Error(`Invalid date/time: ${isoString}`);
  }

  // For UTC, we'll use a simple approach since precise timezone handling
  // requires a proper timezone library like date-fns-tz
  const utcDateTime = new Date(
    localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000,
  );

  return {
    utc: utcDateTime,
    local: localDateTime,
    timezone: timezone,
  };
}

/**
 * Check if two datetime ranges overlap (timezone aware)
 * @param {Object} a - First range with {start_dt, end_dt}
 * @param {Object} b - Second range with {start_dt, end_dt}
 * @returns {boolean} True if ranges overlap
 */
export function is_overlap(a, b) {
  // Use UTC times for comparison to avoid timezone issues
  const aStart = a.start_dt?.utc || new Date(a.start_dt);
  const aEnd = a.end_dt?.utc || new Date(a.end_dt);
  const bStart = b.start_dt?.utc || new Date(b.start_dt);
  const bEnd = b.end_dt?.utc || new Date(b.end_dt);

  // Check if ranges overlap: a.start < b.end && a.end > b.start
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Calculate duration between two datetimes in minutes
 * @param {Object} start_dt - Start datetime object
 * @param {Object} end_dt - End datetime object
 * @returns {number} Duration in minutes
 */
export function compute_duration_dt(start_dt, end_dt) {
  const startTime = start_dt?.utc || new Date(start_dt);
  const endTime = end_dt?.utc || new Date(end_dt);
  let diff = Math.round((endTime - startTime) / (1000 * 60));
  // If negative but within 24h, treat as cross-midnight and adjust
  if (diff < 0 && diff > -1440) {
    diff += 1440;
  }
  return diff;
}

/**
 * Convert a shift with date/start/end to datetime format
 * @param {Object} shift - Shift with date, start, end fields
 * @returns {Object} Enhanced shift with start_dt and end_dt
 */
export function enhance_shift_with_datetime(shift) {
  const { date, start, end } = shift;
  const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;

  // Create start datetime
  const start_dt = create_datetime(dateStr, start);

  // For end datetime, check if it crosses midnight
  let end_dt;
  if (end < start) {
    // Cross-midnight: end is on the next day
    const nextDay = date instanceof Date ? new Date(date) : new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10);
    end_dt = create_datetime(nextDayStr, end);
  } else {
    // Same day
    end_dt = create_datetime(dateStr, end);
  }

  return {
    ...shift,
    start_dt,
    end_dt,
  };
}

/**
 * Format datetime for display (legacy function - consider using formatDateTime from i18n-time-utils)
 * @param {Object} dt - Datetime object with utc/local/timezone
 * @param {string} language - Language code (default: 'de')
 * @param {string} timeFormat - Time format preference ('24h' or 'ampm', default: '24h')
 * @returns {string} Formatted string
 */
export function format_datetime(dt, language = "de", timeFormat = "24h") {
  if (!dt) return "";

  const localTime = dt.local || new Date(dt);
  const locale = language === "en" ? "en-US" : "de-DE";

  const formatOptions = {
    timeZone: dt.timezone || DEFAULT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: timeFormat === "ampm",
  };

  return localTime.toLocaleString(locale, formatOptions);
}

/**
 * Get timezone offset for a specific date and timezone
 * @param {Date} date - Reference date
 * @param {string} timezone - Timezone
 * @returns {number} Offset in minutes
 */
export function get_timezone_offset(date, _timezone = DEFAULT_TIMEZONE) {
  // Simple implementation - returns the local timezone offset
  const d = date instanceof Date ? date : new Date(date);
  return d.getTimezoneOffset();
}
