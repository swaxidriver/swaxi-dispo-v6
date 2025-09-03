/**
 * iCal Export Integration Module
 *
 * Handles iCal (.ics) export for calendar views with shift data
 * Compatible with standard calendar applications (Outlook, Google Calendar, etc.)
 */

/**
 * Format date for iCal format (YYYYMMDDTHHMMSSZ)
 * @param {Date} date - Date to format
 * @returns {string} iCal formatted date string
 */
function formatICalDate(date) {
  if (!date || !(date instanceof Date)) {
    throw new Error("Invalid date provided to formatICalDate");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hour}${minute}${second}Z`;
}

/**
 * Escape text for iCal format
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeICalText(text) {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/**
 * Combine date and time strings into a Date object
 * @param {string|Date} dateLike - Date string or Date object
 * @param {string} timeStr - Time string in HH:MM format
 * @returns {Date} Combined date/time
 */
function combineDateTime(dateLike, timeStr) {
  const date =
    dateLike instanceof Date ? new Date(dateLike) : new Date(dateLike);
  if (!timeStr) return date;

  const [hours, minutes] = timeStr.split(":").map(Number);
  date.setHours(hours, minutes || 0, 0, 0);
  return date;
}

/**
 * Generate unique ID for iCal event
 * @param {string} shiftId - Shift ID
 * @param {string} domain - Domain for UID
 * @returns {string} Unique identifier
 */
function generateEventUID(shiftId, domain = "swaxi-dispo-v6.local") {
  return `${shiftId}@${domain}`;
}

/**
 * Convert a single shift to iCal VEVENT format
 * @param {Object} shift - Shift object
 * @param {Object} template - Shift template object
 * @param {Object} assignment - Assignment object (optional)
 * @param {Object} person - Person object (optional)
 * @returns {string} iCal VEVENT string
 */
function shiftToICalEvent(shift, template, assignment, person) {
  const shiftDate =
    shift.date instanceof Date ? shift.date : new Date(shift.date);
  const startTime = template?.start_time || shift.start || "00:00";
  const endTime = template?.end_time || shift.end || "23:59";

  let startDateTime = combineDateTime(shiftDate, startTime);
  let endDateTime = combineDateTime(shiftDate, endTime);

  // Handle cross-midnight shifts
  if (template?.cross_midnight || endDateTime <= startDateTime) {
    endDateTime = new Date(endDateTime);
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  const summary = escapeICalText(template?.name || shift.name || "Dienst");
  const description = [
    assignment?.status ? `Status: ${assignment.status}` : "",
    person?.name ? `Zugewiesen: ${person.name}` : "",
    person?.email ? `Email: ${person.email}` : "",
    template?.cross_midnight ? "Über Mitternacht" : "",
  ]
    .filter(Boolean)
    .join("\\n");

  const location = escapeICalText(shift.location || template?.location || "");

  const eventLines = [
    "BEGIN:VEVENT",
    `UID:${generateEventUID(shift.id)}`,
    `DTSTART:${formatICalDate(startDateTime)}`,
    `DTEND:${formatICalDate(endDateTime)}`,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : "",
    location ? `LOCATION:${location}` : "",
    `DTSTAMP:${formatICalDate(new Date())}`,
    assignment?.status === "assigned" ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE",
    "END:VEVENT",
  ].filter(Boolean);

  return eventLines.join("\r\n");
}

/**
 * Export shifts to iCal format for current user
 * @param {Object[]} shifts - Array of shift objects
 * @param {Object[]} templates - Array of shift template objects
 * @param {Object[]} assignments - Array of assignment objects
 * @param {Object[]} people - Array of person objects
 * @param {Object} currentUser - Current user object
 * @param {Object} options - Export options
 * @returns {string} Complete iCal content
 */
export function exportShiftsToICal(
  shifts,
  templates,
  assignments,
  people,
  currentUser,
  options = {},
) {
  const {
    title = "Swaxi Dienste",
    description = "Exportierte Dienste aus Swaxi Dispo",
    userOnly = true,
  } = options;

  if (!Array.isArray(shifts)) {
    throw new Error("Shifts must be an array");
  }

  // Filter assignments for current user if userOnly is true
  const relevantAssignments =
    userOnly && currentUser
      ? assignments.filter((a) => {
          const person = people.find((p) => p.id === a.person_id);
          return (
            person?.email === currentUser.email || person?.id === currentUser.id
          );
        })
      : assignments;

  // Get shift instances that have assignments for the current user
  const relevantShiftIds = new Set(
    relevantAssignments.map((a) => a.shift_instance_id),
  );
  const relevantShifts = userOnly
    ? shifts.filter((s) => relevantShiftIds.has(s.id))
    : shifts;

  const events = relevantShifts
    .map((shift) => {
      const template = templates.find((t) => t.id === shift.template_id);
      const assignment = relevantAssignments.find(
        (a) => a.shift_instance_id === shift.id,
      );
      const person = assignment
        ? people.find((p) => p.id === assignment.person_id)
        : null;

      return shiftToICalEvent(shift, template, assignment, person);
    })
    .join("\r\n");

  const icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Swaxi//Swaxi Dispo v6//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(title)}`,
    `X-WR-CALDESC:${escapeICalText(description)}`,
    events,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icalContent;
}

/**
 * Export filtered calendar shifts to iCal for current user
 * @param {Object} repository - Repository instance
 * @param {Object[]} filteredShifts - Pre-filtered shifts from calendar view
 * @param {Object} currentUser - Current user object
 * @param {Object} options - Export options
 * @returns {Promise<string>} iCal content
 */
export async function exportCalendarShiftsToICal(
  repository,
  filteredShifts,
  currentUser,
  options = {},
) {
  try {
    const [assignments, people, templates] = await Promise.all([
      repository.getAssignments(),
      repository.getPersons(),
      repository.getShiftTemplates(),
    ]);

    return exportShiftsToICal(
      filteredShifts,
      templates,
      assignments,
      people,
      currentUser,
      options,
    );
  } catch (error) {
    throw new Error(`Failed to export calendar to iCal: ${error.message}`);
  }
}
