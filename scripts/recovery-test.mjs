import assert from 'node:assert/strict';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {snapshotCollections,restoreSnapshot} from '../lib/platform/backup.mjs';

assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):\d+$/,'Recovery test must run only against an emulator.');
const app=initializeApp({projectId:'baticamigo-c0384'},'recovery-test');
const db=getFirestore(app);
try {
  const collection='platform_recovery_fixture';
  await db.collection(collection).doc('a').set({kind:'synthetic',value:1});
  await db.collection(collection).doc('b').set({kind:'synthetic',value:2});
  const snapshot=await snapshotCollections(db,[collection]);
  await db.collection(collection).doc('a').delete();
  await db.collection(collection).doc('b').set({kind:'synthetic',value:99});
  await restoreSnapshot(db,snapshot);
  const restored=await db.collection(collection).get();
  const values=Object.fromEntries(restored.docs.map(doc=>[doc.id,doc.data().value]));
  assert.deepEqual(values,{a:1,b:2});
  console.log('PASS: synthetic Firestore snapshot/restore rehearsal.');
} finally {
  const docs=await db.collection('platform_recovery_fixture').get();
  await Promise.all(docs.docs.map(doc=>doc.ref.delete()));
  await app.delete();
}
