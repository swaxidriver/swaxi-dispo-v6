// Conflict code mapping & helper presentation utilities
// Codes originate from computeShiftConflicts in shifts.js

export const CONFLICT_LABELS = Object.freeze({
  TIME_OVERLAP: "Zeitüberlappung",
  DOUBLE_APPLICATION: "Doppelte Bewerbung",
  ASSIGNMENT_COLLISION: "Zuweisungs-Kollision",
  LOCATION_MISMATCH: "Standort-Konflikt",
});

export function describeConflicts(codes = []) {
  return codes.map((c) => CONFLICT_LABELS[c] || c);
}

export function firstConflictTooltip(codes = []) {
  if (!codes.length) return "";
  const labels = describeConflicts(codes);
  return labels.join(", ");
}
