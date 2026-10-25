function assertEmulator() {
  const host=String(process.env.FIRESTORE_EMULATOR_HOST||'');
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new Error('Snapshot/restore helper is restricted to the Firestore emulator.');
}
export async function snapshotCollections(db,names) {
  assertEmulator();
  const snapshot={schemaVersion:1,createdAt:new Date().toISOString(),collections:{}};
  for(const name of names) {
    if(!/^platform_[a-z0-9_]+$/.test(name)) throw new Error('Invalid collection name.');
    const result=await db.collection(name).get();
    snapshot.collections[name]=result.docs.map(doc=>({id:doc.id,data:doc.data()}));
  }
  return snapshot;
}
export async function restoreSnapshot(db,snapshot) {
  assertEmulator();
  if(snapshot?.schemaVersion!==1||!snapshot.collections||typeof snapshot.collections!=='object') throw new Error('Invalid snapshot.');
  for(const [name,docs] of Object.entries(snapshot.collections)) {
    if(!/^platform_[a-z0-9_]+$/.test(name)||!Array.isArray(docs)) throw new Error('Invalid snapshot collection.');
    for(const item of docs) {
      if(!item?.id||typeof item.data!=='object'||Array.isArray(item.data)) throw new Error('Invalid snapshot document.');
      await db.collection(name).doc(item.id).set(item.data);
    }
  }
}
