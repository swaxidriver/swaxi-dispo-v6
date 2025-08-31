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
}

export default EnhancedIndexedDBRepository;