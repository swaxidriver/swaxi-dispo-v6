import { ShiftRepository } from './ShiftRepository'

// Minimal IndexedDB helper (no external deps) – single object store 'shifts'
const DEFAULT_DB_NAME = 'swaxi_dispo'
const DB_VERSION = 1
const STORE = 'shifts'

function openDb(dbName) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore(dbName, mode, fn) {
  const db = await openDb(dbName)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const result = fn(store)
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
  })
}

export class IndexedDBShiftRepository extends ShiftRepository {
  constructor(opts = {}) {
    super()
    this._dbName = opts.dbName || DEFAULT_DB_NAME
  }
  async list() {
    return withStore(this._dbName, 'readonly', store => {
      return new Promise(res => {
        const shifts = []
        const cursorReq = store.openCursor()
        cursorReq.onsuccess = () => {
          const cur = cursorReq.result
            ; if (cur) { shifts.push(cur.value); cur.continue() } else res(shifts) }
      })
    })
  }
  async create(shift) {
    const entity = { ...shift, id: shift.id || Date.now(), createdAt: new Date(), updatedAt: new Date() }
    await withStore(this._dbName, 'readwrite', store => store.put(entity))
    return entity
  }
  async update(id, patch) {
    const existing = (await this.list()).find(s => s.id === id)
    if (!existing) throw new Error('Shift not found')
    const updated = { ...existing, ...patch, updatedAt: new Date() }
    await withStore(this._dbName, 'readwrite', store => store.put(updated))
    return updated
  }
  async applyToShift(id, userId) {
    return this.update(id, { lastApplicant: userId })
  }
  async assignShift(id, userName) {
    return this.update(id, { status: 'assigned', assignedTo: userName })
  }
  async cancelShift(id) { return this.update(id, { status: 'cancelled' }) }
}

export default IndexedDBShiftRepository
