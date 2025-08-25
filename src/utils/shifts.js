import { SHIFT_STATUS, WORK_LOCATIONS } from './constants';

export const checkShiftConflicts = (shift, existingShifts, applications) => {
  const conflicts = [];

  // Time overlap check
  const hasTimeOverlap = existingShifts.some(existingShift => {
    const shiftStart = new Date(shift.start);
    const shiftEnd = new Date(shift.end);
    const existingStart = new Date(existingShift.start);
    const existingEnd = new Date(existingShift.end);

    return (shiftStart < existingEnd && shiftEnd > existingStart);
  });

  if (hasTimeOverlap) {
    conflicts.push('TIME_OVERLAP');
  }

  // Double application check
  const hasDoubleApplication = applications.some(app => 
    app.userId === shift.userId && app.shiftId !== shift.id
  );

  if (hasDoubleApplication) {
    conflicts.push('DOUBLE_APPLICATION');
  }

  // Assignment collision
  const hasAssignmentCollision = existingShifts.some(existingShift =>
    existingShift.status === SHIFT_STATUS.ASSIGNED &&
    existingShift.assignedTo === shift.assignedTo &&
    existingShift.id !== shift.id
  );

  if (hasAssignmentCollision) {
    conflicts.push('ASSIGNMENT_COLLISION');
  }

  // Work location mismatch
  const hasLocationMismatch = shift.workLocation === WORK_LOCATIONS.HOME &&
    shift.requiresOffice;

  if (hasLocationMismatch) {
    conflicts.push('LOCATION_MISMATCH');
  }

  return conflicts;
};

export const generateShiftTemplates = (startDate, daysToGenerate = 10) => {
  const shifts = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < daysToGenerate; i++) {
    const day = currentDate.getDay();
    const isWeekend = day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday

    if (isWeekend) {
      // Weekend shifts
      shifts.push({
        date: new Date(currentDate),
        type: 'early',
        start: '11:45',
        end: '21:00'
      });
      shifts.push({
        date: new Date(currentDate),
        type: 'night',
        start: '21:00',
        end: '05:30'
      });
    } else {
      // Weekday shifts
      shifts.push({
        date: new Date(currentDate),
        type: 'evening',
        start: '17:45',
        end: '21:45'
      });
      shifts.push({
        date: new Date(currentDate),
        type: 'night',
        start: '21:00',
        end: '05:30'
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return shifts;
};
