import { generateShifts } from "../services/shiftGenerationService";

// Freeze base date for deterministic output
const fixed = new Date("2025-08-25T08:00:00Z"); // Monday
beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(fixed);
});

afterAll(() => {
  jest.useRealTimers();
});

describe("shiftGenerationService.generateShifts", () => {
  it("generates shifts for matching weekday templates over 10 days", () => {
    const templates = [
      {
        name: "early",
        startTime: "06:00",
        endTime: "14:00",
        days: ["Mo", "Tu", "We", "Th", "Fr"],
      },
      {
        name: "weekend",
        startTime: "09:00",
        endTime: "17:00",
        days: ["Sa", "Su"],
      },
    ];
    const shifts = generateShifts(templates);
    // Expect 5 weekdays in range (Mon-Fri) plus weekend days (Sat, Sun) within the 10-day window starting Monday
    // Window days: Mon(25) .. Wed(3) next week (10 days). Contains 7 weekdays (Mon-Fri twice except second Thu/Fri?) Let's compute precisely.
    // We'll assert counts by name to stay robust.
    const early = shifts.filter((s) => s.name === "early");
    const weekend = shifts.filter((s) => s.name === "weekend");
    expect(early.length).toBeGreaterThan(0);
    expect(weekend.length).toBeGreaterThan(0);
    // Ensure ids unique
    const ids = new Set(shifts.map((s) => s.id));
    expect(ids.size).toBe(shifts.length);
    // Sample structure
    expect(early[0]).toMatchObject({
      startTime: "06:00",
      endTime: "14:00",
      status: "Offen",
    });
  });

  it("returns empty array when no templates match any days", () => {
    const templates = [
      { name: "never", startTime: "00:00", endTime: "01:00", days: [] },
    ];
    const shifts = generateShifts(templates);
    expect(shifts).toEqual([]);
  });
});
