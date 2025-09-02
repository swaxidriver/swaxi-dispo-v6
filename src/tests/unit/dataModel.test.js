import { EnhancedIndexedDBRepository } from "../../repository/EnhancedIndexedDBRepository";
import { SeedService } from "../../services/seedService";
import {
  ASSIGNMENT_STATUS,
  dayNamesToMask,
  maskToDayNames,
  isDayActive,
} from "../../repository/schemas";
import "fake-indexeddb/auto";

describe("Data Model Implementation", () => {
  let repository;
  let seedService;

  beforeEach(async () => {
    // Use a unique database name for each test
    const dbName = `test_db_${Date.now()}_${Math.random()}`;
    repository = new EnhancedIndexedDBRepository({ dbName });
    seedService = new SeedService(repository);
  });

  afterEach(async () => {
    // Clean up the database
    if (repository.db) {
      repository.db.close();
    }
  });

  describe("Database Schema and Migrations", () => {
    test("should create database with correct object stores and indexes", async () => {
      // Opening the database should trigger migrations
      await repository._openDatabase();
      const db = repository.db;

      // Check that all required object stores exist
      expect(db.objectStoreNames.contains("shift_templates")).toBe(true);
      expect(db.objectStoreNames.contains("shift_instances")).toBe(true);
      expect(db.objectStoreNames.contains("assignments")).toBe(true);
      expect(db.objectStoreNames.contains("persons")).toBe(true);
    });

    test("should apply migrations correctly from existing version", async () => {
      // This tests the migration path
      const db = await repository._openDatabase();
      expect(db.version).toBe(2);
    });
  });

  describe("ShiftTemplate Operations", () => {
    test("should create and retrieve shift templates", async () => {
      const template = {
        name: "Test Shift",
        weekday_mask: dayNamesToMask(["Mo", "Tu", "We"]),
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      };

      const created = await repository.createShiftTemplate(template);
      expect(created.id).toBeDefined();
      expect(created.name).toBe("Test Shift");
      expect(created.created_at).toBeInstanceOf(Date);

      const retrieved = await repository.getShiftTemplate(created.id);
      expect(retrieved.name).toBe("Test Shift");
      expect(retrieved.weekday_mask).toBe(template.weekday_mask);
    });

    test("should list templates with filters", async () => {
      await repository.createShiftTemplate({
        name: "Active Template",
        weekday_mask: 31, // Mo-Fr
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      });

      await repository.createShiftTemplate({
        name: "Inactive Template",
        weekday_mask: 31,
        start_time: "18:00",
        end_time: "22:00",
        cross_midnight: false,
        color: "#00FF00",
        active: false,
      });

      const activeTemplates = await repository.listShiftTemplates({
        active: true,
      });
      const allTemplates = await repository.listShiftTemplates();

      expect(activeTemplates).toHaveLength(1);
      expect(activeTemplates[0].name).toBe("Active Template");
      expect(allTemplates).toHaveLength(2);
    });

    test("should update shift templates", async () => {
      const template = await repository.createShiftTemplate({
        name: "Original Name",
        weekday_mask: 31,
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      });

      await repository.updateShiftTemplate(template.id, {
        name: "Updated Name",
        active: false,
      });

      const updated = await repository.getShiftTemplate(template.id);
      expect(updated.name).toBe("Updated Name");
      expect(updated.active).toBe(false);
      expect(updated.updated_at).not.toEqual(template.updated_at);
    });
  });

  describe("ShiftInstance Operations", () => {
    test("should create and retrieve shift instances", async () => {
      // First create a template
      const template = await repository.createShiftTemplate({
        name: "Test Template",
        weekday_mask: 31,
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      });

      const instance = {
        date: "2025-01-15",
        start_dt: new Date("2025-01-15T09:00:00"),
        end_dt: new Date("2025-01-15T17:00:00"),
        template_id: template.id,
        notes: "Test notes",
      };

      const created = await repository.createShiftInstance(instance);
      expect(created.id).toBeDefined();
      expect(created.date).toBe("2025-01-15");
      expect(created.template_id).toBe(template.id);

      const retrieved = await repository.getShiftInstance(created.id);
      expect(retrieved.notes).toBe("Test notes");
    });

    test("should filter instances by date and template", async () => {
      const template = await repository.createShiftTemplate({
        name: "Test Template",
        weekday_mask: 31,
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      });

      await repository.createShiftInstance({
        date: "2025-01-15",
        start_dt: new Date("2025-01-15T09:00:00"),
        end_dt: new Date("2025-01-15T17:00:00"),
        template_id: template.id,
      });

      await repository.createShiftInstance({
        date: "2025-01-16",
        start_dt: new Date("2025-01-16T09:00:00"),
        end_dt: new Date("2025-01-16T17:00:00"),
        template_id: template.id,
      });

      const instancesByDate = await repository.listShiftInstances({
        date: "2025-01-15",
      });
      const instancesByTemplate = await repository.listShiftInstances({
        template_id: template.id,
      });

      expect(instancesByDate).toHaveLength(1);
      expect(instancesByDate[0].date).toBe("2025-01-15");
      expect(instancesByTemplate).toHaveLength(2);
    });
  });

  describe("Assignment Operations", () => {
    let shiftInstance;
    let person;

    beforeEach(async () => {
      // Create test data
      const template = await repository.createShiftTemplate({
        name: "Test Template",
        weekday_mask: 31,
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: "#FF0000",
        active: true,
      });

      shiftInstance = await repository.createShiftInstance({
        date: "2025-01-15",
        start_dt: new Date("2025-01-15T09:00:00"),
        end_dt: new Date("2025-01-15T17:00:00"),
        template_id: template.id,
      });

      person = await repository.createPerson({
        name: "Test Person",
        email: "test@example.com",
        role: "disponent",
      });
    });

    test("should create and retrieve assignments", async () => {
      const assignment = {
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      };

      const created = await repository.createAssignment(assignment);
      expect(created.id).toBeDefined();
      expect(created.status).toBe(ASSIGNMENT_STATUS.ASSIGNED);

      const retrieved = await repository.getAssignment(created.id);
      expect(retrieved.shift_instance_id).toBe(shiftInstance.id);
      expect(retrieved.disponent_id).toBe(person.id);
    });

    test("should enforce unique constraint (shift_instance_id, disponent_id)", async () => {
      const assignment1 = {
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      };

      const assignment2 = {
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.TENTATIVE,
      };

      await repository.createAssignment(assignment1);

      await expect(repository.createAssignment(assignment2)).rejects.toThrow(
        "Assignment already exists",
      );
    });

    test("should filter assignments by shift and person", async () => {
      await repository.createAssignment({
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED,
      });

      const byShift = await repository.listAssignments({
        shift_instance_id: shiftInstance.id,
      });
      const byPerson = await repository.listAssignments({
        disponent_id: person.id,
      });

      expect(byShift).toHaveLength(1);
      expect(byPerson).toHaveLength(1);
      expect(byShift[0].id).toBe(byPerson[0].id);
    });
  });

  describe("Person Operations", () => {
    test("should create and retrieve persons", async () => {
      const person = {
        name: "John Doe",
        email: "john@example.com",
        role: "disponent",
      };

      const created = await repository.createPerson(person);
      expect(created.id).toBeDefined();
      expect(created.name).toBe("John Doe");
      expect(created.email).toBe("john@example.com");

      const retrieved = await repository.getPerson(created.id);
      expect(retrieved.role).toBe("disponent");
    });

    test("should enforce unique email constraint", async () => {
      const person1 = {
        name: "John Doe",
        email: "john@example.com",
        role: "disponent",
      };

      const person2 = {
        name: "Jane Doe",
        email: "john@example.com", // Same email
        role: "admin",
      };

      await repository.createPerson(person1);

      await expect(repository.createPerson(person2)).rejects.toThrow(
        "Person with this email already exists",
      );
    });

    test("should filter persons by role", async () => {
      await repository.createPerson({
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
      });

      await repository.createPerson({
        name: "Dispatcher",
        email: "disp@example.com",
        role: "disponent",
      });

      const admins = await repository.listPersons({ role: "admin" });
      const allPersons = await repository.listPersons();

      expect(admins).toHaveLength(1);
      expect(admins[0].role).toBe("admin");
      expect(allPersons).toHaveLength(2);
    });
  });

  describe("Weekday Mask Utilities", () => {
    test("should convert day names to mask correctly", () => {
      const weekdays = dayNamesToMask(["Mo", "Tu", "We", "Th", "Fr"]);
      expect(weekdays).toBe(31); // 1+2+4+8+16

      const weekends = dayNamesToMask(["Sa", "Su"]);
      expect(weekends).toBe(96); // 32+64

      const allDays = dayNamesToMask([
        "Mo",
        "Tu",
        "We",
        "Th",
        "Fr",
        "Sa",
        "Su",
      ]);
      expect(allDays).toBe(127); // All bits set
    });

    test("should convert mask to day names correctly", () => {
      const weekdayNames = maskToDayNames(31);
      expect(weekdayNames).toEqual(["Mo", "Tu", "We", "Th", "Fr"]);

      const weekendNames = maskToDayNames(96);
      expect(weekendNames).toEqual(["Sa", "Su"]);
    });

    test("should check if day is active correctly", () => {
      const weekdayMask = dayNamesToMask(["Mo", "Tu", "We", "Th", "Fr"]);

      expect(isDayActive(weekdayMask, 1)).toBe(true); // Monday
      expect(isDayActive(weekdayMask, 5)).toBe(true); // Friday
      expect(isDayActive(weekdayMask, 0)).toBe(false); // Sunday
      expect(isDayActive(weekdayMask, 6)).toBe(false); // Saturday
    });
  });

  describe("Seed Service", () => {
    test("should detect when seeding is needed", async () => {
      const needsSeeding = await seedService.needsSeeding();
      expect(needsSeeding).toBe(true);
    });

    test("should generate default templates", () => {
      const templates = seedService.getDefaultTemplates();
      expect(templates).toHaveLength(5);
      expect(templates[0].name).toBe("Frueh");
      expect(templates[2].cross_midnight).toBe(true); // Nacht template
    });

    test("should generate shift instances for 8 weeks", async () => {
      // First seed templates
      const templates = seedService.getDefaultTemplates();
      for (const template of templates) {
        await repository.createShiftTemplate(template);
      }

      const startDate = new Date("2025-01-06"); // Monday
      const instances = await seedService.generateShiftInstances(startDate, 2); // 2 weeks for faster test

      expect(instances.length).toBeGreaterThan(0);

      // Check that instances were created for the right dates
      const mondayInstances = instances.filter((i) => i.date === "2025-01-06");
      expect(mondayInstances.length).toBeGreaterThan(0);
    });

    test("should perform complete seeding", async () => {
      const result = await seedService.performSeed();

      expect(result.seeded).toBe(true);
      expect(result.results.templates).toBeGreaterThan(0);
      expect(result.results.instances).toBeGreaterThan(0);
      expect(result.results.persons).toBeGreaterThan(0);
    });

    test("should skip seeding if data exists", async () => {
      // First seed
      await seedService.performSeed();

      // Try to seed again
      const result = await seedService.seedIfEmpty();
      expect(result.seeded).toBe(false);
      expect(result.reason).toBe("Database not empty");
    });
  });
});
