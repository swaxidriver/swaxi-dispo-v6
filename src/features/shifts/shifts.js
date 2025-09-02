import {
  enhance_shift_with_datetime,
  is_overlap as is_datetime_overlap,
} from "../../utils/time-utils.js";

// (constants import not required here after refinement)

// --- Time & Conflict Utilities (P0-3 & P0-4) ---

// Normalize a time string HH:MM to minutes since midnight
export function toMinutes(t) {
  if (typeof t !== "string" || !/^[0-2]\d:[0-5]\d$/.test(t)) return NaN;
  if (t >= "24:00") return NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// Compute duration in minutes; supports over-midnight where end < start
export function computeDuration(start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  if (e >= s) return e - s;
  return 24 * 60 - s + e; // over midnight
}

// Determine if two shifts overlap in time (same day context) including over-midnight logic
export function overlaps(aStart, aEnd, bStart, bEnd) {
  const aS = toMinutes(aStart);
  const aE = toMinutes(aEnd);
  const bS = toMinutes(bStart);
  const bE = toMinutes(bEnd);
  if ([aS, aE, bS, bE].some(Number.isNaN)) return false;

  // Expand over-midnight shifts into [start, start+duration) on a 0..2880 minute timeline duplicating day
  function expand(s, e) {
    if (e >= s) return [[s, e]];
    // over-midnight: split into two segments
    return [
      [s, s + (24 * 60 - s)],
      [0, e],
    ];
  }
  const segA = expand(aS, aE);
  const segB = expand(bS, bE);
  return segA.some(([s1, e1]) => segB.some(([s2, e2]) => s1 < e2 && e1 > s2));
}

// Calculate minutes between end of first shift and start of second shift
export function minutesBetweenShifts(shiftA, shiftB) {
  // Use datetime-enhanced shifts if available for cross-midnight accuracy
  if (shiftA.start_dt && shiftA.end_dt && shiftB.start_dt && shiftB.end_dt) {
    const aEnd = shiftA.end_dt?.utc || new Date(shiftA.end_dt);
    const bStart = shiftB.start_dt?.utc || new Date(shiftB.start_dt);
    return Math.round((bStart - aEnd) / (1000 * 60));
  }

  // Legacy calculation for same-date shifts
  if (shiftA.date === shiftB.date) {
    const aEnd = toMinutes(shiftA.end);
    const bStart = toMinutes(shiftB.start);
    if (Number.isNaN(aEnd) || Number.isNaN(bStart)) return null;
    return bStart - aEnd;
  }

  // Different dates - enhance with datetime and calculate
  const enhancedA = enhance_shift_with_datetime(shiftA);
  const enhancedB = enhance_shift_with_datetime(shiftB);
  const aEnd = enhancedA.end_dt?.utc || new Date(enhancedA.end_dt);
  const bStart = enhancedB.start_dt?.utc || new Date(enhancedB.start_dt);
  return Math.round((bStart - aEnd) / (1000 * 60));
}

// Check if the gap between two shifts is considered a short turnaround
export function isShortTurnaround(shiftA, shiftB, minRestMinutes = 480) {
  // 8 hours default
  const minutes = minutesBetweenShifts(shiftA, shiftB);
  return minutes !== null && minutes >= 0 && minutes < minRestMinutes;
}

export const CONFLICT_CODES = Object.freeze({
  TIME_OVERLAP: "TIME_OVERLAP",
  DOUBLE_APPLICATION: "DOUBLE_APPLICATION",
  ASSIGNMENT_COLLISION: "ASSIGNMENT_COLLISION",
  LOCATION_MISMATCH: "LOCATION_MISMATCH",
  SHORT_TURNAROUND: "SHORT_TURNAROUND",
});

export function computeShiftConflicts(target, others, applications) {
  const conflicts = [];

  // Find overlapping shifts in a single pass
  const overlapping = [];
  for (const other of others) {
    if (detectShiftOverlap(target, other)) {
      overlapping.push(other);
    }
  }

  if (overlapping.length) {
    conflicts.push(CONFLICT_CODES.TIME_OVERLAP);

    // For efficiency, cache assignedTo checks since we'll use them multiple times
    const targetAssignedTo = target.assignedTo;
    const targetWorkLocation = target.workLocation;

    if (targetAssignedTo) {
      let hasAssignmentCollision = false;
      let hasLocationMismatch = false;

      // Check assignment collision and location mismatch in single loop
      for (const overlap of overlapping) {
        if (overlap.assignedTo === targetAssignedTo) {
          hasAssignmentCollision = true;
          if (
            (targetWorkLocation || overlap.workLocation) &&
            overlap.workLocation !== targetWorkLocation
          ) {
            hasLocationMismatch = true;
          }
        }
        if (hasAssignmentCollision && hasLocationMismatch) {
          break; // Found both conflicts, no need to continue
        }
      }

      if (hasAssignmentCollision)
        conflicts.push(CONFLICT_CODES.ASSIGNMENT_COLLISION);
      if (hasLocationMismatch) conflicts.push(CONFLICT_CODES.LOCATION_MISMATCH);
    }
  }

  // Check for short turnarounds with assigned shifts for the same person
  if (target.assignedTo) {
    const assignedToSamePerson = others.filter(
      (other) =>
        other.assignedTo === target.assignedTo &&
        other.status === "assigned" &&
        target.status === "assigned",
    );

    for (const other of assignedToSamePerson) {
      // Check both directions: target -> other and other -> target
      if (
        isShortTurnaround(target, other) ||
        isShortTurnaround(other, target)
      ) {
        conflicts.push(CONFLICT_CODES.SHORT_TURNAROUND);
        break; // Only add the conflict once
      }
    }
  }

  // DOUBLE_APPLICATION refined: if any user applied to target AND an overlapping shift
  if (applications?.length && overlapping.length) {
    const targetApps = applications.filter((a) => a.shiftId === target.id);
    if (targetApps.length) {
      const userIds = new Set(targetApps.map((a) => a.userId));
      const overlapIds = new Set(overlapping.map((o) => o.id));
      const double = applications.some(
        (a) => overlapIds.has(a.shiftId) && userIds.has(a.userId),
      );
      if (double) conflicts.push(CONFLICT_CODES.DOUBLE_APPLICATION);
    }
  }

  return conflicts;
}

export const checkShiftConflicts = (shift, existingShifts, applications) =>
  computeShiftConflicts(shift, existingShifts, applications);

/**
 * Enhanced overlap detection that handles both datetime-enhanced and legacy shifts
 * @param {Object} shiftA - First shift
 * @param {Object} shiftB - Second shift
 * @returns {boolean} True if shifts overlap
 */
export function detectShiftOverlap(shiftA, shiftB) {
  // If both shifts have datetime fields, use the enhanced overlap detection
  if (shiftA.start_dt && shiftA.end_dt && shiftB.start_dt && shiftB.end_dt) {
    const result = is_datetime_overlap(shiftA, shiftB);
    // Debug: uncomment for debugging
    // console.log(`Datetime overlap: ${shiftA.id} vs ${shiftB.id} = ${result}`)
    // console.log(`  A: ${shiftA.start_dt?.utc} → ${shiftA.end_dt?.utc}`)
    // console.log(`  B: ${shiftB.start_dt?.utc} → ${shiftB.end_dt?.utc}`)
    return result;
  }

  // For legacy shifts or mixed scenarios, first check if they're on the same date
  if (shiftA.date !== shiftB.date) {
    // Different dates - check if one is cross-midnight and overlaps with the other
    const enhancedA = shiftA.start_dt
      ? shiftA
      : enhance_shift_with_datetime(shiftA);
    const enhancedB = shiftB.start_dt
      ? shiftB
      : enhance_shift_with_datetime(shiftB);
    const result = is_datetime_overlap(enhancedA, enhancedB);
    // Debug: uncomment for debugging
    // console.log(`Cross-date overlap: ${shiftA.id} vs ${shiftB.id} = ${result}`)
    return result;
  }

  // Same date - use the original time-based overlap detection
  const result = overlaps(shiftA.start, shiftA.end, shiftB.start, shiftB.end);
  // Debug: uncomment for debugging
  // console.log(`Same-date overlap: ${shiftA.id} vs ${shiftB.id} = ${result}`)
  return result;
}

export const generateShiftTemplates = (startDate, daysToGenerate = 10) => {
  const shifts = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < daysToGenerate; i++) {
    const day = currentDate.getDay();
    const isWeekend = day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday

    if (isWeekend) {
      // Weekend shifts
      shifts.push({
        date: new Date(currentDate),
        type: "early",
        start: "11:45",
        end: "21:00",
      });
      shifts.push({
        date: new Date(currentDate),
        type: "night",
        start: "21:00",
        end: "05:30",
      });
    } else {
      // Weekday shifts
      shifts.push({
        date: new Date(currentDate),
        type: "evening",
        start: "17:45",
        end: "21:45",
      });
      shifts.push({
        date: new Date(currentDate),
        type: "night",
        start: "21:00",
        end: "05:30",
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return shifts;
};
