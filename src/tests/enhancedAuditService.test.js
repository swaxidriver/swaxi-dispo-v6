import AuditService from "../services/auditService";

describe("Enhanced AuditService - Before/After Tracking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test("logs audit entries with before/after states correctly", () => {
    const beforeState = { id: "1", name: "Original Name", status: "draft" };
    const afterState = { id: "1", name: "Updated Name", status: "active" };

    const entry = AuditService.logActionWithStates(
      "Template updated",
      "test@example.com",
      "admin",
      beforeState,
      afterState,
      "User requested update",
    );

    expect(entry).toBeTruthy();
    expect(entry.action).toBe("Template updated");
    expect(entry.actor).toBe("test@example.com");
    expect(entry.role).toBe("admin");
    expect(entry.reason).toBe("User requested update");
    expect(entry.before).toBe(JSON.stringify(beforeState));
    expect(entry.after).toBe(JSON.stringify(afterState));
    expect(entry.details).toContain("name: Original Name → Updated Name");
    expect(entry.details).toContain("status: draft → active");
  });

  test("exports CSV format correctly", () => {
    // Log some test entries
    AuditService.logAction(
      "Test action 1",
      "user1@example.com",
      "admin",
      { detail: "test" },
      1,
    );
    AuditService.logActionWithStates(
      "Template updated",
      "user2@example.com",
      "chief",
      { name: "Old Name" },
      { name: "New Name" },
      "Update reason",
    );

    // Mock DOM APIs that are used in the CSV export
    const mockClick = jest.fn();
    const mockElement = {
      href: "",
      download: "",
      click: mockClick,
    };

    // Mock document.createElement
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn().mockReturnValue(mockElement);

    // Mock document.body methods
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    // Mock URL methods
    const originalURL = window.URL;
    window.URL = {
      createObjectURL: jest.fn().mockReturnValue("mock-url"),
      revokeObjectURL: jest.fn(),
    };

    // Mock Blob
    const originalBlob = window.Blob;
    window.Blob = jest.fn();

    const result = AuditService.exportLogsAsCSV();

    // Verify the result
    expect(result.entriesExported).toBe(2);
    expect(result.format).toBe("CSV");
    expect(mockClick).toHaveBeenCalled();

    // Restore original functions
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    window.URL = originalURL;
    window.Blob = originalBlob;
  });

  test("logCurrentUserActionWithStates works with current user context", () => {
    // Set up mock auth data
    localStorage.setItem(
      "swaxi-auth",
      JSON.stringify({
        user: { email: "current@example.com", role: "admin" },
      }),
    );

    const beforeState = { value: "old" };
    const afterState = { value: "new" };

    const entry = AuditService.logCurrentUserActionWithStates(
      "Test update",
      beforeState,
      afterState,
      "Test reason",
    );

    expect(entry.actor).toBe("current@example.com");
    expect(entry.role).toBe("admin");
    expect(entry.reason).toBe("Test reason");
  });
});
