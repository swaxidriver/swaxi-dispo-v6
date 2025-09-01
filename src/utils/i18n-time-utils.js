/**
 * Internationalized time utilities that respect user locale and time format preferences
 */

// Default timezone for the application (Europe/Berlin)
const DEFAULT_TIMEZONE = "Europe/Berlin";

/**
 * Get locale string for date formatting based on language
 * @param {string} language - Language code (de, en)
 * @returns {string} Locale string for Date methods
 */
function getLocaleString(language) {
  switch (language) {
    case "de":
      return "de-DE";
    case "en":
      return "en-US";
    default:
      return "de-DE"; // Default to German
  }
}

/**
 * Get time format options based on user preferences
 * @param {string} timeFormat - '24h' or 'ampm'
 * @returns {Object} Options for toLocaleString
 */
function getTimeFormatOptions(timeFormat) {
  const baseOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };

  if (timeFormat === "ampm") {
    return {
      ...baseOptions,
      hour12: true,
    };
  }

  // Default to 24h format
  return {
    ...baseOptions,
    hour12: false,
  };
}

/**
 * Format datetime for display with i18n support
 * @param {Object|Date|string} dt - Datetime object with utc/local/timezone or Date/string
 * @param {Object} options - Formatting options
 * @param {string} options.language - Language code
 * @param {string} options.timeFormat - Time format preference ('24h' or 'ampm')
 * @param {boolean} options.includeDate - Whether to include date
 * @param {boolean} options.includeTime - Whether to include time
 * @param {boolean} options.includeWeekday - Whether to include weekday
 * @returns {string} Formatted string
 */
export function formatDateTime(dt, options = {}) {
  if (!dt) return "";

  const {
    language = "de",
    timeFormat = "24h",
    includeDate = true,
    includeTime = true,
    includeWeekday = false,
  } = options;

  const localTime = dt.local || new Date(dt);
  const locale = getLocaleString(language);

  const formatOptions = {
    timeZone: dt.timezone || DEFAULT_TIMEZONE,
    ...getTimeFormatOptions(timeFormat),
  };

  if (includeDate) {
    formatOptions.year = "numeric";
    formatOptions.month = "2-digit";
    formatOptions.day = "2-digit";
  }

  if (includeWeekday) {
    formatOptions.weekday = "long";
  }

  if (!includeTime) {
    delete formatOptions.hour;
    delete formatOptions.minute;
    delete formatOptions.hour12;
  }

  return localTime.toLocaleString(locale, formatOptions);
}

/**
 * Format time only with i18n support
 * @param {Object|Date|string} dt - Datetime object or Date
 * @param {Object} options - Formatting options
 * @returns {string} Formatted time string
 */
export function formatTime(dt, options = {}) {
  return formatDateTime(dt, {
    ...options,
    includeDate: false,
    includeTime: true,
    includeWeekday: false,
  });
}

/**
 * Format date only with i18n support
 * @param {Object|Date|string} dt - Datetime object or Date
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(dt, options = {}) {
  return formatDateTime(dt, {
    ...options,
    includeDate: true,
    includeTime: false,
    includeWeekday: false,
  });
}

/**
 * Format date with weekday
 * @param {Object|Date|string} dt - Datetime object or Date
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string with weekday
 */
export function formatDateWithWeekday(dt, options = {}) {
  return formatDateTime(dt, {
    ...options,
    includeDate: true,
    includeTime: false,
    includeWeekday: true,
  });
}

/**
 * Get weekday name in the specified language
 * @param {Date|number} date - Date object or day index (0=Sunday, 1=Monday, etc.)
 * @param {string} language - Language code
 * @param {boolean} short - Whether to use short form
 * @returns {string} Weekday name
 */
export function getWeekdayName(date, language = "de", short = false) {
  let dayIndex;

  if (typeof date === "number") {
    dayIndex = date;
  } else {
    dayIndex = date.getDay();
  }

  const locale = getLocaleString(language);

  // Create a date for the specific weekday (using a known week)
  const referenceDate = new Date(2024, 0, 7 + dayIndex); // January 7, 2024 was a Sunday

  return referenceDate.toLocaleDateString(locale, {
    weekday: short ? "short" : "long",
  });
}

/**
 * Get month name in the specified language
 * @param {Date|number} date - Date object or month index (0=January, 1=February, etc.)
 * @param {string} language - Language code
 * @param {boolean} short - Whether to use short form
 * @returns {string} Month name
 */
export function getMonthName(date, language = "de", short = false) {
  let monthIndex;

  if (typeof date === "number") {
    monthIndex = date;
  } else {
    monthIndex = date.getMonth();
  }

  const locale = getLocaleString(language);

  // Create a date for the specific month
  const referenceDate = new Date(2024, monthIndex, 1);

  return referenceDate.toLocaleDateString(locale, {
    month: short ? "short" : "long",
  });
}

// Re-export existing functions from time-utils.js for compatibility
export {
  to_local,
  to_utc,
  create_datetime,
  is_overlap,
  compute_duration_dt,
  enhance_shift_with_datetime,
  get_timezone_offset,
  DEFAULT_TIMEZONE,
} from "./time-utils.js";
