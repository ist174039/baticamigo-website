import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateTabletopPlan,tabletopExerciseStatus} from '../../lib/platform/incident-tabletop.mjs';

const plan=JSON.parse(readFileSync(new URL('../../docs/operations/incident-tabletop-scenarios.json',import.meta.url),'utf8'));

test('incident tabletop scenarios match severity policy',()=>{
  assert.equal(validateTabletopPlan(plan),true);
});

test('tabletop evidence stays blocked until a real exercise is recorded',()=>{
  const result=tabletopExerciseStatus(plan,{});
  assert.equal(result.ready,false);
  assert.ok(result.missing.includes('owner'));
  assert.ok(result.missing.includes('executedAt'));
});
