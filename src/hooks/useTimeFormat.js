import {
  formatDateTime,
  formatTime,
  formatDate,
  formatDateWithWeekday,
  getWeekdayName,
  getMonthName,
} from "../utils/i18n-time-utils";

import { useI18n } from "./useI18n";
import { useSettings } from "./useSettings";

/**
 * Hook for i18n-aware date and time formatting
 * Automatically uses the user's language and time format preferences
 */
export function useTimeFormat() {
  const { language } = useI18n();
  const { settings } = useSettings();

  const timeFormat = settings.timeFormat || "24h";

  const formatOptions = {
    language,
    timeFormat,
  };

  return {
    // Main formatting functions
    formatDateTime: (dt, options = {}) =>
      formatDateTime(dt, { ...formatOptions, ...options }),
    formatTime: (dt, options = {}) =>
      formatTime(dt, { ...formatOptions, ...options }),
    formatDate: (dt, options = {}) =>
      formatDate(dt, { ...formatOptions, ...options }),
    formatDateWithWeekday: (dt, options = {}) =>
      formatDateWithWeekday(dt, { ...formatOptions, ...options }),

    // Utility functions
    getWeekdayName: (date, short = false) =>
      getWeekdayName(date, language, short),
    getMonthName: (date, short = false) => getMonthName(date, language, short),

    // Current settings
    language,
    timeFormat,

    // Quick format functions for common use cases
    formatTimeOnly: (dt) => formatTime(dt, formatOptions),
    formatDateOnly: (dt) => formatDate(dt, formatOptions),
    formatFull: (dt) =>
      formatDateTime(dt, { ...formatOptions, includeWeekday: true }),
  };
}

export default useTimeFormat;
