import test from 'node:test';
import assert from 'node:assert/strict';
import {governedRecordKinds,recordGovernance} from '../../lib/platform/records-management.mjs';

test('every platform record kind has server-defined classification and retention category',()=>{
  assert.deepEqual(new Set(governedRecordKinds),new Set(['assignment','material','document','message','assessment','justification']));
  for(const kind of governedRecordKinds){
    const value=recordGovernance(kind);
    assert.ok(['restricted','highly-restricted'].includes(value.classification));
    assert.ok(['records','messages','documents'].includes(value.retentionCategory));
  }
  assert.equal(recordGovernance('assessment').classification,'highly-restricted');
  assert.equal(recordGovernance('message').retentionCategory,'messages');
  assert.throws(()=>recordGovernance('unknown'));
});
