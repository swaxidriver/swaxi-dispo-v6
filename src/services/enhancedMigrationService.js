import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';

import { MigrationService } from './migrationService';
import { EnhancedIndexedDBRepository } from '../repository/EnhancedIndexedDBRepository';
import { SeedService } from './seedService';

import { db } from './firebaseConfig';
import { logInfo, logError } from '../utils/logger';

/**
 * Enhanced migration service that supports the new scheduling data model
 * Extends the existing migration service to handle:
 * - ShiftTemplate
 * - ShiftInstance  
 * - Assignment
 * - Person
 */
export class EnhancedMigrationService extends MigrationService {
  constructor() {
    super();
    this.repository = new EnhancedIndexedDBRepository();
    this.seedService = new SeedService(this.repository);
  }

  /**
   * Migrate data from IndexedDB to Firebase with new schema
   */
  async migrateEnhancedDataToFirebase() {
    let processedCount = 0;
    const BATCH_SIZE = 500;

    try {
      // Ensure seeding is done first
      await this.seedService.seedIfEmpty();

      const collections = [
        { name: 'shift_templates', listMethod: 'listShiftTemplates' },
        { name: 'shift_instances', listMethod: 'listShiftInstances' },
        { name: 'assignments', listMethod: 'listAssignments' },
        { name: 'persons', listMethod: 'listPersons' }
      ];

      for (const { name, listMethod } of collections) {
        const data = await this.repository[listMethod]();
        
        if (data && data.length > 0) {
          for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchData = data.slice(i, i + BATCH_SIZE);
            
            for (const item of batchData) {
              const docRef = doc(collection(db, name));
              batch.set(docRef, {
                ...item,
                id: docRef.id,
                migratedFrom: 'enhanced_indexeddb',
                migrationTimestamp: new Date().toISOString()
              });
              processedCount++;
            }
            
            await batch.commit();
            logInfo(`✅ Migrated ${name} batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchData.length} records`);
          }
        }
      }

      logInfo(`✅ Successfully migrated ${processedCount} enhanced records to Firebase`);
      return { success: true, count: processedCount };
    } catch (error) {
      logError('❌ Enhanced migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import enhanced data from Firebase to IndexedDB
   */
  async importEnhancedDataFromFirebase() {
    try {
      const collections = [
        { name: 'shift_templates', createMethod: 'createShiftTemplate' },
        { name: 'shift_instances', createMethod: 'createShiftInstance' },
        { name: 'assignments', createMethod: 'createAssignment' },
        { name: 'persons', createMethod: 'createPerson' }
      ];

      let totalImported = 0;

      for (const { name, createMethod } of collections) {
        const snapshot = await getDocs(collection(db, name));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        for (const item of data) {
          try {
            await this.repository[createMethod](item);
            totalImported++;
          } catch (error) {
            // Handle conflicts gracefully (e.g., unique constraints)
            if (error.message.includes('already exists')) {
              logInfo(`Skipping existing ${name} record: ${item.id}`);
            } else {
              throw error;
            }
          }
        }
        
        logInfo(`✅ Imported ${data.length} ${name} records`);
      }

      return { success: true, count: totalImported };
    } catch (error) {
      logError('❌ Enhanced import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate the enhanced migration by comparing counts
   */
  async validateEnhancedMigration() {
    try {
      const collections = ['shift_templates', 'shift_instances', 'assignments', 'persons'];
      const listMethods = ['listShiftTemplates', 'listShiftInstances', 'listAssignments', 'listPersons'];
      
      const validation = {
        collections: {},
        totalFirebase: 0,
        totalIndexedDB: 0,
        match: true
      };

      for (let i = 0; i < collections.length; i++) {
        const collectionName = collections[i];
        const listMethod = listMethods[i];
        
        // Get Firebase count
        const firebaseSnapshot = await getDocs(collection(db, collectionName));
        const firebaseCount = firebaseSnapshot.size;
        
        // Get IndexedDB count
        const indexedDBData = await this.repository[listMethod]();
        const indexedDBCount = indexedDBData ? indexedDBData.length : 0;
        
        validation.collections[collectionName] = {
          firebase: firebaseCount,
          indexeddb: indexedDBCount,
          match: firebaseCount === indexedDBCount
        };
        
        validation.totalFirebase += firebaseCount;
        validation.totalIndexedDB += indexedDBCount;
        
        if (firebaseCount !== indexedDBCount) {
          validation.match = false;
        }
      }

      logInfo('Enhanced migration validation:', validation);
      return validation;
    } catch (error) {
      logError('Enhanced validation error:', error);
      return { error: error.message };
    }
  }

  /**
   * Create enhanced backup including all new collections
   */
  async createEnhancedBackup() {
    try {
      const collections = ['shifts', 'users', 'applications', 'notifications', 
                          'shift_templates', 'shift_instances', 'assignments', 'persons'];
      const backup = {
        timestamp: new Date().toISOString(),
        version: '6.0_enhanced',
        data: {}
      };

      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          backup.data[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (_error) {
          // Collection might not exist yet
          backup.data[collectionName] = [];
          logInfo(`Collection ${collectionName} not found, skipping`);
        }
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `swaxi-enhanced-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logInfo(`✅ Enhanced backup created with ${Object.keys(backup.data).length} collections`);
      return backup;
    } catch (error) {
      logError('Enhanced backup failed:', error);
      throw error;
    }
  }

  /**
   * Perform initial setup - seed the database and migrate to Firebase
   */
  async performInitialSetup() {
    try {
      logInfo('🚀 Starting initial setup for enhanced data model...');
      
      // Step 1: Seed the local database if empty
      const seedResult = await this.seedService.seedIfEmpty();
      if (seedResult.seeded) {
        logInfo(`✅ Seeded database with ${seedResult.results.templates} templates, ${seedResult.results.instances} instances, ${seedResult.results.persons} persons`);
      } else {
        logInfo('📊 Database already contains data, skipping seed');
      }

      // Step 2: Migrate to Firebase
      const migrationResult = await this.migrateEnhancedDataToFirebase();
      if (migrationResult.success) {
        logInfo(`✅ Migrated ${migrationResult.count} records to Firebase`);
      } else {
        logError('❌ Firebase migration failed:', migrationResult.error);
        return { success: false, error: migrationResult.error };
      }

      // Step 3: Validate
      const validation = await this.validateEnhancedMigration();
      if (validation.match) {
        logInfo('✅ Validation passed - all data synced correctly');
      } else {
        logInfo('⚠️ Validation warning - some data counts do not match');
      }

      logInfo('🎉 Initial setup completed successfully');
      return {
        success: true,
        seedResult,
        migrationResult,
        validation
      };
    } catch (error) {
      logError('❌ Initial setup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default EnhancedMigrationService;