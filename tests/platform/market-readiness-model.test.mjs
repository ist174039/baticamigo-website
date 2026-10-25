import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const model=JSON.parse(readFileSync(new URL('../../docs/operations/market-readiness-model.json',import.meta.url),'utf8'));
const requirements=JSON.parse(readFileSync(new URL('../../docs/requirements-evidence.json',import.meta.url),'utf8'));
const controls=JSON.parse(readFileSync(new URL('../../docs/standards-controls.json',import.meta.url),'utf8'));

test('market readiness weights are complete and deterministic',()=>{
  assert.equal(Object.values(model.weights).reduce((sum,value)=>sum+value,0),100);
  assert.equal(Object.keys(model.weights).length,9);
});
test('canonical requirements and controls are represented in the scoring inputs',()=>{
  assert.equal(Object.keys(requirements.requirements).length,27);
  assert.equal(Object.keys(controls.controls).length,42);
  assert.equal(Object.keys(requirements.requirements).filter(id=>id.startsWith('FR-')).length,20);
  assert.equal(Object.keys(requirements.requirements).filter(id=>id.startsWith('NFR-')).length,7);
});
test('model never equates CI with production readiness',()=>{
  assert.ok(model.rules.some(rule=>/CI alone/.test(rule)));
  assert.ok(model.rules.some(rule=>/15 production-readiness checks/.test(rule)));
});
