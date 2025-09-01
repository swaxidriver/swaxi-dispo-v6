export const ROLES = {
  ADMIN: "admin",
  CHIEF: "chief",
  DISPONENT: "disponent",
  ANALYST: "analyst",
};

export const SHIFT_STATUS = {
  OPEN: "open",
  ASSIGNED: "assigned",
  CANCELLED: "cancelled",
};

export const APPLICATION_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

export const WORK_LOCATIONS = {
  OFFICE: "office",
  HOME: "home",
};

// Role capability helpers (P0-8)
export function canManageShifts(role) {
  return (
    role === ROLES.ADMIN || role === ROLES.CHIEF || role === ROLES.DISPONENT
  );
}
export function canAssignShifts(role) {
  return role === ROLES.ADMIN || role === ROLES.CHIEF;
}
export function canManageTemplates(role) {
  return role === ROLES.ADMIN || role === ROLES.CHIEF;
}
export function canViewAnalytics(role) {
  return role === ROLES.ADMIN || role === ROLES.ANALYST || role === ROLES.CHIEF;
}

export const SHIFT_TEMPLATES = {
  WEEKDAY: {
    evening: { start: "17:45", end: "21:45" },
    night: { start: "21:00", end: "05:30" },
  },
  WEEKEND: {
    early: { start: "11:45", end: "21:00" },
    night: { start: "21:00", end: "05:30" },
  },
};
