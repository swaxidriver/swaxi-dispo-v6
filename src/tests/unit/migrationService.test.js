import { MigrationService } from "../../services/migrationService";

// Mock db import
jest.mock("../../services/firebaseConfig", () => ({ db: {} }));

function setLocalStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

describe("MigrationService", () => {
  let svc;
  beforeEach(() => {
    svc = new MigrationService();
    localStorage.clear();
    // Provide Blob URL mocks for jsdom
    window.URL.createObjectURL =
      window.URL.createObjectURL || (() => "blob:mock");
    window.URL.revokeObjectURL = window.URL.revokeObjectURL || (() => {});
  });
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterAll(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it("exports local storage data and creates a blob URL", async () => {
    setLocalStorage("swaxi-dispo-state", { shifts: [{ id: "1" }] });
    setLocalStorage("swaxi-auth", { user: "u" });
    // Mock out click side effects
    const appendSpy = jest.spyOn(document.body, "appendChild");
    const removeSpy = jest.spyOn(document.body, "removeChild");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL");
    const data = await svc.exportLocalStorageData();
    expect(data.shifts.shifts.length).toBe(1);
    expect(data.auth.user).toBe("u");
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeSpy).toHaveBeenCalled();
  });

  it("imports shifts to firebase", async () => {
    const result = await svc.importToFirebase({
      shifts: [{ foo: "x" }, { foo: "y" }],
    });
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  it("handles import error", async () => {
    const mod = require("firebase/firestore");
    const original = mod.writeBatch;
    mod.writeBatch = () => ({
      set: () => {},
      commit: async () => {
        throw new Error("fail");
      },
    });
    const r = await svc.importToFirebase({ shifts: [{ a: 1 }] });
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/fail/);
    mod.writeBatch = original;
  });

  it("validates migration counts", async () => {
    setLocalStorage("swaxi-dispo-state", { shifts: [1, 2] });
    const validation = await svc.validateMigration();
    expect(validation.firebase).toBeGreaterThanOrEqual(0);
    expect(validation).toHaveProperty("match");
  });

  it("creates backup", async () => {
    const appendSpy = jest.spyOn(document.body, "appendChild");
    const removeSpy = jest.spyOn(document.body, "removeChild");
    const backup = await svc.createBackup();
    expect(backup).toHaveProperty("data");
    expect(Object.keys(backup.data).length).toBeGreaterThan(0);
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("propagates backup failure", async () => {
    const mod = require("firebase/firestore");
    const original = mod.getDocs;
    mod.getDocs = async () => {
      throw new Error("boom");
    };
    await expect(svc.createBackup()).rejects.toThrow("boom");
    mod.getDocs = original;
  });
});
