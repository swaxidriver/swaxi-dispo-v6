import {
  createAuditEntry,
  computeChanges,
  formatAuditForCSV,
  getAuditCSVHeaders,
} from "./audit-log.js";

describe("Backend Audit Log Utilities", () => {
  test("createAuditEntry generates proper audit entry", () => {
    const beforeState = { name: "Old Name", active: true };
    const afterState = { name: "New Name", active: false };

    const entry = createAuditEntry(
      "template_updated",
      "template",
      "template-123",
      beforeState,
      afterState,
      "User requested change",
    );

    expect(entry.action).toBe("template_updated");
    expect(entry.entityType).toBe("template");
    expect(entry.entityId).toBe("template-123");
    expect(entry.reason).toBe("User requested change");
    expect(entry.before).toBe(JSON.stringify(beforeState));
    expect(entry.after).toBe(JSON.stringify(afterState));
    expect(entry.changes).toHaveLength(2);
    expect(entry.changes[0].field).toBe("name");
    expect(entry.changes[1].field).toBe("active");
  });

  test("computeChanges correctly identifies field changes", () => {
    const before = {
      id: "1",
      name: "Original",
      status: "draft",
      count: 5,
      created_at: "2024-01-01",
    };
    const after = {
      id: "1",
      name: "Updated",
      status: "active",
      count: 5,
      updated_at: "2024-01-02",
    };

    const changes = computeChanges(before, after);

    // Should find 2 changes (name and status), ignoring id and timestamp fields
    expect(changes).toHaveLength(2);

    const nameChange = changes.find((c) => c.field === "name");
    expect(nameChange.before).toBe("Original");
    expect(nameChange.after).toBe("Updated");

    const statusChange = changes.find((c) => c.field === "status");
    expect(statusChange.before).toBe("draft");
    expect(statusChange.after).toBe("active");

    // Should not include unchanged field (count) or metadata fields (id, timestamps)
    expect(changes.find((c) => c.field === "count")).toBeUndefined();
    expect(changes.find((c) => c.field === "id")).toBeUndefined();
    expect(changes.find((c) => c.field === "created_at")).toBeUndefined();
  });

  test("formatAuditForCSV prepares data for CSV export", () => {
    const auditEntries = [
      {
        timestamp: "2024-01-01T10:00:00Z",
        action: "template_updated",
        entityType: "template",
        entityId: "temp-1",
        actor: "user@example.com",
        role: "admin",
        changes: [
          { field: "name", before: "Old", after: "New" },
          { field: "active", before: true, after: false },
        ],
        reason: "User request",
        count: 1,
      },
    ];

    const csvData = formatAuditForCSV(auditEntries);

    expect(csvData).toHaveLength(1);
    const row = csvData[0];

    expect(row.timestamp).toBe("2024-01-01T10:00:00Z");
    expect(row.action).toBe("template_updated");
    expect(row.entityType).toBe("template");
    expect(row.actor).toBe("user@example.com");
    expect(row.changedFields).toBe("name, active");
    expect(row.changeDetails).toBe("name: Old → New; active: true → false");
    expect(row.reason).toBe("User request");
  });

  test("getAuditCSVHeaders returns correct headers", () => {
    const headers = getAuditCSVHeaders();

    expect(headers).toContain("timestamp");
    expect(headers).toContain("action");
    expect(headers).toContain("entityType");
    expect(headers).toContain("actor");
    expect(headers).toContain("changedFields");
    expect(headers).toContain("changeDetails");
    expect(headers).toContain("reason");
  });
});
