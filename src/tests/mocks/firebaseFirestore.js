// Lightweight firestore test stub used via jest moduleNameMapper
let batchOps = []
export const collection = (_db, name) => ({ __type: 'collection', name })
export const doc = (coll) => ({ id: `id_${batchOps.length + 1}`, coll })
export const writeBatch = () => ({
  set: (ref, data) => batchOps.push({ op: 'set', ref, data }),
  commit: async () => true
})
export const getDocs = async (coll) => ({ size: coll.name === 'shifts' ? 2 : 0, docs: [{ id: 'a', data: () => ({ foo: 'bar' }) }] })
export function __reset() { batchOps = [] }
