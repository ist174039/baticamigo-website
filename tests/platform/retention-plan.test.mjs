import test from 'node:test';
import assert from 'node:assert/strict';
import {planRetention} from '../../lib/platform/retention-plan.mjs';
import {retentionCategories} from '../../lib/platform/retention.mjs';

const policy={version:'approved-test',approvedAt:'2026-10-25',categories:Object.fromEntries(retentionCategories.map(name=>[name,{days:30,owner:'synthetic-owner',legalHold:false}]))};
test('retention planning is dry-run and separates candidates, holds and kept records',()=>{
  const held=structuredClone(policy);held.categories.messages.legalHold=true;
  const plan=planRetention([
    {id:'old',retentionCategory:'records',updatedAt:'2026-08-01T00:00:00Z'},
    {id:'new',retentionCategory:'records',updatedAt:'2026-10-20T00:00:00Z'},
    {id:'held',retentionCategory:'messages',updatedAt:'2026-01-01T00:00:00Z'},
  ],held,new Date('2026-10-31T00:00:00Z'));
  assert.equal(plan.dryRun,true);
  assert.deepEqual(plan.candidates.map(x=>x.id),['old']);
  assert.deepEqual(plan.kept.map(x=>x.id),['new']);
  assert.deepEqual(plan.blocked.map(x=>x.id),['held']);
});
test('retention planning refuses records without approved categories or dates',()=>{
  assert.throws(()=>planRetention([{id:'x',retentionCategory:'unknown',updatedAt:'2026-01-01T00:00:00Z'}],policy),/Unknown/);
  assert.throws(()=>planRetention([{id:'x',retentionCategory:'records',updatedAt:''}],policy),/valid timestamp/);
});
