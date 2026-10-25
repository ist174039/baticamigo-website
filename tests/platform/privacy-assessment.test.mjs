import test from 'node:test';
import assert from 'node:assert/strict';
import {privacyAssessmentStatus} from '../../lib/platform/privacy-assessment.mjs';

test('PIA/DPIA approval fails closed when human decisions are absent',()=>{
  const status=privacyAssessmentStatus({scope:'platform'});
  assert.equal(status.approved,false);
  assert.ok(status.missing.includes('reviewer'));
  assert.ok(status.missing.includes('decision'));
});
test('PIA/DPIA can only become approved with a complete explicit review',()=>{
  const status=privacyAssessmentStatus({
    scope:'Plataforma privada',purposes:'Apoio e gestão',dataSubjects:['alunos'],dataCategories:['perfil'],
    recipients:'Associação e fornecedores aprovados',retentionDecision:'Política aprovada',
    necessity:'Documentada',risks:'Avaliados',measures:'Controlos ligados',reviewer:'Responsável competente',
    reviewedAt:'2026-10-25',decision:'approved-with-actions'
  });
  assert.equal(status.approved,true);
  assert.deepEqual(status.missing,[]);
});
