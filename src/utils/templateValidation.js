/**
 * Template validation utilities for cross-midnight support
 *
 * Validates shift templates with timezone awareness and cross-midnight handling
 */

import { toMinutes, computeDuration } from "./shifts.js";

// Default timezone for the application
const DEFAULT_TIMEZONE = "Europe/Berlin";

// Error codes for translation
export const VALIDATION_ERROR_CODES = {
  TEMPLATE_NAME_REQUIRED: "templateNameRequired",
  START_TIME_REQUIRED: "startTimeRequired",
  END_TIME_REQUIRED: "endTimeRequired",
  AT_LEAST_ONE_DAY_REQUIRED: "atLeastOneDayRequired",
  START_TIME_INVALID_FORMAT: "startTimeInvalidFormat",
  END_TIME_INVALID_FORMAT: "endTimeInvalidFormat",
};

/**
 * Translate validation error messages using provided translation function
 * @param {string[]} errors - Array of error messages or error codes
 * @param {Function} t - Translation function
 * @returns {string[]} Array of translated error messages
 */
export function translateValidationErrors(errors, t) {
  const errorCodeMap = {
    "Template name is required": VALIDATION_ERROR_CODES.TEMPLATE_NAME_REQUIRED,
    "Start time is required": VALIDATION_ERROR_CODES.START_TIME_REQUIRED,
    "End time is required": VALIDATION_ERROR_CODES.END_TIME_REQUIRED,
    "At least one day must be selected":
      VALIDATION_ERROR_CODES.AT_LEAST_ONE_DAY_REQUIRED,
    "Start time must be in HH:MM format (24-hour)":
      VALIDATION_ERROR_CODES.START_TIME_INVALID_FORMAT,
    "End time must be in HH:MM format (24-hour)":
      VALIDATION_ERROR_CODES.END_TIME_INVALID_FORMAT,
  };

  return errors.map((error) => {
    const errorCode = errorCodeMap[error];
    return errorCode ? t(errorCode) : error;
  });
}

/**
 * Validate a shift template
 * @param {Object} template - Template to validate
 * @param {string} template.name - Template name
 * @param {string} template.startTime - Start time in HH:MM format
 * @param {string} template.endTime - End time in HH:MM format
 * @param {string[]} template.days - Array of day codes (Mo, Tu, We, Th, Fr, Sa, Su)
 * @param {boolean} [template.cross_midnight] - Whether this template crosses midnight
 * @param {string} [template.timezone] - Timezone for this template
 * @returns {Object} Validation result with { valid: boolean, errors: string[] }
 */
export function validateTemplate(template) {
  const errors = [];

  // Required fields
  if (
    !template.name ||
    typeof template.name !== "string" ||
    template.name.trim() === ""
  ) {
    errors.push("Template name is required");
  }

  if (!template.startTime || typeof template.startTime !== "string") {
    errors.push("Start time is required");
  }

  if (!template.endTime || typeof template.endTime !== "string") {
    errors.push("End time is required");
  }

  if (!Array.isArray(template.days) || template.days.length === 0) {
    errors.push("At least one day must be selected");
  }

  // Time format validation
  const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
  if (template.startTime && !timePattern.test(template.startTime)) {
    errors.push("Start time must be in HH:MM format (24-hour)");
  }

  if (template.endTime && !timePattern.test(template.endTime)) {
    errors.push("End time must be in HH:MM format (24-hour)");
  }

  // Day codes validation
  const validDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  if (template.days) {
    const invalidDays = template.days.filter((day) => !validDays.includes(day));
    if (invalidDays.length > 0) {
      errors.push(`Invalid day codes: ${invalidDays.join(", ")}`);
    }
  }

  // Duration and cross-midnight validation
  if (
    template.startTime &&
    template.endTime &&
    timePattern.test(template.startTime) &&
    timePattern.test(template.endTime)
  ) {
    const startMinutes = toMinutes(template.startTime);
    const endMinutes = toMinutes(template.endTime);

    if (Number.isNaN(startMinutes) || Number.isNaN(endMinutes)) {
      errors.push("Invalid time format");
    } else {
      const duration = computeDuration(template.startTime, template.endTime);

      // Check for zero or negative duration
      if (duration <= 0) {
        errors.push("Duration must be greater than 0 minutes");
      }

      // Check cross-midnight logic
      const isCrossMidnight = endMinutes < startMinutes;
      if (isCrossMidnight && !template.cross_midnight) {
        errors.push(
          "End time before start time requires cross_midnight flag to be true",
        );
      }

      if (!isCrossMidnight && template.cross_midnight) {
        errors.push(
          "cross_midnight flag should only be true when end time is before start time",
        );
      }
    }
  }

  // Timezone validation (if specified)
  if (template.timezone && typeof template.timezone !== "string") {
    errors.push("Timezone must be a string");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a validated template with defaults
 * @param {Object} templateData - Raw template data
 * @returns {Object} Enhanced template with defaults and validation
 */
export function createTemplate(templateData) {
  const template = {
    ...templateData,
    timezone: templateData.timezone || DEFAULT_TIMEZONE,
    cross_midnight: templateData.cross_midnight || false,
  };

  const validation = validateTemplate(template);

  if (!validation.valid) {
    throw new Error(
      `Template validation failed: ${validation.errors.join(", ")}`,
    );
  }

  return template;
}

/**
 * Normalize template for consistent processing
 * @param {Object} template - Template to normalize
 * @returns {Object} Normalized template
 */
export function normalizeTemplate(template) {
  const startMinutes = toMinutes(template.startTime);
  const endMinutes = toMinutes(template.endTime);
  const isCrossMidnight = endMinutes < startMinutes;

  return {
    ...template,
    cross_midnight:
      template.cross_midnight !== undefined
        ? template.cross_midnight
        : isCrossMidnight,
    timezone: template.timezone || DEFAULT_TIMEZONE,
    duration: computeDuration(template.startTime, template.endTime),
  };
}

/**
 * Check if template represents a cross-midnight shift
 * @param {Object} template - Template to check
 * @returns {boolean} True if template crosses midnight
 */
export function isCrossMidnightTemplate(template) {
  const startMinutes = toMinutes(template.startTime);
  const endMinutes = toMinutes(template.endTime);
  return endMinutes < startMinutes;
}
