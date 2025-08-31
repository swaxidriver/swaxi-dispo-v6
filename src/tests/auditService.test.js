import AuditService from "../services/auditService";

describe("AuditService", () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof window !== "undefined") window.__auditCalls = [];
  });

  test("logAction stores entry and enforces ring buffer", () => {
    for (let i = 0; i < 1010; i++) {
      AuditService.logAction(
        `shift_created_${i}`,
        "tester@example.com",
        "admin",
        { i },
      );
    }
    const logs = AuditService.getLogs();
    expect(logs.length).toBe(1000);
    const first = logs[0];
    expect(first.details).not.toContain('"i":0');
  });

  test("action type categorization (EN + DE)", () => {
    expect(AuditService.getActionType("Created shift")).toBe("create");
    expect(AuditService.getActionType("Schicht erstellt")).toBe("create");
    expect(AuditService.getActionType("Updated shift")).toBe("update");
    expect(AuditService.getActionType("Schicht geändert")).toBe("update");
    expect(AuditService.getActionType("Deleted shift")).toBe("delete");
    expect(AuditService.getActionType("Schicht gelöscht")).toBe("delete");
    expect(AuditService.getActionType("Applied for shift")).toBe("apply");
    expect(AuditService.getActionType("Bewerbung eingereicht")).toBe("apply");
    expect(AuditService.getActionType("Random action")).toBe("other");
  });

  test("filtered logs by type", () => {
    AuditService.logAction("Created shift", "u", "admin", {});
    AuditService.logAction("Updated shift", "u", "admin", {});
    AuditService.logAction("Applied for shift", "u", "admin", {});
    expect(AuditService.getFilteredLogs("create").length).toBe(1);
    expect(AuditService.getFilteredLogs("update").length).toBe(1);
    expect(AuditService.getFilteredLogs("apply").length).toBe(1);
  });

  test("logCurrentUserAction uses fallback context then auth context", () => {
    const e1 = AuditService.logCurrentUserAction("fallback_action");
    expect(e1.actor).toBeDefined();
    localStorage.setItem(
      "swaxi-auth",
      JSON.stringify({ user: { email: "test@example.com", role: "admin" } }),
    );
    const e2 = AuditService.logCurrentUserAction("auth_action");
    expect(e2.actor).toBe("test@example.com");
  });

  test("clearLogs empties storage", () => {
    AuditService.logAction("x", "a", "r", {});
    expect(AuditService.getLogs().length).toBe(1);
    AuditService.clearLogs();
    expect(AuditService.getLogs().length).toBe(0);
  });

  test("exportLogs returns metadata without throwing", () => {
    AuditService.logAction("x", "a", "r", {});
    const origCreate = document.createElement;
    const origCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = () => "blob:mock";
    document.createElement = (tag) => {
      const el = origCreate.call(document, tag);
      if (tag === "a") el.click = () => {};
      return el;
    };
    const data = AuditService.exportLogs();
    document.createElement = origCreate;
    URL.createObjectURL = origCreateObjectURL;
    expect(data).toHaveProperty("totalEntries", 1);
  });
});
