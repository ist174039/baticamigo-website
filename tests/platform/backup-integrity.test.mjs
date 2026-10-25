import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotDigest,verifySnapshot} from '../../lib/platform/backup.mjs';

test('snapshot integrity detects tampering',()=>{
  const snapshot={schemaVersion:1,createdAt:'2026-10-25T00:00:00.000Z',collections:{platform_test:[{id:'a',data:{value:1}}]}};
  snapshot.integrity={algorithm:'sha256',value:snapshotDigest(snapshot)};
  assert.equal(verifySnapshot(snapshot),true);
  snapshot.collections.platform_test[0].data.value=2;
  assert.throws(()=>verifySnapshot(snapshot),/integrity/);
});
