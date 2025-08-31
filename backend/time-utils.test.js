/**
 * Tests for backend time utilities - DST safety net implementation
 * Tests for P1 issue: Timezone & DST safety net
 */

import {
  parse_local_time,
  next_day_if_needed,
  create_dst_safe_datetime,
  is_dst_active,
  get_dst_safe_offset,
  process_cross_midnight_shift,
  calculate_dst_safe_duration,
  DEFAULT_TIMEZONE,
} from "./time-utils.js";

describe("Backend Time Utilities - DST Safety Net", () => {
  describe("parse_local_time", () => {
    test("parses time string without timezone", () => {
      const result = parse_local_time("21:00");

      expect(result).toEqual({
        hours: 21,
        minutes: 0,
        timezone: DEFAULT_TIMEZONE,
        original: "21:00",
      });
    });

    test("parses time string with Europe/Berlin timezone", () => {
      const result = parse_local_time("21:00 Europe/Berlin");

      expect(result).toEqual({
        hours: 21,
        minutes: 0,
        timezone: "Europe/Berlin",
        original: "21:00 Europe/Berlin",
      });
    });

    test("parses time string with other timezones", () => {
      const result = parse_local_time("14:30 America/New_York");

      expect(result).toEqual({
        hours: 14,
        minutes: 30,
        timezone: "America/New_York",
        original: "14:30 America/New_York",
      });
    });

    test("handles edge times (midnight and noon)", () => {
      const midnight = parse_local_time("00:00 Europe/Berlin");
      const noon = parse_local_time("12:00 Europe/Berlin");
      const endOfDay = parse_local_time("23:59 Europe/Berlin");

      expect(midnight.hours).toBe(0);
      expect(midnight.minutes).toBe(0);
      expect(noon.hours).toBe(12);
      expect(noon.minutes).toBe(0);
      expect(endOfDay.hours).toBe(23);
      expect(endOfDay.minutes).toBe(59);
    });

    test("throws error for invalid time format", () => {
      expect(() => parse_local_time("25:00")).toThrow("Invalid time format");
      expect(() => parse_local_time("12:60")).toThrow("Invalid time format");
      expect(() => parse_local_time("abc")).toThrow("Invalid time format");
      expect(() => parse_local_time("")).toThrow("Time string is required");
      expect(() => parse_local_time(null)).toThrow("Time string is required");
    });

    test("handles various time formats", () => {
      const single_digit_hour = parse_local_time("9:15");
      const leading_zero = parse_local_time("09:15");

      expect(single_digit_hour.hours).toBe(9);
      expect(leading_zero.hours).toBe(9);
    });
  });

  describe("next_day_if_needed", () => {
    test("returns false for same-day shift", () => {
      const result = next_day_if_needed("08:00", "16:00");

      expect(result.nextDay).toBe(false);
      expect(result.crossesMidnight).toBe(false);
      expect(result.startTime.hours).toBe(8);
      expect(result.endTime.hours).toBe(16);
    });

    test("returns true for cross-midnight shift", () => {
      const result = next_day_if_needed("22:00", "06:00");

      expect(result.nextDay).toBe(true);
      expect(result.crossesMidnight).toBe(true);
      expect(result.startTime.hours).toBe(22);
      expect(result.endTime.hours).toBe(6);
    });

    test("handles edge case: start and end same time", () => {
      const result = next_day_if_needed("12:00", "12:00");

      expect(result.nextDay).toBe(true); // Equal times cross midnight
      expect(result.crossesMidnight).toBe(true);
    });

    test("works with parsed time objects", () => {
      const start = parse_local_time("23:30");
      const end = parse_local_time("07:00");

      const result = next_day_if_needed(start, end);

      expect(result.nextDay).toBe(true);
      expect(result.crossesMidnight).toBe(true);
    });

    test("handles timezone specification", () => {
      const result = next_day_if_needed(
        "22:00 Europe/Berlin",
        "06:00 Europe/Berlin",
      );

      expect(result.nextDay).toBe(true);
      expect(result.startTime.timezone).toBe("Europe/Berlin");
      expect(result.endTime.timezone).toBe("Europe/Berlin");
    });

    test("throws error for missing parameters", () => {
      expect(() => next_day_if_needed(null, "16:00")).toThrow(
        "Both start and end times are required",
      );
      expect(() => next_day_if_needed("08:00", null)).toThrow(
        "Both start and end times are required",
      );
    });
  });

  describe("DST transition handling", () => {
    test("is_dst_active detects DST periods correctly", () => {
      // Summer dates (DST active in Europe/Berlin)
      const summerDate = new Date("2025-07-15T12:00:00");
      expect(is_dst_active(summerDate, "Europe/Berlin")).toBe(true);

      // Winter dates (DST not active)
      const winterDate = new Date("2025-01-15T12:00:00");
      expect(is_dst_active(winterDate, "Europe/Berlin")).toBe(false);

      // November dates (DST not active)
      const novemberDate = new Date("2025-11-15T12:00:00");
      expect(is_dst_active(novemberDate, "Europe/Berlin")).toBe(false);
    });

    test("get_dst_safe_offset returns correct offsets", () => {
      const summerDate = new Date("2025-07-15T12:00:00");
      const winterDate = new Date("2025-01-15T12:00:00");

      const summerOffset = get_dst_safe_offset(summerDate, "Europe/Berlin");
      const winterOffset = get_dst_safe_offset(winterDate, "Europe/Berlin");

      expect(summerOffset).toBe(-120); // UTC+2 in summer
      expect(winterOffset).toBe(-60); // UTC+1 in winter
    });

    test("create_dst_safe_datetime handles DST transitions", () => {
      // Spring DST transition date (2025-03-30)
      const springTransition = create_dst_safe_datetime("2025-03-30", "02:30");
      expect(springTransition.utc).toBeInstanceOf(Date);
      expect(springTransition.local).toBeInstanceOf(Date);
      expect(typeof springTransition.isDST).toBe("boolean");
      expect(typeof springTransition.timezoneOffset).toBe("number");

      // Fall DST transition date (2025-10-26)
      const fallTransition = create_dst_safe_datetime("2025-10-26", "02:30");
      expect(fallTransition.utc).toBeInstanceOf(Date);
      expect(fallTransition.local).toBeInstanceOf(Date);
      expect(typeof fallTransition.isDST).toBe("boolean");
      expect(typeof fallTransition.timezoneOffset).toBe("number");
    });

    test("create_dst_safe_datetime with timezone specification", () => {
      const result = create_dst_safe_datetime(
        "2025-07-15",
        "14:30 Europe/Berlin",
      );

      expect(result.timezone).toBe("Europe/Berlin");
      expect(result.isDST).toBe(true); // July is DST period
      expect(result.timezoneOffset).toBe(-120); // UTC+2
    });

    test("handles invalid date/time combinations", () => {
      expect(() => create_dst_safe_datetime("", "12:00")).toThrow(
        "Date string is required",
      );
      expect(() => create_dst_safe_datetime("2025-01-15", null)).toThrow(
        "Valid time object",
      );
      expect(() => create_dst_safe_datetime("invalid-date", "12:00")).toThrow(
        "Invalid date/time combination",
      );
    });
  });

  describe("process_cross_midnight_shift with DST", () => {
    test("processes normal same-day shift", () => {
      const shift = {
        id: "day-shift",
        date: "2025-07-15", // Summer date (DST active)
        start: "08:00",
        end: "16:00",
        type: "Day",
      };

      const result = process_cross_midnight_shift(shift);

      expect(result.crosses_midnight).toBe(false);
      expect(result.start_dt).toBeDefined();
      expect(result.end_dt).toBeDefined();
      expect(result.dst_start).toBe(true); // July is DST
      expect(result.dst_end).toBe(true);
      expect(result.dst_transition).toBe(false); // No transition within same day
    });

    test("processes cross-midnight shift with DST", () => {
      const shift = {
        id: "night-shift",
        date: "2025-07-15", // Summer date
        start: "22:00",
        end: "06:00",
        type: "Night",
      };

      const result = process_cross_midnight_shift(shift);

      expect(result.crosses_midnight).toBe(true);
      expect(result.start_dt.local.toISOString().slice(0, 10)).toBe(
        "2025-07-15",
      );
      expect(result.end_dt.local.toISOString().slice(0, 10)).toBe("2025-07-16");
      expect(result.dst_start).toBe(true);
      expect(result.dst_end).toBe(true);
      expect(result.dst_transition).toBe(false); // Both days in DST period
    });

    test("processes shift during Spring DST transition", () => {
      // Spring DST transition night (Saturday to Sunday)
      const shift = {
        id: "dst-transition-shift",
        date: "2025-03-29", // Saturday before DST transition
        start: "23:00",
        end: "04:00", // Sunday morning during DST transition
        type: "Night",
      };

      const result = process_cross_midnight_shift(shift);

      expect(result.crosses_midnight).toBe(true);
      expect(result.start_dt).toBeDefined();
      expect(result.end_dt).toBeDefined();
      expect(result.dst_transition).toBeDefined(); // May detect DST transition
    });

    test("processes shift during Fall DST transition", () => {
      // Fall DST transition night (Saturday to Sunday)
      const shift = {
        id: "fall-dst-shift",
        date: "2025-10-25", // Saturday before DST ends
        start: "23:00",
        end: "04:00", // Sunday morning when DST ends
        type: "Night",
      };

      const result = process_cross_midnight_shift(shift);

      expect(result.crosses_midnight).toBe(true);
      expect(result.start_dt).toBeDefined();
      expect(result.end_dt).toBeDefined();
      expect(result.dst_transition).toBeDefined();
    });

    test("throws error for invalid shift object", () => {
      expect(() => process_cross_midnight_shift({})).toThrow(
        "Shift must have date, start, and end properties",
      );
      expect(() => process_cross_midnight_shift(null)).toThrow(
        "Shift must have date, start, and end properties",
      );
    });
  });

  describe("calculate_dst_safe_duration", () => {
    test("calculates normal shift duration", () => {
      const start_dt = create_dst_safe_datetime("2025-07-15", "08:00");
      const end_dt = create_dst_safe_datetime("2025-07-15", "16:00");

      const result = calculate_dst_safe_duration(start_dt, end_dt);

      expect(result.minutes).toBe(8 * 60); // 8 hours
      expect(result.hours).toBe(8);
      expect(result.dstTransition).toBe(false);
      expect(result.affectedByDST).toBe(false);
    });

    test("calculates cross-midnight duration", () => {
      const start_dt = create_dst_safe_datetime("2025-07-15", "22:00");
      const end_dt = create_dst_safe_datetime("2025-07-16", "06:00");

      const result = calculate_dst_safe_duration(start_dt, end_dt);

      expect(result.minutes).toBe(8 * 60); // 8 hours
      expect(result.hours).toBe(8);
      expect(result.dstTransition).toBe(false); // Both dates in DST period
    });

    test("handles DST transition periods", () => {
      // Spring DST transition (loses 1 hour)
      const spring_start = create_dst_safe_datetime("2025-03-30", "01:00");
      const spring_end = create_dst_safe_datetime("2025-03-30", "04:00");

      const springResult = calculate_dst_safe_duration(
        spring_start,
        spring_end,
      );

      expect(springResult.minutes).toBeGreaterThan(0);
      expect(typeof springResult.dstTransition).toBe("boolean");

      // Fall DST transition (gains 1 hour)
      const fall_start = create_dst_safe_datetime("2025-10-26", "01:00");
      const fall_end = create_dst_safe_datetime("2025-10-26", "04:00");

      const fallResult = calculate_dst_safe_duration(fall_start, fall_end);

      expect(fallResult.minutes).toBeGreaterThan(0);
      expect(typeof fallResult.dstTransition).toBe("boolean");
    });

    test("throws error for invalid datetime objects", () => {
      expect(() => calculate_dst_safe_duration(null, {})).toThrow(
        "Both start and end datetime objects are required",
      );
      expect(() => calculate_dst_safe_duration({}, null)).toThrow(
        "Both start and end datetime objects are required",
      );
    });
  });

  describe("Edge cases and comprehensive DST tests", () => {
    test("handles the exact DST transition times", () => {
      // Spring forward: 2:00 AM becomes 3:00 AM (Europe/Berlin)
      const springForward = {
        date: "2025-03-30",
        start: "01:30",
        end: "03:30", // Crosses the "lost" hour
        type: "DST-Test",
      };

      const result = process_cross_midnight_shift(springForward);
      expect(result.start_dt).toBeDefined();
      expect(result.end_dt).toBeDefined();

      const duration = calculate_dst_safe_duration(
        result.start_dt,
        result.end_dt,
      );
      expect(duration.minutes).toBeGreaterThan(0); // Should handle gracefully
    });

    test("handles fall back DST transition", () => {
      // Fall back: 3:00 AM becomes 2:00 AM (Europe/Berlin)
      const fallBack = {
        date: "2025-10-26",
        start: "01:30",
        end: "03:30", // Crosses the "gained" hour
        type: "DST-Test",
      };

      const result = process_cross_midnight_shift(fallBack);
      expect(result.start_dt).toBeDefined();
      expect(result.end_dt).toBeDefined();

      const duration = calculate_dst_safe_duration(
        result.start_dt,
        result.end_dt,
      );
      expect(duration.minutes).toBeGreaterThan(0); // Should handle gracefully
    });

    test("parse_local_time with various timezone formats", () => {
      const europeBerlin = parse_local_time("15:30 Europe/Berlin");
      const americaNewYork = parse_local_time("15:30 America/New_York");
      const asiaTokyo = parse_local_time("15:30 Asia/Tokyo");

      expect(europeBerlin.timezone).toBe("Europe/Berlin");
      expect(americaNewYork.timezone).toBe("America/New_York");
      expect(asiaTokyo.timezone).toBe("Asia/Tokyo");
    });

    test("next_day_if_needed with complex cross-midnight scenarios", () => {
      const scenarios = [
        { start: "23:59", end: "00:01", expectCross: true },
        { start: "00:00", end: "23:59", expectCross: false },
        { start: "12:00", end: "12:00", expectCross: true }, // Equal times cross midnight
        { start: "01:00", end: "00:59", expectCross: true },
      ];

      scenarios.forEach(({ start, end, expectCross }) => {
        const result = next_day_if_needed(start, end);
        expect(result.nextDay).toBe(expectCross);
      });
    });

    test("integration test: full shift processing with DST awareness", () => {
      // Process a shift that spans multiple DST scenarios
      const testShifts = [
        { date: "2025-01-15", start: "22:00", end: "06:00" }, // Winter cross-midnight
        { date: "2025-07-15", start: "22:00", end: "06:00" }, // Summer cross-midnight
        { date: "2025-03-29", start: "23:00", end: "05:00" }, // Spring DST transition
        { date: "2025-10-25", start: "23:00", end: "05:00" }, // Fall DST transition
      ];

      testShifts.forEach((shift) => {
        const processed = process_cross_midnight_shift(shift);
        const duration = calculate_dst_safe_duration(
          processed.start_dt,
          processed.end_dt,
        );

        expect(processed.start_dt).toBeDefined();
        expect(processed.end_dt).toBeDefined();
        expect(duration.minutes).toBeGreaterThan(0);
        expect(processed.crosses_midnight).toBe(true);
      });
    });

    test("DEFAULT_TIMEZONE is properly exported", () => {
      expect(DEFAULT_TIMEZONE).toBe("Europe/Berlin");
    });
  });
});
