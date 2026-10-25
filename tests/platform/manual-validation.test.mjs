import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAccessibilityExecution,validateUsabilitySession} from '../../lib/platform/manual-validation.mjs';

test('accessibility evidence cannot pass with high-severity findings',()=>{
  const base={id:'A11Y-1',version:'sha',environment:'staging',executedAt:'2026-10-25',executor:'tester',reviewer:'reviewer',surface:'login',browser:'Firefox',viewport:'1440x900',assistiveTechnology:'NVDA',zoom:'200%',result:'passed',acceptanceCriterion:'No blockers',artifact:'notion://evidence',findings:[]};
  assert.equal(validateAccessibilityExecution(base).result,'passed');
  assert.throws(()=>validateAccessibilityExecution({...base,findings:[{id:'F1',severity:'high',summary:'Keyboard trap'}]}),/cannot pass/);
});

test('usability evidence requires synthetic participant IDs and bounded ratings',()=>{
  const base={id:'UX-1',participantId:'synthetic-guardian-1',profile:'guardian',version:'sha',environment:'staging',executedAt:'2026-10-25',moderator:'moderator',reviewer:'reviewer',tasks:[{id:'agenda',outcome:'complete',confidence:4,comprehension:5}],findings:[],artifact:'notion://evidence'};
  assert.equal(validateUsabilitySession(base).profile,'guardian');
  assert.throws(()=>validateUsabilitySession({...base,participantId:'real-person-name'}),/synthetic/);
  assert.throws(()=>validateUsabilitySession({...base,tasks:[{id:'agenda',outcome:'complete',confidence:6}]}),/confidence/);
});
