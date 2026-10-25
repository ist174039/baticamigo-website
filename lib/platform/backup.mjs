import {createHash} from 'node:crypto';

function assertEmulator() {
  const host=String(process.env.FIRESTORE_EMULATOR_HOST||'');
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Snapshot/restore helper is restricted to the Firestore emulator.');
}
function digestValue(value) {
  if(value===null||['string','number','boolean'].includes(typeof value)) return value;
  if(Array.isArray(value)) return value.map(digestValue);
  if(value instanceof Date) return {__date:value.toISOString()};
  if(value&&typeof value.toDate==='function') return {__timestamp:value.toDate().toISOString()};
  if(value&&typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map(key=>[key,digestValue(value[key])]));
  return String(value);
}
export function snapshotDigest(snapshot) {
  const payload={schemaVersion:snapshot?.schemaVersion,createdAt:snapshot?.createdAt,collections:digestValue(snapshot?.collections||{})};
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}
export async function snapshotCollections(db,names) {
  assertEmulator();
  const snapshot={schemaVersion:1,createdAt:new Date().toISOString(),collections:{}};
  for(const name of names) {
    if(!/^platform_[a-z0-9_]+$/.test(name)) throw new Error('Invalid collection name.');
    const result=await db.collection(name).get();
    snapshot.collections[name]=result.docs.map(doc=>({id:doc.id,data:doc.data()}));
  }
  snapshot.integrity={algorithm:'sha256',value:snapshotDigest(snapshot)};
  return snapshot;
}
export function verifySnapshot(snapshot) {
  if(snapshot?.schemaVersion!==1||!snapshot.collections||typeof snapshot.collections!=='object') throw new Error('Invalid snapshot.');
  if(snapshot?.integrity?.algorithm!=='sha256'||!/^[a-f0-9]{64}$/.test(String(snapshot.integrity.value||''))) throw new Error('Snapshot integrity metadata missing.');
  if(snapshotDigest(snapshot)!==snapshot.integrity.value) throw new Error('Snapshot integrity check failed.');
  return true;
}
export async function restoreSnapshot(db,snapshot) {
  assertEmulator();
  verifySnapshot(snapshot);
  for(const [name,docs] of Object.entries(snapshot.collections)) {
    if(!/^platform_[a-z0-9_]+$/.test(name)||!Array.isArray(docs)) throw new Error('Invalid snapshot collection.');
    for(const item of docs) {
      if(!item?.id||typeof item.data!=='object'||Array.isArray(item.data)) throw new Error('Invalid snapshot document.');
      await db.collection(name).doc(item.id).set(item.data);
    }
  }
}
