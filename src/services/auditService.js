/**
 * Audit Service - Client-side audit logging
 * Uses localStorage with key 'swaxi.audit.v1'
 * Implements ring buffer to prevent storage overflow
 */

const AUDIT_STORAGE_KEY = "swaxi.audit.v1";
const MAX_AUDIT_ENTRIES = 1000; // Ring buffer size

export class AuditService {
  /**
   * Log an audit entry
   * @param {string} action - The action performed (e.g., 'shift_created', 'shift_updated')
   * @param {string} actor - Who performed the action (email or name)
   * @param {string} role - User role at time of action
   * @param {Object} details - Additional context/metadata
   * @param {number} count - Number of items affected (default: 1)
   */
  static logAction(action, actor, role, details = {}, count = 1) {
    try {
      const timestamp = new Date().toISOString();
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        action,
        actor,
        role,
        details:
          typeof details === "string" ? details : JSON.stringify(details),
        count,
        type: this.getActionType(action),
      };

      const logs = this.getLogs();
      logs.push(entry);

      // Implement ring buffer - keep only last MAX_AUDIT_ENTRIES
      if (logs.length > MAX_AUDIT_ENTRIES) {
        logs.splice(0, logs.length - MAX_AUDIT_ENTRIES);
      }

      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));

      // Also log to console for debugging
      console.log("Audit:", entry);

      return entry;
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      return null;
    }
  }

  /**
   * Get all audit logs
   * @returns {Array} Array of audit entries
   */
  static getLogs() {
    try {
      const logs = localStorage.getItem(AUDIT_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error("Failed to retrieve audit logs:", error);
      return [];
    }
  }

  /**
   * Get filtered audit logs
   * @param {string} filter - Filter by type ('all', 'create', 'update', 'delete', 'apply')
   * @returns {Array} Filtered audit entries
   */
  static getFilteredLogs(filter = "all") {
    const logs = this.getLogs();
    if (filter === "all") return logs;
    return logs.filter((log) => log.type === filter);
  }

  /**
   * Export audit logs as JSON
   * @returns {Object} Export data with metadata
   */
  static exportLogs() {
    const logs = this.getLogs();
    const exportData = {
      audit: logs,
      exportTime: new Date().toISOString(),
      version: "v6.5.0",
      totalEntries: logs.length,
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `swaxi-audit-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return exportData;
  }

  /**
   * Export audit logs as CSV
   * @returns {Object} Export data with metadata
   */
  static exportLogsAsCSV() {
    const logs = this.getLogs();

    // Convert audit logs to CSV format
    const csvData = logs.map((log) => {
      // Parse details if it's a JSON string
      let parsedDetails = "";
      try {
        const details =
          typeof log.details === "string"
            ? JSON.parse(log.details)
            : log.details;
        parsedDetails =
          typeof details === "object"
            ? Object.entries(details)
                .map(([k, v]) => `${k}: ${v}`)
                .join("; ")
            : String(details);
      } catch {
        parsedDetails = String(log.details || "");
      }

      return {
        timestamp: log.timestamp,
        action: log.action,
        actor: log.actor,
        role: log.role,
        type: log.type,
        count: log.count,
        details: parsedDetails,
        before: log.before || "",
        after: log.after || "",
        reason: log.reason || "",
      };
    });

    // Create CSV content
    const headers = [
      "timestamp",
      "action",
      "actor",
      "role",
      "type",
      "count",
      "details",
      "before",
      "after",
      "reason",
    ];
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header] || "");
            // Escape CSV values that contain commas or quotes
            return value.includes(",") || value.includes('"')
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    // Create downloadable file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `swaxi-audit-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      entriesExported: logs.length,
      exportTime: new Date().toISOString(),
      format: "CSV",
    };
  }

  /**
   * Clear all audit logs
   */
  static clearLogs() {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      console.log("Audit logs cleared");
    } catch (error) {
      console.error("Failed to clear audit logs:", error);
    }
  }

  /**
   * Get action type based on action string
   * @param {string} action - The action string
   * @returns {string} Type category
   */
  static getActionType(action) {
    const actionLower = action.toLowerCase();

    if (actionLower.includes("creat") || actionLower.includes("add")) {
      return "create";
    }
    if (
      actionLower.includes("updat") ||
      actionLower.includes("edit") ||
      actionLower.includes("modif")
    ) {
      return "update";
    }
    if (
      actionLower.includes("delet") ||
      actionLower.includes("remov") ||
      actionLower.includes("cancel")
    ) {
      return "delete";
    }
    if (actionLower.includes("appl") || actionLower.includes("request")) {
      return "apply";
    }

    return "other";
  }

  /**
   * Get current user context for audit logging
   * @returns {Object} User context
   */
  static getCurrentUserContext() {
    try {
      // Try to get from auth context in localStorage
      const authData = localStorage.getItem("swaxi-auth");
      if (authData) {
        const auth = JSON.parse(authData);
        return {
          actor: auth.user?.email || auth.user?.name || "Unknown User",
          role: auth.user?.role || "unknown",
        };
      }

      // Fallback
      return {
        actor: "System",
        role: "system",
      };
    } catch (error) {
      console.error("Failed to get user context for audit:", error);
      return {
        actor: "Unknown User",
        role: "unknown",
      };
    }
  }

  /**
   * Log an audit entry with before/after state tracking
   * @param {string} action - The action performed
   * @param {string} actor - Who performed the action
   * @param {string} role - User role at time of action
   * @param {Object} beforeState - State before the change
   * @param {Object} afterState - State after the change
   * @param {string} reason - Optional reason for the change
   * @param {number} count - Number of items affected
   * @returns {Object} The created audit entry
   */
  static logActionWithStates(
    action,
    actor,
    role,
    beforeState,
    afterState,
    reason = null,
    count = 1,
  ) {
    try {
      const timestamp = new Date().toISOString();
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        action,
        actor,
        role,
        before: beforeState ? JSON.stringify(beforeState) : null,
        after: afterState ? JSON.stringify(afterState) : null,
        reason,
        count,
        type: this.getActionType(action),
        details: this._formatChangeDetails(beforeState, afterState),
      };

      const logs = this.getLogs();
      logs.push(entry);

      // Implement ring buffer - keep only last MAX_AUDIT_ENTRIES
      if (logs.length > MAX_AUDIT_ENTRIES) {
        logs.splice(0, logs.length - MAX_AUDIT_ENTRIES);
      }

      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));

      // Also log to console for debugging
      console.log("Audit (with states):", entry);

      return entry;
    } catch (error) {
      console.error("Failed to log audit entry with states:", error);
      return null;
    }
  }

  /**
   * Format changes between before and after states for display
   * @param {Object} before - State before change
   * @param {Object} after - State after change
   * @returns {string} Formatted change details
   */
  static _formatChangeDetails(before, after) {
    if (!before || !after) return "";

    const changes = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      // Skip metadata fields
      if (["id", "created_at", "updated_at"].includes(key)) continue;

      const beforeValue = before[key];
      const afterValue = after[key];

      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes.push(`${key}: ${beforeValue} → ${afterValue}`);
      }
    }

    return changes.join(", ");
  }

  /**
   * Convenience method to log with current user context and before/after states
   * @param {string} action - The action performed
   * @param {Object} beforeState - State before the change
   * @param {Object} afterState - State after the change
   * @param {string} reason - Optional reason for the change
   * @param {number} count - Number of items affected
   */
  static logCurrentUserActionWithStates(
    action,
    beforeState,
    afterState,
    reason = null,
    count = 1,
  ) {
    const { actor, role } = this.getCurrentUserContext();
    return this.logActionWithStates(
      action,
      actor,
      role,
      beforeState,
      afterState,
      reason,
      count,
    );
  }

  /**
   * Convenience method to log with current user context
   * @param {string} action - The action performed
   * @param {Object} details - Additional context/metadata
   * @param {number} count - Number of items affected
   */
  static logCurrentUserAction(action, details = {}, count = 1) {
    const { actor, role } = this.getCurrentUserContext();
    return this.logAction(action, actor, role, details, count);
  }
}

export default AuditService;
