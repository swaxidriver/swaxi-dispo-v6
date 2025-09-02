import { ShiftRepository } from "./ShiftRepository";

export class InMemoryShiftRepository extends ShiftRepository {
  constructor(initial = []) {
    super();
    this.shifts = [...initial];
  }
  async list() {
    return this.shifts;
  }
  async create(shift) {
    const withMeta = {
      ...shift,
      id: shift.id || Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shifts.push(withMeta);
    return withMeta;
  }
  async update(id, patch) {
    this.shifts = this.shifts.map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: new Date() } : s,
    );
    return this.shifts.find((s) => s.id === id);
  }
  async applyToShift(id, userId) {
    // In-memory repository does not store applications separately; just append user id to conflicts placeholder
    return this.update(id, { lastApplicant: userId });
  }
  async assignShift(id, userName) {
    return this.update(id, { status: "assigned", assignedTo: userName });
  }
  async cancelShift(id) {
    return this.update(id, { status: "cancelled" });
  }
  async ping() {
    return true;
  }
}

export default InMemoryShiftRepository;
