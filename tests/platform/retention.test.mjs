import test from 'node:test';
import assert from 'node:assert/strict';
import {retentionCategories,retentionCutoff,validateRetentionPolicy} from '../../lib/platform/retention.mjs';

const policy={
  version:'approved-test-v1',approvedAt:'2026-10-25',
  categories:Object.fromEntries(retentionCategories.map(name=>[name,{days:30,owner:'synthetic-test-owner',legalHold:false}]))
};

test('retention requires an approved complete policy rather than inventing defaults',()=>{
  assert.throws(()=>validateRetentionPolicy({}),/version/);
  const missing=structuredClone(policy);delete missing.categories.audit;
  assert.throws(()=>validateRetentionPolicy(missing),/audit/);
  const invalid=structuredClone(policy);invalid.categories.audit.days=0;
  assert.throws(()=>validateRetentionPolicy(invalid),/audit/);
});

test('retention cutoff is deterministic and legal hold blocks deletion',()=>{
  assert.equal(retentionCutoff(policy,'audit',new Date('2026-10-31T00:00:00Z')),'2026-10-01T00:00:00.000Z');
  const held=structuredClone(policy);held.categories.audit.legalHold=true;
  assert.equal(retentionCutoff(held,'audit',new Date('2026-10-31T00:00:00Z')),null);
});
