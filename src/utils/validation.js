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

export function validateShiftObject(
  obj,
  { log = (msg) => console.warn(msg) } = {},
) {
  // intentional console for dev diagnostics
  if (!obj || typeof obj !== "object") return false;
  let ok = true;
  const env =
    (typeof process !== "undefined" && process?.env?.NODE_ENV) || "development";
  for (const f of REQUIRED_SHIFT_FIELDS) {
    if (!(f in obj)) {
      ok = false;
      if (env !== "production")
        log(`Shift validation: missing field "${f}" on ${obj.id || "<no-id>"}`);
    }
  }
  if (ok && !Array.isArray(obj.conflicts)) {
    ok = false;
    if (env !== "production")
      log(`Shift validation: conflicts must be array on ${obj.id}`);
  }
  return ok;
}

export function validateShiftArray(arr, { log } = {}) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s) => validateShiftObject(s, { log }));
}
