import test from 'node:test';
import assert from 'node:assert/strict';
import {governanceStatus,validateGovernanceEntry} from '../../lib/platform/governance-register.mjs';

test('ISMS/PIMS governance cannot become operational without ownership and evidence',()=>{
  assert.throws(()=>validateGovernanceEntry({id:'POL-1',title:'Acesso',state:'operational'}),/owner/);
  const value=validateGovernanceEntry({id:'POL-1',title:'Acesso',state:'operational',owner:'Owner',evidence:'Ata e artefactos',reviewedAt:'2026-10-25',nextReview:'2027-10-25'});
  assert.equal(value.state,'operational');
});
test('governance status remains blocked by drafts',()=>{
  assert.equal(governanceStatus([{id:'POL-1',title:'Acesso',state:'draft'}]).ready,false);
});
