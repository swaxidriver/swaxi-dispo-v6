import { EnhancedIndexedDBRepository } from "../src/repository/EnhancedIndexedDBRepository";
import { ASSIGNMENT_STATUS } from "../src/repository/schemas";
import "fake-indexeddb/auto";

describe("Database Performance Tests", () => {
  let repository;

  beforeEach(async () => {
    // Use a unique database name for each test
    const dbName = `perf_test_db_${Date.now()}_${Math.random()}`;
    repository = new EnhancedIndexedDBRepository({ dbName });
  });

  afterEach(async () => {
    // Clean up the database
    if (repository.db) {
      repository.db.close();
    }
  });

  // Helper function to generate test data
  async function generateTestData(count) {
    const templates = [];
    const instances = [];
    const persons = [];
    const assignments = [];

    console.log(
      `Generating ${count} shift instances for performance testing...`,
    );

    // Create a few templates
    for (let i = 0; i < 5; i++) {
      const template = await repository.createShiftTemplate({
        name: `Template ${i}`,
        weekday_mask: 31, // Monday-Friday
        start_time: "09:00",
        end_time: "17:00",
        cross_midnight: false,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        active: true,
      });
      templates.push(template);
    }

    // Create persons
    for (let i = 0; i < Math.min(count / 10, 100); i++) {
      const person = await repository.createPerson({
        name: `Person ${i}`,
        email: `person${i}@example.com`,
        role: i % 3 === 0 ? "manager" : "disponent",
      });
      persons.push(person);
    }

    // Create shift instances with varied dates
    const baseDate = new Date("2024-01-01");
    for (let i = 0; i < count; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + Math.floor(i / 5)); // 5 shifts per day

      const startTime = 9 + (i % 3) * 4; // 9am, 1pm, 5pm shifts
      const startDt = new Date(date);
      startDt.setHours(startTime, 0, 0, 0);

      const endDt = new Date(startDt);
      endDt.setHours(startTime + 8, 0, 0, 0); // 8-hour shifts

      const instance = await repository.createShiftInstance({
        date: date.toISOString().split("T")[0],
        start_dt: startDt,
        end_dt: endDt,
        template_id: templates[i % templates.length].id,
        notes: i % 10 === 0 ? `Notes for shift ${i}` : null,
      });
      instances.push(instance);

      // Create some assignments (50% of shifts get assigned)
      if (i % 2 === 0 && persons.length > 0) {
        const assignment = await repository.createAssignment({
          shift_instance_id: instance.id,
          disponent_id: persons[i % persons.length].id,
          status:
            i % 3 === 0
              ? ASSIGNMENT_STATUS.ASSIGNED
              : ASSIGNMENT_STATUS.TENTATIVE,
        });
        assignments.push(assignment);
      }
    }

    return { templates, instances, persons, assignments };
  }

  describe("Index Performance", () => {
    test("should efficiently query by start_dt index with 1000 shift instances", async () => {
      const { instances } = await generateTestData(1000);

      const testDate = new Date("2024-01-15T09:00:00");

      const startTime = performance.now();

      // This should use the start_dt index for efficient querying
      const results = await repository.listShiftInstances({
        startDate: "2024-01-15",
        endDate: "2024-01-15",
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(
        `Query time for date range on 1000 instances: ${queryTime.toFixed(2)}ms`,
      );
      console.log(`Found ${results.length} instances for date 2024-01-15`);

      // Should be reasonably fast even with 1000 records
      expect(queryTime).toBeLessThan(100); // 100ms threshold
      expect(results.length).toBeGreaterThan(0);

      // Verify results are correct
      results.forEach((instance) => {
        expect(instance.date).toBe("2024-01-15");
      });
    });

    test("should efficiently query by end_dt index with 1000 shift instances", async () => {
      const { instances } = await generateTestData(1000);

      const startTime = performance.now();

      // Query for shifts ending before a certain time
      const cutoffDate = new Date("2024-01-10T23:59:59");
      const results = await repository.listShiftInstances({
        endDate: "2024-01-10",
      });

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(
        `Query time for end date filter on 1000 instances: ${queryTime.toFixed(2)}ms`,
      );
      console.log(`Found ${results.length} instances ending by 2024-01-10`);

      expect(queryTime).toBeLessThan(100);

      // Verify results
      results.forEach((instance) => {
        expect(instance.date <= "2024-01-10").toBe(true);
      });
    });
  });

  describe("Pagination Performance", () => {
    test("should support pagination for large datasets", async () => {
      const { instances } = await generateTestData(500);

      const pageSize = 50;
      let allResults = [];
      let page = 0;
      let hasMore = true;

      const startTime = performance.now();

      while (hasMore) {
        const results = await repository.listShiftInstances(
          {},
          {
            page,
            pageSize,
          },
        );

        if (results.length === 0) {
          hasMore = false;
        } else {
          allResults = allResults.concat(results);
          page++;
        }

        // Prevent infinite loops in test
        if (page > 20) break;
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `Paginated retrieval of ${allResults.length} instances took ${totalTime.toFixed(2)}ms`,
      );
      console.log(`Retrieved ${page} pages of ${pageSize} items each`);

      expect(totalTime).toBeLessThan(500); // 500ms total for all pages
      expect(allResults.length).toBe(500);
      expect(page).toBe(10); // 500 / 50 = 10 pages
    });

    test("should handle pagination with filters efficiently", async () => {
      const { instances, templates } = await generateTestData(300);

      const templateId = templates[0].id;
      const pageSize = 25;

      const startTime = performance.now();

      const firstPage = await repository.listShiftInstances(
        {
          template_id: templateId,
        },
        {
          page: 0,
          pageSize,
        },
      );

      const secondPage = await repository.listShiftInstances(
        {
          template_id: templateId,
        },
        {
          page: 1,
          pageSize,
        },
      );

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      console.log(`Paginated filtered query time: ${queryTime.toFixed(2)}ms`);
      console.log(
        `First page: ${firstPage.length}, Second page: ${secondPage.length} items`,
      );

      expect(queryTime).toBeLessThan(50);
      expect(firstPage.length).toBeLessThanOrEqual(pageSize);
      expect(secondPage.length).toBeLessThanOrEqual(pageSize);

      // Verify no duplicates between pages
      const firstPageIds = firstPage.map((i) => i.id);
      const secondPageIds = secondPage.map((i) => i.id);
      const intersection = firstPageIds.filter((id) =>
        secondPageIds.includes(id),
      );
      expect(intersection).toHaveLength(0);

      // Verify all results match filter
      [...firstPage, ...secondPage].forEach((instance) => {
        expect(instance.template_id).toBe(templateId);
      });
    });
  });

  describe("Load Testing", () => {
    test("should handle concurrent read operations efficiently", async () => {
      const { instances } = await generateTestData(200);

      const startTime = performance.now();

      // Simulate concurrent read operations
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(repository.listShiftInstances());
        promises.push(repository.listAssignments());
        promises.push(repository.listPersons());
        promises.push(repository.listShiftTemplates());
      }

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `40 concurrent read operations completed in ${totalTime.toFixed(2)}ms`,
      );

      expect(totalTime).toBeLessThan(1000); // 1 second for 40 operations
      expect(results).toHaveLength(40);

      // Verify all operations returned data
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    test("should maintain performance with mixed read/write operations", async () => {
      const { templates, persons } = await generateTestData(100);

      const startTime = performance.now();

      const operations = [];

      // Mix of read and write operations
      for (let i = 0; i < 50; i++) {
        // Create instances
        operations.push(
          repository.createShiftInstance({
            date: `2024-02-${String((i % 28) + 1).padStart(2, "0")}`,
            start_dt: new Date(
              `2024-02-${String((i % 28) + 1).padStart(2, "0")}T09:00:00`,
            ),
            end_dt: new Date(
              `2024-02-${String((i % 28) + 1).padStart(2, "0")}T17:00:00`,
            ),
            template_id: templates[i % templates.length].id,
          }),
        );

        // Read operations
        if (i % 5 === 0) {
          operations.push(repository.listShiftInstances());
        }
      }

      const results = await Promise.all(operations);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(
        `Mixed 50 write + 10 read operations completed in ${totalTime.toFixed(2)}ms`,
      );

      expect(totalTime).toBeLessThan(2000); // 2 seconds for mixed operations
      expect(results).toHaveLength(60); // 50 creates + 10 reads
    });
  });
});
