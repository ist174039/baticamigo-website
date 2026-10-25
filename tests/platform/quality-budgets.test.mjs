import test from 'node:test';
import assert from 'node:assert/strict';
import {percentile,qualityBudgets} from '../../lib/platform/quality-budgets.mjs';

test('quality budgets are explicit and bounded',()=>{
  assert.equal(qualityBudgets.maxApiBodyBytes,16384);
  assert.equal(qualityBudgets.maxUploadBytes,4000000);
  assert.equal(qualityBudgets.maxProfilesPerAccount,30);
  assert.equal(qualityBudgets.maxListRecords,500);
  assert.ok(qualityBudgets.localHttpP95Ms>0&&qualityBudgets.localHttpP95Ms<=5000);
});
test('percentile is deterministic',()=>{
  assert.equal(percentile([10,20,30,40,50],.95),50);
  assert.equal(percentile([30,10,20],.5),20);
});
