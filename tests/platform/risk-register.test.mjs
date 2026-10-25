import test from 'node:test';
import assert from 'node:assert/strict';
import {riskRegisterStatus,validateRisk} from '../../lib/platform/risk-register.mjs';

const base={id:'R-1',asset:'Perfis',threat:'Acesso indevido',vulnerability:'Autorização incorreta',impact:'Exposição de dados',likelihoodEvidence:'Threat model',controls:'Autorização server-side',treatment:'reduce',status:'open'};
test('risk register refuses silent acceptance or closure',()=>{
  assert.equal(validateRisk(base).status,'open');
  assert.throws(()=>validateRisk({...base,treatment:'accept',status:'accepted'}),/owner/);
  const accepted=validateRisk({...base,treatment:'accept',status:'accepted',owner:'Security owner',dueDate:'2026-12-31',acceptanceCriterion:'Risco residual aprovado',evidence:'Ata/decisão',reviewedAt:'2026-10-25'});
  assert.equal(accepted.status,'accepted');
});
test('register is never ready while risks remain open',()=>{
  assert.deepEqual(riskRegisterStatus([base]),{total:1,open:['R-1'],accepted:[],closed:[],ready:false});
});
