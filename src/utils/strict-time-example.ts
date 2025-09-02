/**
 * Example TypeScript file demonstrating strict mode and DateTime types
 * This shows how strict TypeScript would catch type errors
 */

import type { DateTime, DateString, TimeString, Timezone } from "../types/date";

// This function demonstrates strict typing with DateTime
export function strictDateTimeExample(
  dateStr: DateString,
  timeStr: TimeString,
  timezone?: Timezone,
): DateTime {
  // This would cause a TypeScript error if parameters were wrong types
  if (!dateStr || !timeStr) {
    throw new Error("Date and time strings are required");
  }

  const isoString = `${dateStr}T${timeStr}:00`;
  const localDateTime = new Date(isoString);

  if (isNaN(localDateTime.getTime())) {
    throw new Error(`Invalid date/time: ${isoString}`);
  }

  const utcDateTime = new Date(
    localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000,
  );

  return {
    utc: utcDateTime,
    local: localDateTime,
    timezone: timezone || "Europe/Berlin",
  };
}

// Example of strict function that would catch implicit any errors
export function calculateDuration(start: DateTime, end: DateTime): number {
  const startTime = start.utc.getTime();
  const endTime = end.utc.getTime();
  return Math.max(0, (endTime - startTime) / (1000 * 60)); // duration in minutes
}

// Example function that would catch null/undefined issues
export function formatDateTimeSafely(dt: DateTime | null | undefined): string {
  if (!dt) {
    return "";
  }

  return dt.local.toLocaleString("de-DE", {
    timeZone: dt.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
