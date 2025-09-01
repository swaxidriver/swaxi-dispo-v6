import {
  formatDateTime,
  formatTime,
  formatDate,
  getWeekdayName,
  getMonthName,
} from "../utils/i18n-time-utils";

describe("i18n-time-utils", () => {
  const testDate = new Date("2024-03-15T14:30:00Z"); // Friday, March 15, 2024, 14:30 UTC

  describe("formatDateTime", () => {
    it("should format with German locale and 24h format by default", () => {
      const result = formatDateTime(testDate, {
        language: "de",
        timeFormat: "24h",
      });
      expect(result).toMatch(/15\.03\.2024/); // German date format
      expect(result).toMatch(/\d{2}:\d{2}/); // 24h time format
    });

    it("should format with English locale and AM/PM format", () => {
      const result = formatDateTime(testDate, {
        language: "en",
        timeFormat: "ampm",
      });
      expect(result).toMatch(/3\/15\/2024/); // US date format
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/); // 12h time format
    });

    it("should handle date only formatting", () => {
      const result = formatDateTime(testDate, {
        language: "de",
        includeTime: false,
      });
      expect(result).toBe("15.03.2024");
    });

    it("should handle time only formatting", () => {
      const result = formatDateTime(testDate, {
        language: "de",
        timeFormat: "24h",
        includeDate: false,
      });
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("formatTime", () => {
    it("should format time only in 24h format", () => {
      const result = formatTime(testDate, {
        language: "de",
        timeFormat: "24h",
      });
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it("should format time only in 12h format", () => {
      const result = formatTime(testDate, {
        language: "en",
        timeFormat: "ampm",
      });
      expect(result).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/);
    });
  });

  describe("formatDate", () => {
    it("should format date only in German format", () => {
      const result = formatDate(testDate, { language: "de" });
      expect(result).toBe("15.03.2024");
    });

    it("should format date only in US format", () => {
      const result = formatDate(testDate, { language: "en" });
      expect(result).toBe("03/15/2024"); // Browser adds leading zeros
    });
  });

  describe("getWeekdayName", () => {
    it("should return German weekday names", () => {
      expect(getWeekdayName(testDate, "de")).toBe("Freitag");
      expect(getWeekdayName(testDate, "de", true)).toBe("Fr"); // Browser doesn't add period
    });

    it("should return English weekday names", () => {
      expect(getWeekdayName(testDate, "en")).toBe("Friday");
      expect(getWeekdayName(testDate, "en", true)).toBe("Fri");
    });

    it("should work with day index", () => {
      expect(getWeekdayName(5, "de")).toBe("Freitag"); // Friday is day 5
      expect(getWeekdayName(1, "de")).toBe("Montag"); // Monday is day 1
    });
  });

  describe("getMonthName", () => {
    it("should return German month names", () => {
      expect(getMonthName(testDate, "de")).toBe("März");
      expect(getMonthName(testDate, "de", true)).toBe("Mär");
    });

    it("should return English month names", () => {
      expect(getMonthName(testDate, "en")).toBe("March");
      expect(getMonthName(testDate, "en", true)).toBe("Mar");
    });

    it("should work with month index", () => {
      expect(getMonthName(2, "de")).toBe("März"); // March is month 2 (0-indexed)
      expect(getMonthName(0, "de")).toBe("Januar"); // January is month 0
    });
  });

  describe("edge cases", () => {
    it("should handle null/undefined dates gracefully", () => {
      expect(formatDateTime(null)).toBe("");
      expect(formatDateTime(undefined)).toBe("");
      expect(formatTime(null)).toBe("");
      expect(formatDate(null)).toBe("");
    });

    it("should default to German locale for invalid language", () => {
      const result = formatDateTime(testDate, { language: "invalid" });
      expect(result).toMatch(/15\.03\.2024/); // Should default to German format
    });
  });
});
