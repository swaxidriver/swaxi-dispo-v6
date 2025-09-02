/**
 * TypeScript type definitions for DateTime primitives
 * Provides strict typing for timezone-aware datetime handling
 */

// Core DateTime type for timezone-aware operations
interface DateTime {
  utc: Date;
  local: Date;
  timezone: string;
}

// Timezone string literals for better type safety
type Timezone = "Europe/Berlin" | "Europe/London" | "UTC" | string; // Allow other valid timezone strings

// Date string in ISO format (YYYY-MM-DD)
type DateString = string;

// Time string in HH:MM format
type TimeString = string;

// DateTime creation parameters
interface DateTimeParams {
  dateStr: DateString;
  timeStr: TimeString;
  timezone?: Timezone;
}

// Range type for datetime comparisons
interface DateTimeRange {
  start_dt: DateTime | Date;
  end_dt: DateTime | Date;
}

// Shift type with datetime information
interface ShiftWithDateTime {
  id: string;
  date: DateString;
  start: TimeString;
  end: TimeString;
  start_dt?: DateTime;
  end_dt?: DateTime;
  type: string;
  status?: string;
  assignedTo?: string;
  workLocation?: string;
  conflicts?: string[];
}

// Time utility function types
interface TimeUtils {
  create_datetime(
    dateStr: DateString,
    timeStr: TimeString,
    timezone?: Timezone,
  ): DateTime;
  to_local(dt: Date | string, timezone?: Timezone): Date;
  to_utc(dt: Date | string, timezone?: Timezone): Date;
  format_datetime(dt: DateTime | Date | null | undefined): string;
  get_timezone_offset(date: Date | string, timezone?: Timezone): number;
  is_overlap(a: DateTimeRange, b: DateTimeRange): boolean;
  compute_duration_dt(start: DateTime | Date, end: DateTime | Date): number;
  enhance_shift_with_datetime(
    shift: Partial<ShiftWithDateTime>,
  ): ShiftWithDateTime;
}

// Export the types
export {
  DateTime,
  Timezone,
  DateString,
  TimeString,
  DateTimeParams,
  DateTimeRange,
  ShiftWithDateTime,
  TimeUtils,
};

// Re-export built-in Date type with enhanced methods
declare global {
  interface Date {
    toISODateString?(): DateString;
    toTimeString24?(): TimeString;
  }
}
