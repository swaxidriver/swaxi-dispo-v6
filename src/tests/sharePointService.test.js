import { SharePointService } from "../services/sharePointService";

// Preserve originals
const originalFetch = globalThis.fetch;

function mockFetchSequence(responses) {
  let call = 0;
  globalThis.fetch = jest.fn(() => {
    const r = responses[Math.min(call, responses.length - 1)];
    call++;
    if (r instanceof Error) return Promise.reject(r);
    return Promise.resolve({
      ok: r.ok !== false,
      status: r.status || 200,
      json: async () => r.json || {},
    });
  });
}

describe("SharePointService", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {}); // silence expected error logs
    localStorage.clear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error.mockRestore();
    localStorage.clear();
  });

  // Success path: getShifts returns transformed data
  test("getShifts returns transformed data on success", async () => {
    const sample = {
      Id: 1,
      ShiftDate: "2025-08-26T00:00:00.000Z",
      StartTime: "08:00",
      EndTime: "12:00",
      ShiftType: "Morning",
      Status: "open",
      AssignedTo: null,
      WorkLocation: "office",
      Conflicts: "[]",
      Created: "2025-08-26T00:00:00.000Z",
      Modified: "2025-08-26T00:00:00.000Z",
    };
    mockFetchSequence([{ json: { d: { results: [sample] } } }]);
    const svc = new SharePointService();
    const shifts = await svc.getShifts();
    expect(shifts).toHaveLength(1);
    expect(shifts[0].id).toBe(1);
    expect(shifts[0].type).toBe("Morning");
  });

  // Fallback path: network error -> localStorage
  test("getShifts falls back to localStorage on fetch error", async () => {
    localStorage.setItem(
      "swaxi-dispo-state",
      JSON.stringify({ shifts: [{ id: 5 }] }),
    );
    mockFetchSequence([new Error("network")]);
    const svc = new SharePointService();
    const shifts = await svc.getShifts();
    expect(shifts[0].id).toBe(5);
  });

  // Success path: createShift posts and returns transformed entry
  test("createShift returns transformed shift on success", async () => {
    const newShift = {
      date: "2025-08-26T00:00:00.000Z",
      start: "09:00",
      end: "13:00",
      type: "Day",
      status: "open",
      workLocation: "office",
      conflicts: [],
    };
    mockFetchSequence([
      {
        json: {
          d: { GetContextWebInformation: { FormDigestValue: "TOKEN123" } },
        },
      }, // token
      {
        json: {
          d: {
            Id: 10,
            ShiftDate: newShift.date,
            StartTime: "09:00",
            EndTime: "13:00",
            ShiftType: "Day",
            Status: "open",
            WorkLocation: "office",
            Conflicts: "[]",
            Created: newShift.date,
            Modified: newShift.date,
          },
        },
      },
    ]);
    const svc = new SharePointService();
    const created = await svc.createShift(newShift);
    expect(created.id).toBe(10);
    expect(created.type).toBe("Day");
  });

  // Fallback path: token fetch fails
  test("createShift fallback to localStorage on failing token fetch", async () => {
    mockFetchSequence([new Error("contextinfo fail")]);
    const svc = new SharePointService();
    const shift = await svc.createShift({
      date: new Date().toISOString(),
      start: "08:00",
      end: "12:00",
      type: "Morning",
      status: "open",
      workLocation: "office",
      conflicts: [],
    });
    expect(shift.id).toBeDefined();
  });

  // Availability true path
  test("isSharePointAvailable returns true when response ok", async () => {
    mockFetchSequence([{ ok: true, json: {} }]);
    const svc = new SharePointService();
    const ok = await svc.isSharePointAvailable();
    expect(ok).toBe(true);
  });

  // Availability false path
  test("isSharePointAvailable returns false on error", async () => {
    mockFetchSequence([new Error("nope")]);
    const svc = new SharePointService();
    const ok = await svc.isSharePointAvailable();
    expect(ok).toBe(false);
  });

  // updateShift success path
  test("updateShift returns success on successful update", async () => {
    mockFetchSequence([
      {
        json: {
          d: { GetContextWebInformation: { FormDigestValue: "TOKEN456" } },
        },
      }, // token
      { ok: true }, // update response
    ]);
    const svc = new SharePointService();
    const result = await svc.updateShift(1, { status: "assigned" });
    expect(result.success).toBe(true);
  });

  // updateShift fallback path
  test("updateShift falls back to localStorage on error", async () => {
    localStorage.setItem(
      "swaxi-dispo-state",
      JSON.stringify({ shifts: [{ id: 1, status: "open" }] }),
    );
    mockFetchSequence([new Error("update fail")]);
    const svc = new SharePointService();
    const result = await svc.updateShift(1, { status: "assigned" });
    expect(result.success).toBe(true);
  });

  // getUsers success path
  test("getUsers returns transformed users on success", async () => {
    const sampleUser = {
      Id: 1,
      Title: "Test User",
      Email: "test@stadtwerke.de",
      Role: "disponent",
      Active: true,
      Created: "2025-08-26T00:00:00.000Z",
    };
    mockFetchSequence([{ json: { d: { results: [sampleUser] } } }]);
    const svc = new SharePointService();
    const users = await svc.getUsers();
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe("Test User");
    expect(users[0].email).toBe("test@stadtwerke.de");
  });

  // getUsers fallback path
  test("getUsers falls back to localStorage on error", async () => {
    mockFetchSequence([new Error("users fail")]);
    const svc = new SharePointService();
    const users = await svc.getUsers();
    expect(users).toHaveLength(3); // default demo users
    expect(users[0].role).toBe("admin");
  });

  // logAudit success path
  test("logAudit logs to SharePoint on success", async () => {
    mockFetchSequence([
      {
        json: {
          d: { GetContextWebInformation: { FormDigestValue: "TOKEN789" } },
        },
      }, // token
      { ok: true }, // audit log response
    ]);
    const svc = new SharePointService();
    // This method doesn't return anything, so we just verify it doesn't throw
    await expect(
      svc.logAudit("shift_created", { shiftId: 1 }),
    ).resolves.toBeUndefined();
  });

  // logAudit fallback path
  test("logAudit falls back gracefully on error", async () => {
    mockFetchSequence([new Error("audit fail")]);
    const svc = new SharePointService();
    // This method should handle errors gracefully and not throw
    await expect(
      svc.logAudit("shift_updated", { shiftId: 2 }),
    ).resolves.toBeUndefined();
  });

  // getCurrentUserEmail method
  test("getCurrentUserEmail returns stored email or default", () => {
    const svc = new SharePointService();
    // Test default case
    expect(svc.getCurrentUserEmail()).toBe("dev@stadtwerke-augsburg.de");

    // Test with stored email
    localStorage.setItem("current-user-email", "user@test.de");
    expect(svc.getCurrentUserEmail()).toBe("user@test.de");
  });

  // getUsersFromLocalStorage method
  test("getUsersFromLocalStorage returns demo users", () => {
    const svc = new SharePointService();
    const users = svc.getUsersFromLocalStorage();
    expect(users).toHaveLength(3);
    expect(users[0].name).toBe("Admin User");
    expect(users[1].role).toBe("chief");
    expect(users[2].role).toBe("disponent");
  });
});
