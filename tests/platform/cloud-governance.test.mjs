import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cloudGovernanceStatus} from '../../lib/platform/cloud-governance.mjs';

const matrix=JSON.parse(readFileSync(new URL('../../docs/security/cloud-responsibility-matrix.json',import.meta.url),'utf8'));
test('cloud governance stays blocked until supplier evidence and owners exist',()=>{
  const status=cloudGovernanceStatus(matrix);
  assert.equal(status.ready,false);
  assert.ok(status.services.every(item=>item.ready===false));
  assert.ok(status.services.some(item=>item.missing.includes('dpaConfirmed')));
});
