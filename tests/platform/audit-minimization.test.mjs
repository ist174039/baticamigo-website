import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDetails} from '../../lib/platform/server.js';

test('audit details keep only allowlisted bounded metadata',()=>{
  const result=auditDetails({
    studentId:'s1',
    occurrences:3,
    weekdays:[1,2,3],
    changedFields:['amountCents','period','x'.repeat(200)],
    donorName:'Sensitive name',
    before:{secret:'no'},
    arbitrary:'no',
  });
  assert.equal(result.studentId,'s1');
  assert.equal(result.occurrences,3);
  assert.deepEqual(result.weekdays,[1,2,3]);
  assert.equal(result.changedFields.length,3);
  assert.equal(result.changedFields[2].length,80);
  assert.equal('donorName' in result,false);
  assert.equal('before' in result,false);
  assert.equal('arbitrary' in result,false);
});

test('audit details reject non-object payloads and nested objects',()=>{
  assert.deepEqual(auditDetails(null),{});
  assert.deepEqual(auditDetails([]),{});
  assert.deepEqual(auditDetails({profileIds:[{id:'x'},'ok']}),{profileIds:['ok']});
});
