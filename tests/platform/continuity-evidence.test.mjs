import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRestoreEvidence,validateIncidentExercise} from '../../lib/platform/continuity-evidence.mjs';

test('real restore evidence cannot pass outside approved RPO/RTO or without integrity/rollback checks',()=>{
  const base={id:'BCP-1',releaseSha:'a'.repeat(40),environment:'isolated',backupId:'backup-1',backupPointAt:'2026-10-25T10:00:00Z',startedAt:'2026-10-25T10:10:00Z',completedAt:'2026-10-25T10:30:00Z',approvedRpoMinutes:60,approvedRtoMinutes:60,observedRpoMinutes:20,observedRtoMinutes:20,owner:'owner',reviewer:'reviewer',artifact:'evidence',result:'passed',integrityValidated:true,authorizationValidated:true,rollbackValidated:true};
  assert.equal(validateRestoreEvidence(base).result,'passed');
  assert.throws(()=>validateRestoreEvidence({...base,observedRtoMinutes:90}),/exceeds approved RTO/);
  assert.throws(()=>validateRestoreEvidence({...base,rollbackValidated:false}),/rollback/);
});

test('incident tabletop requires known scenarios and explicit actions when passed',()=>{
  const base={id:'IR-EX-1',releaseSha:'b'.repeat(40),executedAt:'2026-10-25',owner:'owner',moderator:'mod',reviewer:'reviewer',scenarioIds:['IR-01','IR-03'],result:'passed',artifact:'evidence',actions:[{id:'A1',owner:'owner',status:'open',acceptanceCriterion:'Retest fixed control'}]};
  assert.equal(validateIncidentExercise(base).result,'passed');
  assert.throws(()=>validateIncidentExercise({...base,scenarioIds:['UNKNOWN']}),/scenarios/);
  assert.throws(()=>validateIncidentExercise({...base,actions:[]}),/follow-up/);
});
