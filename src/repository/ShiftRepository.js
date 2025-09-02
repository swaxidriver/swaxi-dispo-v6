// ShiftRepository interface (documentation only)
// Methods return Promises to allow async backends (SharePoint / future DB)
// Implementations: InMemoryShiftRepository, SharePointShiftRepository
// Shape (Shift): {
//   id: string|number, date: Date|string, start: string, end: string, type: string,
//   status: 'open'|'assigned'|'cancelled', assignedTo: string|null, workLocation: string,
//   conflicts: string[], createdAt?: Date, updatedAt?: Date
// }

export class ShiftRepository {
  /** @returns {Promise<Array>} */ async list(_filter = {}) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<object>} */ async create(_shift) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<object>} */ async update(_id, _patch) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<object>} */ async applyToShift(_id, _userId) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<object>} */ async assignShift(_id, _userName) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<object>} */ async cancelShift(_id) {
    throw new Error("not implemented");
  }
  /** @returns {Promise<boolean>} */ async ping() {
    return true;
  }
}
