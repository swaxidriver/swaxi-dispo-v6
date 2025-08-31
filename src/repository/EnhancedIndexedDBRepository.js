import { v4 as uuidv4 } from 'uuid';

import { ShiftRepository } from './ShiftRepository';
import { STORES, DB_VERSION, ASSIGNMENT_STATUS } from './schemas';

// Enhanced IndexedDB repository with support for the new scheduling data model
const DEFAULT_DB_NAME = 'swaxi_dispo_v2';

export class EnhancedIndexedDBRepository extends ShiftRepository {
  constructor(opts = {}) {
    super();
    this.dbName = opts.dbName || DEFAULT_DB_NAME;
    this.db = null;
  }

  async _openDatabase() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        this._performMigrations(db, oldVersion);
      };
    });
  }

  _performMigrations(db, oldVersion) {
    // Migration from version 1 (existing shifts store) to version 2 (new schema)
    if (oldVersion < 2) {
      // Create new object stores
      Object.values(STORES).forEach(storeConfig => {
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          const store = db.createObjectStore(storeConfig.name, { 
            keyPath: storeConfig.keyPath 
          });
          
          // Create indexes
          storeConfig.indexes.forEach(index => {
            store.createIndex(index.name, index.keyPath, { 
              unique: index.unique 
            });
          });
        }
      });
      
      // Keep existing 'shifts' store for backward compatibility during transition
      if (!db.objectStoreNames.contains('shifts')) {
        db.createObjectStore('shifts', { keyPath: 'id' });
      }
    }
  }

  async _withStore(storeName, mode, callback) {
    const db = await this._openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      
      try {
        callback(store, resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // ShiftTemplate operations
  async createShiftTemplate(template) {
    const entity = {
      ...template,
      id: template.id || uuidv4(),
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this._withStore(STORES.SHIFT_TEMPLATES.name, 'readwrite', (store, resolve, reject) => {
      const request = store.add(entity);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return entity;
  }

  async updateShiftTemplate(id, updates) {
    const existing = await this.getShiftTemplate(id);
    if (!existing) throw new Error('ShiftTemplate not found');
    
    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updated_at: new Date()
    };

    await this._withStore(STORES.SHIFT_TEMPLATES.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async getShiftTemplate(id) {
    return this._withStore(STORES.SHIFT_TEMPLATES.name, 'readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listShiftTemplates(filters = {}) {
    const all = await this._withStore(STORES.SHIFT_TEMPLATES.name, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Apply filters
    return all.filter(template => {
      if (filters.active !== undefined && template.active !== filters.active) {
        return false;
      }
      return true;
    });
  }

  // ShiftInstance operations
  async createShiftInstance(instance) {
    const entity = {
      ...instance,
      id: instance.id || uuidv4(),
      active: instance.active !== undefined ? instance.active : true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this._withStore(STORES.SHIFT_INSTANCES.name, 'readwrite', (store, resolve, reject) => {
      const request = store.add(entity);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return entity;
  }

  async updateShiftInstance(id, updates) {
    const existing = await this.getShiftInstance(id);
    if (!existing) throw new Error('ShiftInstance not found');
    
    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updated_at: new Date()
    };

    await this._withStore(STORES.SHIFT_INSTANCES.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async getShiftInstance(id) {
    return this._withStore(STORES.SHIFT_INSTANCES.name, 'readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listShiftInstances(filters = {}) {
    const all = await this._withStore(STORES.SHIFT_INSTANCES.name, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Apply filters
    return all.filter(instance => {
      if (filters.date && instance.date !== filters.date) return false;
      if (filters.template_id && instance.template_id !== filters.template_id) return false;
      if (filters.startDate && instance.date < filters.startDate) return false;
      if (filters.endDate && instance.date > filters.endDate) return false;
      return true;
    });
  }

  // Assignment operations
  async createAssignment(assignment) {
    const entity = {
      ...assignment,
      id: assignment.id || uuidv4(),
      status: assignment.status || ASSIGNMENT_STATUS.ASSIGNED,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await this._withStore(STORES.ASSIGNMENTS.name, 'readwrite', (store, resolve, reject) => {
        const request = store.add(entity);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return entity;
    } catch (error) {
      // Handle unique constraint violation
      if (error.name === 'ConstraintError') {
        throw new Error('Assignment already exists for this shift and person');
      }
      throw error;
    }
  }

  async updateAssignment(id, updates) {
    const existing = await this.getAssignment(id);
    if (!existing) throw new Error('Assignment not found');
    
    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updated_at: new Date()
    };

    await this._withStore(STORES.ASSIGNMENTS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async getAssignment(id) {
    return this._withStore(STORES.ASSIGNMENTS.name, 'readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listAssignments(filters = {}) {
    const all = await this._withStore(STORES.ASSIGNMENTS.name, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Apply filters
    return all.filter(assignment => {
      if (filters.shift_instance_id && assignment.shift_instance_id !== filters.shift_instance_id) return false;
      if (filters.disponent_id && assignment.disponent_id !== filters.disponent_id) return false;
      if (filters.status && assignment.status !== filters.status) return false;
      return true;
    });
  }

  // Person operations
  async createPerson(person) {
    const entity = {
      ...person,
      id: person.id || uuidv4(),
      active: person.active !== undefined ? person.active : true,
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await this._withStore(STORES.PERSONS.name, 'readwrite', (store, resolve, reject) => {
        const request = store.add(entity);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return entity;
    } catch (error) {
      // Handle unique constraint violation
      if (error.name === 'ConstraintError') {
        throw new Error('Person with this email already exists');
      }
      throw error;
    }
  }

  async updatePerson(id, updates) {
    const existing = await this.getPerson(id);
    if (!existing) throw new Error('Person not found');
    
    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updated_at: new Date()
    };

    await this._withStore(STORES.PERSONS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async getPerson(id) {
    return this._withStore(STORES.PERSONS.name, 'readonly', (store, resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listPersons(filters = {}) {
    const all = await this._withStore(STORES.PERSONS.name, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Apply filters
    return all.filter(person => {
      if (filters.role && person.role !== filters.role) return false;
      return true;
    });
  }

  // Alias methods for CSV module compatibility
  async getPersons() {
    return this.listPersons();
  }

  async getShiftTemplates() {
    return this.listShiftTemplates();
  }

  async getShiftInstances() {
    return this.listShiftInstances();
  }

  async getAssignments() {
    return this.listAssignments();
  }

  // Legacy compatibility methods for existing ShiftRepository interface
  async list(filter = {}) {
    // This could either return shift instances or maintain backward compatibility
    // For now, return shift instances to align with new schema
    return this.listShiftInstances(filter);
  }

  async create(shift) {
    // Legacy method - could create a shift instance
    return this.createShiftInstance(shift);
  }

  async update(id, patch) {
    return this.updateShiftInstance(id, patch);
  }

  async ping() {
    try {
      await this._openDatabase();
      return true;
    } catch {
      return false;
    }
  }

  // Transaction operations for swaps
  async swapAssignments(assignment1Id, assignment2Id) {
    const db = await this._openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ASSIGNMENTS.name], 'readwrite');
      const store = transaction.objectStore(STORES.ASSIGNMENTS.name);
      
      let assignment1 = null;
      let assignment2 = null;
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error('Swap transaction failed: ' + transaction.error));
      };
      
      transaction.onabort = () => {
        reject(new Error('Swap transaction was aborted'));
      };
      
      // Get both assignments
      const get1 = store.get(assignment1Id);
      get1.onsuccess = () => {
        assignment1 = get1.result;
        if (!assignment1) {
          transaction.abort();
          reject(new Error('Assignment 1 not found'));
          return;
        }
        
        const get2 = store.get(assignment2Id);
        get2.onsuccess = () => {
          assignment2 = get2.result;
          if (!assignment2) {
            transaction.abort();
            reject(new Error('Assignment 2 not found'));
            return;
          }
          
          // Swap the shift assignments
          const tempShiftId = assignment1.shift_instance_id;
          assignment1.shift_instance_id = assignment2.shift_instance_id;
          assignment2.shift_instance_id = tempShiftId;
          
          // Update timestamps
          assignment1.updated_at = new Date();
          assignment2.updated_at = new Date();
          
          // Put back the updated assignments
          const put1 = store.put(assignment1);
          put1.onerror = () => {
            transaction.abort();
          };
          
          const put2 = store.put(assignment2);
          put2.onerror = () => {
            transaction.abort();
          };
        };
        
        get2.onerror = () => {
          transaction.abort();
          reject(new Error('Failed to get assignment 2'));
        };
      };
      
      get1.onerror = () => {
        transaction.abort();
        reject(new Error('Failed to get assignment 1'));
      };
    });
  }

  async bulkUpdateAssignments(updates) {
    const db = await this._openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.ASSIGNMENTS.name], 'readwrite');
      const store = transaction.objectStore(STORES.ASSIGNMENTS.name);
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error('Bulk update transaction failed: ' + transaction.error));
      };
      
      let completedOperations = 0;
      const totalOperations = updates.length;
      
      for (const update of updates) {
        const getRequest = store.get(update.id);
        
        getRequest.onsuccess = () => {
          const assignment = getRequest.result;
          if (!assignment) {
            transaction.abort();
            reject(new Error(`Assignment ${update.id} not found`));
            return;
          }
          
          // Apply updates
          const updatedAssignment = {
            ...assignment,
            ...update,
            id: assignment.id, // Preserve original ID
            updated_at: new Date()
          };
          
          const putRequest = store.put(updatedAssignment);
          putRequest.onsuccess = () => {
            completedOperations++;
            if (completedOperations === totalOperations) {
              // All operations completed successfully
            }
          };
          
          putRequest.onerror = () => {
            transaction.abort();
          };
        };
        
        getRequest.onerror = () => {
          transaction.abort();
          reject(new Error(`Failed to get assignment ${update.id}`));
        };
      }
      
      if (totalOperations === 0) {
        resolve();
      }
    });
  }

  // Soft delete operations
  async softDeletePerson(id) {
    const existing = await this.getPerson(id);
    if (!existing) throw new Error('Person not found');
    
    const updated = {
      ...existing,
      deleted_at: new Date(),
      active: false,
      updated_at: new Date()
    };

    await this._withStore(STORES.PERSONS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async restorePerson(id) {
    const existing = await this.getPerson(id);
    if (!existing) throw new Error('Person not found');
    
    const updated = {
      ...existing,
      deleted_at: null,
      active: true,
      updated_at: new Date()
    };

    await this._withStore(STORES.PERSONS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    return updated;
  }

  async softDeleteShiftTemplate(id) {
    const existing = await this.getShiftTemplate(id);
    if (!existing) throw new Error('ShiftTemplate not found');
    
    // Soft delete the template
    const updated = {
      ...existing,
      deleted_at: new Date(),
      active: false,
      updated_at: new Date()
    };

    await this._withStore(STORES.SHIFT_TEMPLATES.name, 'readwrite', (store, resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Deactivate all instances from this template
    const instances = await this.listShiftInstances({ template_id: id });
    for (const instance of instances) {
      await this.updateShiftInstance(instance.id, { active: false });
    }

    return updated;
  }

  // Cascade delete operations
  async cascadeDeleteShiftInstance(id) {
    const db = await this._openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SHIFT_INSTANCES.name, STORES.ASSIGNMENTS.name], 'readwrite');
      const instanceStore = transaction.objectStore(STORES.SHIFT_INSTANCES.name);
      const assignmentStore = transaction.objectStore(STORES.ASSIGNMENTS.name);
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error('Cascade delete transaction failed: ' + transaction.error));
      };
      
      // First delete related assignments
      const assignmentIndex = assignmentStore.index('shift_instance_id');
      const assignmentCursor = assignmentIndex.openCursor(IDBKeyRange.only(id));
      
      assignmentCursor.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          // All assignments deleted, now delete the shift instance
          const deleteInstance = instanceStore.delete(id);
          deleteInstance.onerror = () => {
            transaction.abort();
          };
        }
      };
      
      assignmentCursor.onerror = () => {
        transaction.abort();
        reject(new Error('Failed to delete related assignments'));
      };
    });
  }

  // Hard delete operations with referential integrity checks
  async hardDeletePerson(id) {
    // Check for existing assignments
    const assignments = await this.listAssignments({ disponent_id: id });
    if (assignments.length > 0) {
      throw new Error('Cannot delete person with existing assignments');
    }
    
    await this._withStore(STORES.PERSONS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async hardDeleteAssignment(id) {
    await this._withStore(STORES.ASSIGNMENTS.name, 'readwrite', (store, resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Override listPersons to support includeDeleted option
  async listPersons(filters = {}) {
    const all = await this._withStore(STORES.PERSONS.name, 'readonly', (store, resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    // Apply filters
    return all.filter(person => {
      if (filters.role && person.role !== filters.role) return false;
      if (!filters.includeDeleted && person.deleted_at) return false;
      return true;
    });
  }
}

export default EnhancedIndexedDBRepository;