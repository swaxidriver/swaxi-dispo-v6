/**
 * CSV Import/Export Integration Module
 *
 * Handles CSV import/export for people, shift templates, and assignments
 * with support for cross-midnight shifts and paid hours calculations.
 */

import { v4 as uuidv4 } from "uuid";
import { dayNamesToMask, maskToDayNames } from "../repository/schemas.js";
import { computeDuration } from "../features/shifts/shifts.js";

/**
 * Parse CSV content into rows
 * @param {string} csvContent - Raw CSV content
 * @param {boolean} hasHeader - Whether CSV has header row
 * @returns {Object[]} Parsed rows as objects
 */
export function parseCSV(csvContent, hasHeader = true) {
  if (!csvContent || typeof csvContent !== "string") {
    throw new Error("Invalid CSV content");
  }

  const lines = csvContent.trim().split("\n");
  if (lines.length === 0) {
    return [];
  }

  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  let headers = [];
  let dataStartIndex = 0;

  if (hasHeader) {
    headers = parseCSVLine(lines[0]);
    dataStartIndex = 1;
  } else {
    // Generate default headers based on first row length
    const firstRow = parseCSVLine(lines[0]);
    headers = firstRow.map((_, index) => `column_${index}`);
  }

  const rows = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.some((val) => val.length > 0)) {
      // Skip empty rows
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Convert array of objects to CSV format
 * @param {Object[]} data - Array of objects to convert
 * @param {string[]} headers - Column headers
 * @returns {string} CSV formatted string
 */
export function arrayToCSV(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return headers ? headers.join(",") + "\n" : "";
  }

  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvHeaders = headers || Object.keys(data[0]);
  const headerRow = csvHeaders.map(escapeCSVValue).join(",");

  const dataRows = data.map((row) =>
    csvHeaders.map((header) => escapeCSVValue(row[header])).join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Import people from CSV with upsert functionality
 * @param {string} csvContent - CSV content with people data
 * @param {Object} repository - Repository instance for data operations
 * @returns {Promise<Object>} Import result with counts and errors
 */
export async function importPeople(csvContent, repository) {
  const rows = parseCSV(csvContent, true);
  const result = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      // Validate required fields
      if (!row.name || !row.email) {
        result.errors.push(
          `Row ${result.processed + 1}: Missing required fields (name, email)`,
        );
        result.processed++;
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        result.errors.push(
          `Row ${result.processed + 1}: Invalid email format: ${row.email}`,
        );
        result.processed++;
        continue;
      }

      // Validate role
      const validRoles = ["admin", "chief", "disponent", "analyst"];
      const role = row.role || "disponent";
      if (!validRoles.includes(role)) {
        result.errors.push(
          `Row ${result.processed + 1}: Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`,
        );
        result.processed++;
        continue;
      }

      // Check if person exists by email (upsert logic)
      const existingPeople = await repository.getPersons();
      const existingPerson = existingPeople.find((p) => p.email === row.email);

      const personData = {
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        role: role,
      };

      if (existingPerson) {
        // Update existing person
        await repository.updatePerson(existingPerson.id, personData);
        result.updated++;
      } else {
        // Create new person
        const newPerson = {
          id: uuidv4(),
          ...personData,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await repository.createPerson(newPerson);
        result.created++;
      }

      result.processed++;
    } catch (error) {
      result.errors.push(`Row ${result.processed + 1}: ${error.message}`);
      result.processed++;
    }
  }

  return result;
}

/**
 * Import shift templates from CSV
 * @param {string} csvContent - CSV content with shift template data
 * @param {Object} repository - Repository instance for data operations
 * @returns {Promise<Object>} Import result with counts and errors
 */
export async function importShiftTemplates(csvContent, repository) {
  const rows = parseCSV(csvContent, true);
  const result = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const row of rows) {
    try {
      // Validate required fields
      if (!row.name || !row.start_time || !row.end_time) {
        result.errors.push(
          `Row ${result.processed + 1}: Missing required fields (name, start_time, end_time)`,
        );
        result.processed++;
        continue;
      }

      // Validate time format
      const timePattern = /^([01]?\d|2[0-3]):[0-5]\d$/;
      if (!timePattern.test(row.start_time)) {
        result.errors.push(
          `Row ${result.processed + 1}: Invalid start_time format: ${row.start_time}`,
        );
        result.processed++;
        continue;
      }
      if (!timePattern.test(row.end_time)) {
        result.errors.push(
          `Row ${result.processed + 1}: Invalid end_time format: ${row.end_time}`,
        );
        result.processed++;
        continue;
      }

      // Parse weekday_mask or days
      let weekdayMask = 0;
      if (row.weekday_mask) {
        weekdayMask = parseInt(row.weekday_mask, 10);
        if (isNaN(weekdayMask) || weekdayMask < 0 || weekdayMask > 127) {
          result.errors.push(
            `Row ${result.processed + 1}: Invalid weekday_mask: ${row.weekday_mask}`,
          );
          result.processed++;
          continue;
        }
      } else if (row.days) {
        // Parse comma-separated day codes (Mo,Tu,We,Th,Fr,Sa,Su)
        const days = row.days.split(",").map((d) => d.trim());
        weekdayMask = dayNamesToMask(days);
      } else {
        result.errors.push(
          `Row ${result.processed + 1}: Either weekday_mask or days field is required`,
        );
        result.processed++;
        continue;
      }

      // Determine if shift crosses midnight
      const crossMidnight =
        row.cross_midnight === "true" ||
        row.cross_midnight === "1" ||
        row.start_time > row.end_time;

      // Check if template exists by name (upsert logic)
      const existingTemplates = await repository.getShiftTemplates();
      const existingTemplate = existingTemplates.find(
        (t) => t.name === row.name.trim(),
      );

      const templateData = {
        name: row.name.trim(),
        weekday_mask: weekdayMask,
        start_time: row.start_time,
        end_time: row.end_time,
        cross_midnight: crossMidnight,
        color: row.color || "#3B82F6",
        active: row.active !== "false" && row.active !== "0",
      };

      if (existingTemplate) {
        // Update existing template
        await repository.updateShiftTemplate(existingTemplate.id, templateData);
        result.updated++;
      } else {
        // Create new template
        const newTemplate = {
          id: uuidv4(),
          ...templateData,
          created_at: new Date(),
          updated_at: new Date(),
        };
        await repository.createShiftTemplate(newTemplate);
        result.created++;
      }

      result.processed++;
    } catch (error) {
      result.errors.push(`Row ${result.processed + 1}: ${error.message}`);
      result.processed++;
    }
  }

  return result;
}

/**
 * Export assignments for a specific week with cross-midnight and paid hours
 * @param {Object} repository - Repository instance
 * @param {Date} weekStart - Start of the week to export
 * @param {Date} weekEnd - End of the week to export
 * @returns {Promise<string>} CSV formatted assignment data
 */
export async function exportAssignments(repository, weekStart, weekEnd) {
  try {
    // Get all assignments and related data for the week
    const assignments = await repository.getAssignments();
    const shiftInstances = await repository.getShiftInstances();
    const people = await repository.getPersons();
    const templates = await repository.getShiftTemplates();

    // Filter shift instances for the week
    const weekShifts = shiftInstances.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });

    // Build assignment data with all required fields
    const assignmentData = [];

    for (const shift of weekShifts) {
      const template = templates.find((t) => t.id === shift.template_id);
      const assignment = assignments.find(
        (a) => a.shift_instance_id === shift.id,
      );
      const person = assignment
        ? people.find((p) => p.id === assignment.disponent_id)
        : null;

      // Calculate duration and paid hours
      const duration = template
        ? computeDuration(template.start_time, template.end_time)
        : 0;
      const paidHours = duration / 60; // Convert minutes to hours

      // Format the assignment row
      const row = {
        date: shift.date,
        shift_name: template?.name || "Unknown",
        start_time: template?.start_time || "",
        end_time: template?.end_time || "",
        cross_midnight: template?.cross_midnight ? "Yes" : "No",
        duration_minutes: duration,
        paid_hours: paidHours.toFixed(2),
        assigned_to: person?.name || "",
        assigned_email: person?.email || "",
        assigned_role: person?.role || "",
        status: assignment?.status || "unassigned",
        weekday: new Date(shift.date).toLocaleDateString("en-US", {
          weekday: "long",
        }),
        template_days: template
          ? maskToDayNames(template.weekday_mask).join(",")
          : "",
        shift_id: shift.id,
        assignment_id: assignment?.id || "",
        notes: shift.notes || "",
      };

      assignmentData.push(row);
    }

    // Sort by date and then by start time
    assignmentData.sort((a, b) => {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    // Convert to CSV
    const headers = [
      "date",
      "shift_name",
      "start_time",
      "end_time",
      "cross_midnight",
      "duration_minutes",
      "paid_hours",
      "assigned_to",
      "assigned_email",
      "assigned_role",
      "status",
      "weekday",
      "template_days",
      "shift_id",
      "assignment_id",
      "notes",
    ];

    return arrayToCSV(assignmentData, headers);
  } catch (error) {
    throw new Error(`Failed to export assignments: ${error.message}`);
  }
}

/**
 * Export people to CSV format
 * @param {Object} repository - Repository instance
 * @returns {Promise<string>} CSV formatted people data
 */
export async function exportPeople(repository) {
  try {
    const people = await repository.getPersons();

    const peopleData = people.map((person) => ({
      name: person.name,
      email: person.email,
      role: person.role,
      created_at: person.created_at?.toISOString() || "",
      updated_at: person.updated_at?.toISOString() || "",
    }));

    const headers = ["name", "email", "role", "created_at", "updated_at"];
    return arrayToCSV(peopleData, headers);
  } catch (error) {
    throw new Error(`Failed to export people: ${error.message}`);
  }
}

/**
 * Export shift templates to CSV format
 * @param {Object} repository - Repository instance
 * @returns {Promise<string>} CSV formatted template data
 */
export async function exportShiftTemplates(repository) {
  try {
    const templates = await repository.getShiftTemplates();

    const templateData = templates.map((template) => ({
      name: template.name,
      weekday_mask: template.weekday_mask,
      days: maskToDayNames(template.weekday_mask).join(","),
      start_time: template.start_time,
      end_time: template.end_time,
      cross_midnight: template.cross_midnight ? "true" : "false",
      color: template.color,
      active: template.active ? "true" : "false",
      created_at: template.created_at?.toISOString() || "",
      updated_at: template.updated_at?.toISOString() || "",
    }));

    const headers = [
      "name",
      "weekday_mask",
      "days",
      "start_time",
      "end_time",
      "cross_midnight",
      "color",
      "active",
      "created_at",
      "updated_at",
    ];
    return arrayToCSV(templateData, headers);
  } catch (error) {
    throw new Error(`Failed to export shift templates: ${error.message}`);
  }
}

/**
 * Export assignments in Perdis/WebComm compatible format
 * @param {Object} repository - Repository instance
 * @param {Date} weekStart - Start of the week
 * @param {Date} weekEnd - End of the week
 * @returns {Promise<string>} CSV in Perdis/WebComm format
 */
export async function exportPerdisWebComm(repository, weekStart, weekEnd) {
  try {
    const assignments = await repository.getAssignments();
    const shiftInstances = await repository.getShiftInstances();
    const people = await repository.getPersons();
    const templates = await repository.getShiftTemplates();

    // Filter for the week
    const weekShifts = shiftInstances.filter((shift) => {
      const shiftDate = new Date(shift.date);
      return shiftDate >= weekStart && shiftDate <= weekEnd;
    });

    const perdisData = [];

    for (const shift of weekShifts) {
      const template = templates.find((t) => t.id === shift.template_id);
      const assignment = assignments.find(
        (a) => a.shift_instance_id === shift.id,
      );
      const person = assignment
        ? people.find((p) => p.id === assignment.disponent_id)
        : null;

      if (assignment && person && template) {
        // Calculate times for Perdis format
        const duration = computeDuration(
          template.start_time,
          template.end_time,
        );
        const paidHours = duration / 60;

        // Perdis/WebComm specific format
        const row = {
          PersonalNr: person.id,
          Name: person.name,
          Datum: shift.date,
          Schicht: template.name,
          Von: template.start_time,
          Bis: template.end_time,
          Stunden: paidHours.toFixed(2),
          Mitternacht: template.cross_midnight ? "1" : "0",
          Status: assignment.status,
        };

        perdisData.push(row);
      }
    }

    // Sort by date and person name
    perdisData.sort((a, b) => {
      const dateCompare = new Date(a.Datum) - new Date(b.Datum);
      if (dateCompare !== 0) return dateCompare;
      return a.Name.localeCompare(b.Name);
    });

    const headers = [
      "PersonalNr",
      "Name",
      "Datum",
      "Schicht",
      "Von",
      "Bis",
      "Stunden",
      "Mitternacht",
      "Status",
    ];

    return arrayToCSV(perdisData, headers);
  } catch (error) {
    throw new Error(`Failed to export Perdis/WebComm format: ${error.message}`);
  }
}
