import {
  ROLES,
  canManageShifts,
  canAssignShifts,
  canManageTemplates,
  canViewAnalytics,
} from "../../utils/constants";

describe("role capability helpers", () => {
  const roles = [ROLES.ADMIN, ROLES.CHIEF, ROLES.DISPONENT, ROLES.ANALYST];
  it.each(roles)("canManageShifts(%s)", (r) => {
    const expected =
      r === ROLES.ADMIN || r === ROLES.CHIEF || r === ROLES.DISPONENT;
    expect(canManageShifts(r)).toBe(expected);
  });
  it.each(roles)("canAssignShifts(%s)", (r) => {
    const expected = r === ROLES.ADMIN || r === ROLES.CHIEF;
    expect(canAssignShifts(r)).toBe(expected);
  });
  it.each(roles)("canManageTemplates(%s)", (r) => {
    const expected = r === ROLES.ADMIN || r === ROLES.CHIEF;
    expect(canManageTemplates(r)).toBe(expected);
  });
  it.each(roles)("canViewAnalytics(%s)", (r) => {
    const expected =
      r === ROLES.ADMIN || r === ROLES.ANALYST || r === ROLES.CHIEF;
    expect(canViewAnalytics(r)).toBe(expected);
  });
});
