import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=readFileSync(new URL('../../docs/operations/staging-plan.md',import.meta.url),'utf8');

test('staging plan requires isolated credentials and synthetic data',()=>{
  assert.match(plan,/nunca copiar.*FIREBASE_SERVICE_ACCOUNT_JSON.*production.*preview/i);
  assert.match(plan,/dados sintéticos/i);
  assert.match(plan,/service account apenas com permissões necessárias/i);
  assert.match(plan,/branch-scoped/i);
});

test('staging plan includes cleanup and evidence gates',()=>{
  for(const phrase of ['Limpeza','revogar/rodar','owner/reviewer/evidence URL','runtime smoke']) assert.ok(plan.includes(phrase));
});
