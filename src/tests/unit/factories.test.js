import {
  buildUser,
  buildShift,
  buildApplication,
  resetFactoryIds,
} from "../../tests/utils/factories";

// Minimal unit tests to cover factories (IDs, overrides, defaults)

describe("test data factories", () => {
  beforeEach(() => resetFactoryIds());

  it("buildUser applies defaults and unique ids", () => {
    const u1 = buildUser();
    const u2 = buildUser();
    expect(u1.id).not.toEqual(u2.id);
    expect(u1.role).toBe("disponent");
  });

  it("buildShift allows overrides and defaults", () => {
    const s = buildShift({ status: "assigned", start: "10:00" });
    expect(s.status).toBe("assigned");
    expect(s.start).toBe("10:00");
    expect(s.end).toBeDefined();
  });

  it("buildApplication sets relations and allows override", () => {
    const a = buildApplication({ userId: "usr_custom" });
    expect(a.userId).toBe("usr_custom");
    expect(a.shiftId).toBeDefined();
    expect(a.id).toBeDefined();
  });
});
