import test from 'node:test';
import assert from 'node:assert/strict';
import {evidencePassed,validateEvidenceRecord} from '../../lib/platform/evidence-record.mjs';

test('manual/operational evidence requires executor reviewer artifact and acceptance criterion',()=>{
  assert.throws(()=>validateEvidenceRecord({id:'E1',type:'accessibility'}),/environment/);
  const record={id:'E1',type:'accessibility',environment:'staging',version:'sha',executedAt:'2026-10-25',executor:'Tester',reviewer:'Reviewer',result:'passed',artifact:'Notion RUN-A11Y-001',limitations:'',acceptanceCriterion:'Sem bloqueadores AA'};
  assert.equal(evidencePassed(record),true);
});
test('blocked or failed evidence never counts as passed',()=>{
  const base={id:'E1',type:'backup-restore',environment:'isolated',version:'sha',executedAt:'2026-10-25',executor:'Tester',reviewer:'Reviewer',artifact:'log',limitations:'',acceptanceCriterion:'Restore íntegro'};
  assert.equal(evidencePassed({...base,result:'blocked'}),false);
});
