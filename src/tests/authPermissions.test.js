import {
  canManageShifts,
  canViewAudit,
  canApplyForShifts,
  canViewAnalytics,
} from "../utils/auth";
import { ROLES } from "../utils/constants";

describe("auth permission helpers", () => {
  const roles = [ROLES.ADMIN, ROLES.CHIEF, ROLES.DISPONENT, ROLES.ANALYST];

  const matrix = roles.map((r) => ({
    role: r,
    manage: canManageShifts(r),
    audit: canViewAudit(r),
    apply: canApplyForShifts(r),
    analytics: canViewAnalytics(r),
  }));

  it("role hierarchy enforces expected permissions", () => {
    // ADMIN: all true
    const admin = matrix.find((m) => m.role === ROLES.ADMIN);
    expect(admin).toMatchObject({
      manage: true,
      audit: true,
      apply: true,
      analytics: true,
    });

    const chief = matrix.find((m) => m.role === ROLES.CHIEF);
    expect(chief).toMatchObject({
      manage: true,
      audit: false,
      apply: true,
      analytics: true,
    });

    const disponent = matrix.find((m) => m.role === ROLES.DISPONENT);
    expect(disponent).toMatchObject({
      manage: false,
      audit: false,
      apply: true,
      analytics: true,
    });

    const analyst = matrix.find((m) => m.role === ROLES.ANALYST);
    expect(analyst).toMatchObject({
      manage: false,
      audit: false,
      apply: false,
      analytics: true,
    });
  });

  it("no higher role incorrectly gains audit permission", () => {
    expect(canViewAudit(ROLES.CHIEF)).toBe(false);
    expect(canViewAudit(ROLES.DISPONENT)).toBe(false);
    expect(canViewAudit(ROLES.ANALYST)).toBe(false);
  });
});
