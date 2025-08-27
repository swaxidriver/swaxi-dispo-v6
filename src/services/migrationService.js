// src/services/migrationService.js
import { collection, writeBatch, doc, getDocs } from 'firebase/firestore';

import { logInfo, logError } from '../utils/logger';

import { db } from './firebaseConfig';

export class MigrationService {
  async exportLocalStorageData() {
    const data = {
      shifts: JSON.parse(localStorage.getItem('swaxi-dispo-state') || '{"shifts": []}'),
      auth: JSON.parse(localStorage.getItem('swaxi-auth') || '{}'),
      timestamp: new Date().toISOString(),
      version: '5.3'
    };

    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `swaxi-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return data;
  }

  async importToFirebase(jsonData) {
    let processedCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit

    try {
      // Import shifts in batches
      if (jsonData.shifts && Array.isArray(jsonData.shifts)) {
        const shifts = jsonData.shifts;
        
        for (let i = 0; i < shifts.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const batchShifts = shifts.slice(i, i + BATCH_SIZE);
          
          for (const shift of batchShifts) {
            const shiftRef = doc(collection(db, 'shifts'));
            batch.set(shiftRef, {
              ...shift,
              id: shiftRef.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              migratedFrom: 'localStorage'
            });
            processedCount++;
          }
          
          await batch.commit();
          logInfo(`✅ Migrated batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batchShifts.length} records`);
        }
      }
      
      logInfo(`✅ Successfully migrated ${processedCount} records to Firebase`);
      return { success: true, count: processedCount };
    } catch (error) {
      logError('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  async validateMigration() {
    try {
      const shiftsSnapshot = await getDocs(collection(db, 'shifts'));
      const firebaseShiftCount = shiftsSnapshot.size;
      
      const localStorageData = JSON.parse(localStorage.getItem('swaxi-dispo-state') || '{"shifts": []}');
      const localShiftCount = localStorageData.shifts?.length || 0;

      const validation = {
        firebase: firebaseShiftCount,
        localStorage: localShiftCount,
        match: firebaseShiftCount === localShiftCount,
        difference: Math.abs(firebaseShiftCount - localShiftCount)
      };

      logInfo('Migration validation:', validation);
      return validation;
    } catch (error) {
      logError('Validation error:', error);
      return { error: error.message };
    }
  }

  async createBackup() {
    try {
      const collections = ['shifts', 'users', 'applications', 'notifications'];
      const backup = {
        timestamp: new Date().toISOString(),
        data: {}
      };

      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        backup.data[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `swaxi-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return backup;
    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }
}
