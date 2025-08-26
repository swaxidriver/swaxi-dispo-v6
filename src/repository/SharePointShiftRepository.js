import { ShiftRepository } from './ShiftRepository'
import { sharePointService } from '../services/sharePointService'

// Adapter wrapping existing sharePointService functions to conform to repository interface.
export class SharePointShiftRepository extends ShiftRepository {
  async list() {
    return sharePointService.getShifts()
  }
  async create(shift) {
    return sharePointService.createShift(shift)
  }
  async update(id, patch) {
    await sharePointService.updateShift(id, patch)
    // Re-fetch single shift (simplest path) – could optimize later
    const all = await this.list()
    return all.find(s => String(s.id) === String(id))
  }
  async applyToShift(id, userId) {
    // For MVP just log audit; real implementation would write to Applications list
    await sharePointService.logAudit('APPLY_SHIFT', { shiftId: id, userId })
    return { success: true }
  }
  async assignShift(id, userName) {
    await sharePointService.updateShift(id, { status: 'assigned', AssignedTo: userName })
    return { success: true }
  }
  async cancelShift(id) {
    await sharePointService.updateShift(id, { status: 'cancelled' })
    return { success: true }
  }
}

export default SharePointShiftRepository
