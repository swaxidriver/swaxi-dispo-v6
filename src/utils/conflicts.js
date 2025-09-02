// Conflict code mapping & helper presentation utilities
// Codes originate from computeShiftConflicts in shifts.js

export const CONFLICT_LABELS = Object.freeze({
  TIME_OVERLAP: "Zeitüberlappung",
  DOUBLE_APPLICATION: "Doppelte Bewerbung",
  ASSIGNMENT_COLLISION: "Zuweisungs-Kollision",
  LOCATION_MISMATCH: "Standort-Konflikt",
  SHORT_TURNAROUND: "Kurze Pause",
});

// Conflict severity levels - warnings vs hard blocks
export const CONFLICT_SEVERITY = Object.freeze({
  WARNING: "WARNING",
  BLOCKING: "BLOCKING",
});

export const CONFLICT_SEVERITIES = Object.freeze({
  TIME_OVERLAP: CONFLICT_SEVERITY.BLOCKING,
  DOUBLE_APPLICATION: CONFLICT_SEVERITY.WARNING,
  ASSIGNMENT_COLLISION: CONFLICT_SEVERITY.BLOCKING,
  LOCATION_MISMATCH: CONFLICT_SEVERITY.WARNING,
  SHORT_TURNAROUND: CONFLICT_SEVERITY.WARNING,
});

export function getConflictSeverity(conflictCode) {
  return CONFLICT_SEVERITIES[conflictCode] || CONFLICT_SEVERITY.WARNING;
}

export function categorizeConflicts(conflictCodes = []) {
  const warnings = [];
  const blocking = [];

  for (const code of conflictCodes) {
    if (getConflictSeverity(code) === CONFLICT_SEVERITY.BLOCKING) {
      blocking.push(code);
    } else {
      warnings.push(code);
    }
  }

  return { warnings, blocking };
}

export function describeConflicts(codes = []) {
  return codes.map((c) => CONFLICT_LABELS[c] || c);
}

export function firstConflictTooltip(codes = []) {
  if (!codes.length) return "";
  const labels = describeConflicts(codes);
  return labels.join(", ");
}
