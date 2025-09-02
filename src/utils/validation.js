// Lightweight runtime validators used in dev/test to surface silent data issues early.
/* global process */
// These are intentionally permissive in production (no throws) to avoid user disruption.

const REQUIRED_SHIFT_FIELDS = [
  "id",
  "date",
  "type",
  "start",
  "end",
  "status",
  "assignedTo",
  "workLocation",
  "conflicts",
];

// Cache environment check for performance
const IS_PRODUCTION =
  (typeof process !== "undefined" && process?.env?.NODE_ENV) === "production";

export function validateShiftObject(
  obj,
  { log = (msg) => console.warn(msg) } = {},
) {
  // intentional console for dev diagnostics
  if (!obj || typeof obj !== "object") return false;

  let ok = true;
  const objId = obj.id || "<no-id>";

  // Check required fields in single loop
  for (const field of REQUIRED_SHIFT_FIELDS) {
    if (!(field in obj)) {
      ok = false;
      if (!IS_PRODUCTION) {
        log(`Shift validation: missing field "${field}" on ${objId}`);
      }
    }
  }

  // Validate conflicts field type
  if (ok && !Array.isArray(obj.conflicts)) {
    ok = false;
    if (!IS_PRODUCTION) {
      log(`Shift validation: conflicts must be array on ${objId}`);
    }
  }

  return ok;
}

export function validateShiftArray(arr, { log } = {}) {
  if (!Array.isArray(arr)) return [];

  // Use for loop for better performance than filter + arrow function
  const validShifts = [];
  for (const shift of arr) {
    if (validateShiftObject(shift, { log })) {
      validShifts.push(shift);
    }
  }
  return validShifts;
}
