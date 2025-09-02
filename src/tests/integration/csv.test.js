/**
 * CSV Integration Tests
 *
 * Tests for CSV import/export functionality including people, shift templates,
 * assignments, and Perdis/WebComm format exports.
 */

import {
  parseCSV,
  arrayToCSV,
  importPeople,
  importShiftTemplates,
  exportAssignments,
  exportPeople,
  exportShiftTemplates,
  exportPerdisWebComm,
} from "../../integration/csv.js";

// Mock repository for testing
class MockRepository {
  constructor() {
    this.people = [];
    this.shiftTemplates = [];
    this.shiftInstances = [];
    this.assignments = [];
  }

  async getPersons() {
    return [...this.people];
  }

  async createPerson(person) {
    this.people.push(person);
    return person;
  }

  async updatePerson(id, updates) {
    const index = this.people.findIndex((p) => p.id === id);
    if (index >= 0) {
      this.people[index] = {
        ...this.people[index],
        ...updates,
        updated_at: new Date(),
      };
      return this.people[index];
    }
    throw new Error("Person not found");
  }

  async getShiftTemplates() {
    return [...this.shiftTemplates];
  }

  async createShiftTemplate(template) {
    this.shiftTemplates.push(template);
    return template;
  }

  async updateShiftTemplate(id, updates) {
    const index = this.shiftTemplates.findIndex((t) => t.id === id);
    if (index >= 0) {
      this.shiftTemplates[index] = {
        ...this.shiftTemplates[index],
        ...updates,
        updated_at: new Date(),
      };
      return this.shiftTemplates[index];
    }
    throw new Error("ShiftTemplate not found");
  }

  async getShiftInstances() {
    return [...this.shiftInstances];
  }

  async getAssignments() {
    return [...this.assignments];
  }
}

describe("CSV Parser", () => {
  describe("parseCSV", () => {
    test("should parse simple CSV with headers", () => {
      const csv =
        "name,email,role\nJohn Doe,john@example.com,admin\nJane Smith,jane@example.com,disponent";
      const result = parseCSV(csv, true);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
      });
      expect(result[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        role: "disponent",
      });
    });

    test("should handle quoted fields with commas", () => {
      const csv =
        'name,description\n"Doe, John","A person with a comma in name"';
      const result = parseCSV(csv, true);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: "Doe, John",
        description: "A person with a comma in name",
      });
    });

    test("should handle escaped quotes", () => {
      const csv = 'name,quote\n"John ""Quote"" Doe","He said ""Hello"""';
      const result = parseCSV(csv, true);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'John "Quote" Doe',
        quote: 'He said "Hello"',
      });
    });

    test("should skip empty rows", () => {
      const csv = "name,email\nJohn,john@test.com\n\nJane,jane@test.com";
      const result = parseCSV(csv, true);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("John");
      expect(result[1].name).toBe("Jane");
    });

    test("should handle CSV without headers", () => {
      const csv = "John,john@test.com\nJane,jane@test.com";
      const result = parseCSV(csv, false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        column_0: "John",
        column_1: "john@test.com",
      });
    });

    test("should throw error for invalid input", () => {
      expect(() => parseCSV(null)).toThrow("Invalid CSV content");
      expect(() => parseCSV("")).toThrow("Invalid CSV content");
    });
  });

  describe("arrayToCSV", () => {
    test("should convert array to CSV format", () => {
      const data = [
        { name: "John", email: "john@test.com", role: "admin" },
        { name: "Jane", email: "jane@test.com", role: "disponent" },
      ];
      const result = arrayToCSV(data);

      expect(result).toBe(
        "name,email,role\n" +
          "John,john@test.com,admin\n" +
          "Jane,jane@test.com,disponent",
      );
    });

    test("should escape fields with commas and quotes", () => {
      const data = [{ name: "Doe, John", quote: 'He said "Hello"' }];
      const result = arrayToCSV(data);

      expect(result).toBe("name,quote\n" + '"Doe, John","He said ""Hello"""');
    });

    test("should handle custom headers", () => {
      const data = [
        { name: "John", email: "john@test.com", unused: "ignored" },
      ];
      const headers = ["name", "email"];
      const result = arrayToCSV(data, headers);

      expect(result).toBe("name,email\nJohn,john@test.com");
    });

    test("should handle empty array", () => {
      const result = arrayToCSV([]);
      expect(result).toBe("");
    });

    test("should handle empty array with headers", () => {
      const result = arrayToCSV([], ["name", "email"]);
      expect(result).toBe("name,email\n");
    });
  });
});

describe("People Import", () => {
  let repository;

  beforeEach(() => {
    repository = new MockRepository();
  });

  test("should import new people successfully", async () => {
    const csv =
      "name,email,role\nJohn Doe,john@example.com,admin\nJane Smith,jane@example.com,disponent";

    const result = await importPeople(csv, repository);

    expect(result.processed).toBe(2);
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.errors).toHaveLength(0);

    const people = await repository.getPersons();
    expect(people).toHaveLength(2);
    expect(people[0].name).toBe("John Doe");
    expect(people[0].email).toBe("john@example.com");
    expect(people[0].role).toBe("admin");
  });

  test("should update existing people (upsert)", async () => {
    // Add existing person
    await repository.createPerson({
      id: "existing-1",
      name: "Old Name",
      email: "john@example.com",
      role: "disponent",
    });

    const csv = "name,email,role\nJohn Doe,john@example.com,admin";

    const result = await importPeople(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.created).toBe(0);
    expect(result.updated).toBe(1);
    expect(result.errors).toHaveLength(0);

    const people = await repository.getPersons();
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe("John Doe"); // Updated
    expect(people[0].role).toBe("admin"); // Updated
    expect(people[0].email).toBe("john@example.com"); // Same
  });

  test("should default role to disponent", async () => {
    const csv = "name,email\nJohn Doe,john@example.com";

    const result = await importPeople(csv, repository);

    expect(result.created).toBe(1);
    const people = await repository.getPersons();
    expect(people[0].role).toBe("disponent");
  });

  test("should validate required fields", async () => {
    const csv =
      "name,email,role\n,john@example.com,admin\nJane Smith,,disponent";

    const result = await importPeople(csv, repository);

    expect(result.processed).toBe(2);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Missing required fields");
    expect(result.errors[1]).toContain("Missing required fields");
  });

  test("should validate email format", async () => {
    const csv = "name,email,role\nJohn Doe,invalid-email,admin";

    const result = await importPeople(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Invalid email format");
  });

  test("should validate role", async () => {
    const csv = "name,email,role\nJohn Doe,john@example.com,invalid-role";

    const result = await importPeople(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Invalid role");
  });
});

describe("Shift Templates Import", () => {
  let repository;

  beforeEach(() => {
    repository = new MockRepository();
  });

  test("should import new shift templates successfully", async () => {
    const csv =
      "name,start_time,end_time,weekday_mask,cross_midnight\nMorning,08:00,16:00,31,false\nNight,22:00,06:00,127,true";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(2);
    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.errors).toHaveLength(0);

    const templates = await repository.getShiftTemplates();
    expect(templates).toHaveLength(2);
    expect(templates[0].name).toBe("Morning");
    expect(templates[0].cross_midnight).toBe(false);
    expect(templates[1].name).toBe("Night");
    expect(templates[1].cross_midnight).toBe(true);
  });

  test("should parse days field instead of weekday_mask", async () => {
    const csv =
      'name,start_time,end_time,days\nWeekday,09:00,17:00,"Mo,Tu,We,Th,Fr"';

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.created).toBe(1);

    const templates = await repository.getShiftTemplates();
    expect(templates[0].weekday_mask).toBe(31); // Mo+Tu+We+Th+Fr = 1+2+4+8+16 = 31
  });

  test("should auto-detect cross-midnight from times", async () => {
    const csv = "name,start_time,end_time,weekday_mask\nNight,22:00,06:00,127";

    const result = await importShiftTemplates(csv, repository);

    expect(result.created).toBe(1);
    const templates = await repository.getShiftTemplates();
    expect(templates[0].cross_midnight).toBe(true);
  });

  test("should update existing templates (upsert)", async () => {
    // Add existing template
    await repository.createShiftTemplate({
      id: "existing-1",
      name: "Morning",
      start_time: "07:00",
      end_time: "15:00",
      weekday_mask: 31,
      cross_midnight: false,
    });

    const csv = "name,start_time,end_time,weekday_mask\nMorning,08:00,16:00,31";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);

    const templates = await repository.getShiftTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].start_time).toBe("08:00"); // Updated
    expect(templates[0].end_time).toBe("16:00"); // Updated
  });

  test("should validate required fields", async () => {
    const csv =
      "name,start_time,end_time,weekday_mask\n,08:00,16:00,31\nMorning,,16:00,31\nMorning,08:00,,31";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(3);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0]).toContain("Missing required fields");
    expect(result.errors[1]).toContain("Missing required fields");
    expect(result.errors[2]).toContain("Missing required fields");
  });

  test("should validate time format", async () => {
    const csv =
      "name,start_time,end_time,weekday_mask\nMorning,25:00,16:00,31\nEvening,08:00,24:30,31";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(2);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Invalid start_time format");
    expect(result.errors[1]).toContain("Invalid end_time format");
  });

  test("should validate weekday_mask", async () => {
    const csv =
      "name,start_time,end_time,weekday_mask\nMorning,08:00,16:00,invalid\nEvening,08:00,16:00,128";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(2);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Invalid weekday_mask");
    expect(result.errors[1]).toContain("Invalid weekday_mask");
  });

  test("should require either weekday_mask or days", async () => {
    const csv = "name,start_time,end_time\nMorning,08:00,16:00";

    const result = await importShiftTemplates(csv, repository);

    expect(result.processed).toBe(1);
    expect(result.created).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(
      "Either weekday_mask or days field is required",
    );
  });
});

describe("Export Functions", () => {
  let repository;

  beforeEach(() => {
    repository = new MockRepository();

    // Setup test data
    repository.people = [
      {
        id: "person-1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
      {
        id: "person-2",
        name: "Jane Smith",
        email: "jane@example.com",
        role: "disponent",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
    ];

    repository.shiftTemplates = [
      {
        id: "template-1",
        name: "Morning",
        weekday_mask: 31, // Mo-Fr
        start_time: "08:00",
        end_time: "16:00",
        cross_midnight: false,
        color: "#3B82F6",
        active: true,
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
      {
        id: "template-2",
        name: "Night",
        weekday_mask: 127, // All days
        start_time: "22:00",
        end_time: "06:00",
        cross_midnight: true,
        color: "#EF4444",
        active: true,
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
    ];

    repository.shiftInstances = [
      {
        id: "shift-1",
        date: "2025-01-06", // Monday
        template_id: "template-1",
        start_dt: new Date("2025-01-06T08:00:00"),
        end_dt: new Date("2025-01-06T16:00:00"),
        notes: "",
      },
      {
        id: "shift-2",
        date: "2025-01-06", // Monday
        template_id: "template-2",
        start_dt: new Date("2025-01-06T22:00:00"),
        end_dt: new Date("2025-01-07T06:00:00"),
        notes: "Cross-midnight shift",
      },
    ];

    repository.assignments = [
      {
        id: "assignment-1",
        shift_instance_id: "shift-1",
        disponent_id: "person-1",
        status: "assigned",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
      {
        id: "assignment-2",
        shift_instance_id: "shift-2",
        disponent_id: "person-2",
        status: "assigned",
        created_at: new Date("2025-01-01"),
        updated_at: new Date("2025-01-01"),
      },
    ];
  });

  describe("exportPeople", () => {
    test("should export people to CSV format", async () => {
      const result = await exportPeople(repository);

      expect(result).toContain("name,email,role,created_at,updated_at");
      expect(result).toContain("John Doe,john@example.com,admin");
      expect(result).toContain("Jane Smith,jane@example.com,disponent");
    });
  });

  describe("exportShiftTemplates", () => {
    test("should export shift templates to CSV format", async () => {
      const result = await exportShiftTemplates(repository);

      expect(result).toContain(
        "name,weekday_mask,days,start_time,end_time,cross_midnight",
      );
      expect(result).toContain('Morning,31,"Mo,Tu,We,Th,Fr",08:00,16:00,false');
      expect(result).toContain(
        'Night,127,"Mo,Tu,We,Th,Fr,Sa,Su",22:00,06:00,true',
      );
    });
  });

  describe("exportAssignments", () => {
    test("should export assignments with cross-midnight and paid hours", async () => {
      const weekStart = new Date("2025-01-06"); // Monday
      const weekEnd = new Date("2025-01-12"); // Sunday

      const result = await exportAssignments(repository, weekStart, weekEnd);

      expect(result).toContain(
        "date,shift_name,start_time,end_time,cross_midnight,duration_minutes,paid_hours",
      );
      expect(result).toContain("2025-01-06,Morning,08:00,16:00,No,480,8.00");
      expect(result).toContain("2025-01-06,Night,22:00,06:00,Yes,480,8.00");
      expect(result).toContain("John Doe,john@example.com,admin");
      expect(result).toContain("Jane Smith,jane@example.com,disponent");
    });

    test("should handle unassigned shifts", async () => {
      // Remove assignments to test unassigned shifts
      repository.assignments = [];

      const weekStart = new Date("2025-01-06");
      const weekEnd = new Date("2025-01-12");

      const result = await exportAssignments(repository, weekStart, weekEnd);

      expect(result).toContain("status");
      expect(result).toContain("unassigned");
      expect(result).toContain("Morning");
      expect(result).toContain("Night");
    });
  });

  describe("exportPerdisWebComm", () => {
    test("should export in Perdis/WebComm format", async () => {
      const weekStart = new Date("2025-01-06");
      const weekEnd = new Date("2025-01-12");

      const result = await exportPerdisWebComm(repository, weekStart, weekEnd);

      expect(result).toContain(
        "PersonalNr,Name,Datum,Schicht,Von,Bis,Stunden,Mitternacht,Status",
      );
      expect(result).toContain(
        "person-1,John Doe,2025-01-06,Morning,08:00,16:00,8.00,0,assigned",
      );
      expect(result).toContain(
        "person-2,Jane Smith,2025-01-06,Night,22:00,06:00,8.00,1,assigned",
      );
    });

    test("should only export assigned shifts", async () => {
      // Remove one assignment
      repository.assignments = repository.assignments.slice(0, 1);

      const weekStart = new Date("2025-01-06");
      const weekEnd = new Date("2025-01-12");

      const result = await exportPerdisWebComm(repository, weekStart, weekEnd);

      const lines = result.split("\n").filter((line) => line.trim());
      expect(lines).toHaveLength(2); // Header + 1 assignment
      expect(result).toContain("John Doe");
      expect(result).not.toContain("Jane Smith");
    });
  });
});

describe("Error Handling", () => {
  test("should handle repository errors gracefully", async () => {
    const failingRepository = {
      getPersons: () => Promise.reject(new Error("Database error")),
    };

    await expect(exportPeople(failingRepository)).rejects.toThrow(
      "Failed to export people: Database error",
    );
  });

  test("should handle malformed CSV gracefully", async () => {
    const repository = new MockRepository();
    const malformedCSV = 'name,email\n"unclosed quote,test@example.com';

    // Should not throw but should handle the malformed data
    const result = await importPeople(malformedCSV, repository);
    expect(result.processed).toBeGreaterThanOrEqual(0);
  });
});
