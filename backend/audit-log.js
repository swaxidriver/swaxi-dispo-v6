/**
 * Backend Audit Log Utilities
 *
 * Provides server-side audit logging utilities for template and assignment operations.
 * Designed to work alongside the client-side audit service.
 */

/**
 * Generate a standardized audit entry for before/after changes
 * @param {string} action - The action performed (e.g., 'template_updated', 'assignment_created')
 * @param {string} entityType - Type of entity ('template', 'assignment', 'shift_instance')
 * @param {string} entityId - ID of the entity being modified
 * @param {Object} beforeState - State before the change
 * @param {Object} afterState - State after the change
 * @param {string} reason - Optional reason for the change
 * @returns {Object} Standardized audit entry
 */
export function createAuditEntry(
  action,
  entityType,
  entityId,
  beforeState,
  afterState,
  reason = null,
) {
  const timestamp = new Date().toISOString();

  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp,
    action,
    entityType,
    entityId,
    before: beforeState ? JSON.stringify(beforeState) : null,
    after: afterState ? JSON.stringify(afterState) : null,
    reason,
    changes: computeChanges(beforeState, afterState),
  };
}

/**
 * Compute what fields changed between before and after states
 * @param {Object} before - State before change
 * @param {Object} after - State after change
 * @returns {Array} Array of changed fields with before/after values
 */
export function computeChanges(before, after) {
  if (!before || !after) return [];

  const changes = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    // Skip metadata fields
    if (["id", "created_at", "updated_at"].includes(key)) continue;

    const beforeValue = before[key];
    const afterValue = after[key];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push({
        field: key,
        before: beforeValue,
        after: afterValue,
      });
    }
  }

  return changes;
}

/**
 * Format audit data for CSV export
 * @param {Array} auditEntries - Array of audit entries
 * @returns {Array} Array of CSV-ready objects
 */
export function formatAuditForCSV(auditEntries) {
  return auditEntries.map((entry) => {
    const changes = entry.changes || [];
    const changedFields = changes.map((c) => c.field).join(", ");
    const changeDetails = changes
      .map((c) => `${c.field}: ${c.before} → ${c.after}`)
      .join("; ");

    return {
      timestamp: entry.timestamp,
      action: entry.action,
      entityType: entry.entityType || "unknown",
      entityId: entry.entityId || "unknown",
      actor: entry.actor || "unknown",
      role: entry.role || "unknown",
      changedFields,
      changeDetails,
      reason: entry.reason || "",
      count: entry.count || 1,
    };
  });
}

/**
 * Create CSV headers for audit export
 * @returns {Array} CSV headers
 */
export function getAuditCSVHeaders() {
  return [
    "timestamp",
    "action",
    "entityType",
    "entityId",
    "actor",
    "role",
    "changedFields",
    "changeDetails",
    "reason",
    "count",
  ];
}

/**
 * Validate audit entry structure
 * @param {Object} entry - Audit entry to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validateAuditEntry(entry) {
  const errors = [];

  if (!entry.action) errors.push("action is required");
  if (!entry.timestamp) errors.push("timestamp is required");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default {
  createAuditEntry,
  computeChanges,
  formatAuditForCSV,
  getAuditCSVHeaders,
  validateAuditEntry,
};
