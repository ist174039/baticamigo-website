import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyAuditAction} from '../../lib/platform/audit-classification.mjs';

test('privilege and account mutations are high severity security events',()=>{
  for(const action of ['update-platform-user-access','suspend-platform-user','delete-platform-user','update-platform-access-profiles']){
    const value=classifyAuditAction(action);
    assert.equal(value.severity,'high');
    assert.equal(value.securityRelevant,true);
    assert.equal(value.category,'access-control');
  }
});
test('financial/destructive events are security relevant without leaking payloads',()=>{
  assert.deepEqual(classifyAuditAction('delete-donation'),{severity:'medium',securityRelevant:true,category:'finance'});
  assert.deepEqual(classifyAuditAction('delete-platform-profile'),{severity:'medium',securityRelevant:true,category:'data-change'});
});
test('ordinary operations default low and explicit',()=>{
  assert.deepEqual(classifyAuditAction('save-profile'),{severity:'low',securityRelevant:false,category:'operation'});
});
