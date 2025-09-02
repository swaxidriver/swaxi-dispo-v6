import { ROLES } from "../../utils/constants";

const userHasPermission = (userRole, requiredRole) => {
  const roleHierarchy = {
    [ROLES.ADMIN]: 4,
    [ROLES.CHIEF]: 3,
    [ROLES.DISPONENT]: 2,
    [ROLES.ANALYST]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canManageShifts = (userRole) =>
  userHasPermission(userRole, ROLES.CHIEF);
export const canViewAudit = (userRole) =>
  userHasPermission(userRole, ROLES.ADMIN);
export const canApplyForShifts = (userRole) =>
  userHasPermission(userRole, ROLES.DISPONENT);
export const canViewAnalytics = (userRole) =>
  userHasPermission(userRole, ROLES.ANALYST);
export const canAssignShifts = (userRole) =>
  userHasPermission(userRole, ROLES.CHIEF);
export const canManageTemplates = (userRole) =>
  userHasPermission(userRole, ROLES.CHIEF);

// Permission object for consistency with backend RBAC
export const Permissions = {
  canManageShifts,
  canViewAudit,
  canApplyForShifts,
  canViewAnalytics,
  canAssignShifts,
  canManageTemplates,
};
