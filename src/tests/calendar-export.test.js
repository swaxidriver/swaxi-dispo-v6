/**
 * Test for calendar export functionality
 */
import { exportShiftsToICal } from "../integration/ical";
import { exportCalendarShiftsToCSV } from "../integration/csv";

describe("Calendar Export Functionality", () => {
  const mockShifts = [
    {
      id: "shift1",
      date: "2024-01-15",
      template_id: "template1",
    },
    {
      id: "shift2",
      date: "2024-01-16",
      template_id: "template2",
    },
  ];

  const mockTemplates = [
    {
      id: "template1",
      name: "Frühdienst",
      start_time: "06:00",
      end_time: "14:00",
      cross_midnight: false,
    },
    {
      id: "template2",
      name: "Nachtdienst",
      start_time: "22:00",
      end_time: "06:00",
      cross_midnight: true,
    },
  ];

  const mockAssignments = [
    {
      id: "assign1",
      shift_instance_id: "shift1",
      person_id: "person1",
      status: "assigned",
    },
  ];

  const mockPeople = [
    {
      id: "person1",
      name: "John Doe",
      email: "john@example.com",
      role: "driver",
    },
  ];

  const mockUser = {
    id: "person1",
    email: "john@example.com",
    name: "John Doe",
  };

  describe("iCal Export", () => {
    test("should generate valid iCal content for user shifts", () => {
      const icalContent = exportShiftsToICal(
        mockShifts,
        mockTemplates,
        mockAssignments,
        mockPeople,
        mockUser,
        { userOnly: true },
      );

      expect(icalContent).toContain("BEGIN:VCALENDAR");
      expect(icalContent).toContain("END:VCALENDAR");
      expect(icalContent).toContain("BEGIN:VEVENT");
      expect(icalContent).toContain("END:VEVENT");
      expect(icalContent).toContain("Frühdienst");
      expect(icalContent).toContain("PRODID:-//Swaxi//Swaxi Dispo v6//DE");
    });

    test("should handle cross-midnight shifts correctly", () => {
      const nightShift = [
        {
          id: "shift2",
          date: "2024-01-16",
          template_id: "template2",
        },
      ];

      const nightAssignment = [
        {
          id: "assign2",
          shift_instance_id: "shift2",
          person_id: "person1",
          status: "assigned",
        },
      ];

      const icalContent = exportShiftsToICal(
        nightShift,
        mockTemplates,
        nightAssignment,
        mockPeople,
        mockUser,
        { userOnly: true },
      );

      expect(icalContent).toContain("Nachtdienst");
      // Should have events for cross-midnight shift
      expect(icalContent).toContain("BEGIN:VEVENT");
    });
  });

  describe("CSV Export", () => {
    test("should generate valid CSV content for filtered shifts", () => {
      const csvContent = exportCalendarShiftsToCSV(
        mockShifts,
        mockTemplates,
        mockAssignments,
        mockPeople,
        { includeUnassigned: true },
      );

      expect(csvContent).toContain("date,shift_id,shift_name");
      expect(csvContent).toContain("2024-01-15,shift1,Frühdienst");
      expect(csvContent).toContain("2024-01-16,shift2,Nachtdienst");
      expect(csvContent).toContain("John Doe");
    });

    test("should exclude unassigned shifts when requested", () => {
      const csvContent = exportCalendarShiftsToCSV(
        mockShifts,
        mockTemplates,
        mockAssignments,
        mockPeople,
        { includeUnassigned: false },
      );

      // Should only contain the assigned shift
      expect(csvContent).toContain("2024-01-15,shift1,Frühdienst");
      expect(csvContent).not.toContain("2024-01-16,shift2,Nachtdienst");
    });

    test("should handle cross-midnight flag correctly", () => {
      const csvContent = exportCalendarShiftsToCSV(
        mockShifts,
        mockTemplates,
        mockAssignments,
        mockPeople,
        { includeUnassigned: true },
      );

      expect(csvContent).toContain("cross_midnight");
      expect(csvContent).toContain("No"); // For Frühdienst
      expect(csvContent).toContain("Yes"); // For Nachtdienst
    });
  });
});
