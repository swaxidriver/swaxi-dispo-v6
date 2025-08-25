export const ROLES = {
  ADMIN: 'admin',
  CHIEF: 'chief',
  DISPONENT: 'disponent',
  ANALYST: 'analyst'
};

export const SHIFT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  CANCELLED: 'cancelled'
};

export const WORK_LOCATIONS = {
  OFFICE: 'office',
  HOME: 'home'
};

export const SHIFT_TEMPLATES = {
  WEEKDAY: {
    evening: { start: '17:45', end: '21:45' },
    night: { start: '21:00', end: '05:30' }
  },
  WEEKEND: {
    early: { start: '11:45', end: '21:00' },
    night: { start: '21:00', end: '05:30' }
  }
};
