import { STATUS, canTransition, assertTransition } from "../domain/status";

describe("Status Model", () => {
  test("allowed transitions", () => {
    expect(canTransition(STATUS.OPEN, STATUS.ASSIGNED)).toBe(true);
    expect(canTransition(STATUS.OPEN, STATUS.CANCELLED)).toBe(true);
    expect(canTransition(STATUS.ASSIGNED, STATUS.CANCELLED)).toBe(true);
  });
  test("disallowed transitions", () => {
    expect(canTransition(STATUS.ASSIGNED, STATUS.OPEN)).toBe(false);
    expect(canTransition(STATUS.CANCELLED, STATUS.OPEN)).toBe(false);
    expect(canTransition(STATUS.CANCELLED, STATUS.ASSIGNED)).toBe(false);
  });
  test("assertTransition throws on invalid", () => {
    expect(() => assertTransition(STATUS.CANCELLED, STATUS.OPEN)).toThrow();
  });
});
