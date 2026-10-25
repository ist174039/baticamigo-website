import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {retentionCategories} from '../../lib/platform/retention.mjs';

const model=JSON.parse(readFileSync(new URL('../../docs/data-model.json',import.meta.url),'utf8'));
const expectedPrivate=[
  'platform_access_settings','platform_accounts','platform_attendance','platform_audit',
  'platform_donations','platform_due_payments','platform_dues','platform_expenses',
  'platform_financings','platform_locks','platform_profiles','platform_records','platform_sessions'
].sort();

test('physical data model inventories every private platform collection',()=>{
  assert.deepEqual(model.collections.map(item=>item.name).sort(),expectedPrivate);
  for(const item of model.collections){
    assert.match(item.name,/^platform_/);
    assert.equal(item.access,'server-mediated');
    assert.ok(['internal','restricted','highly-restricted'].includes(item.classification));
    assert.ok(retentionCategories.includes(item.retentionCategory));
    assert.ok(item.purpose);
  }
});

test('public/editorial collections are explicitly separated from private namespaces',()=>{
  const names=model.publicCollections.map(item=>item.name).sort();
  assert.deepEqual(names,['agenda','contato','eventos','membros','noticias','parceiros','programas','site_config']);
  assert.equal(model.publicCollections.some(item=>item.name.startsWith('platform_')),false);
});
