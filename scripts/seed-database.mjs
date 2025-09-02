#!/usr/bin/env node

/**
 * Database seeding script for the enhanced data model
 * Usage: node scripts/seed-database.mjs
 */

import { SeedService } from "../src/services/seedService.js";
import { EnhancedIndexedDBRepository } from "../src/repository/EnhancedIndexedDBRepository.js";

// Use fake-indexeddb for Node.js environment
if (typeof window === "undefined") {
  global.indexedDB = require("fake-indexeddb");
  global.IDBKeyRange = require("fake-indexeddb/lib/FDBKeyRange");
}

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    const repository = new EnhancedIndexedDBRepository({
      dbName: "swaxi_dispo_seed",
    });
    const seedService = new SeedService(repository);

    // Check if seeding is needed
    const needsSeeding = await seedService.needsSeeding();
    console.log(`📊 Database needs seeding: ${needsSeeding}`);

    if (needsSeeding) {
      // Perform seeding
      const result = await seedService.performSeed();

      if (result.seeded) {
        console.log("✅ Seeding completed successfully!");
        console.log(`   - Templates: ${result.results.templates}`);
        console.log(`   - Instances: ${result.results.instances}`);
        console.log(`   - Persons: ${result.results.persons}`);

        if (result.results.errors.length > 0) {
          console.log("⚠️  Some errors occurred:");
          result.results.errors.forEach((error) =>
            console.log(`   - ${error}`),
          );
        }
      } else {
        console.log("❌ Seeding failed:", result.error);
        process.exit(1);
      }
    } else {
      console.log("📈 Database already contains data, no seeding needed");
    }

    // Show summary
    const templates = await repository.listShiftTemplates();
    const instances = await repository.listShiftInstances();
    const persons = await repository.listPersons();

    console.log("\n📊 Database Summary:");
    console.log(`   - Shift Templates: ${templates.length}`);
    console.log(`   - Shift Instances: ${instances.length}`);
    console.log(`   - Persons: ${persons.length}`);
  } catch (error) {
    console.error("❌ Seeding script failed:", error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
