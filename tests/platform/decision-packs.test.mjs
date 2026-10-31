import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const privacy=readFileSync(new URL('../../docs/security/privacy-decision-pack.md',import.meta.url),'utf8');
const continuity=readFileSync(new URL('../../docs/operations/continuity-decision-pack.md',import.meta.url),'utf8');

test('privacy decision pack requires explicit legal/organizational decisions',()=>{
  for(const phrase of ['Finalidades e bases','Menores','Retenção','Fornecedores/cloud','PIA/DPIA','não pode ser autoaprovado pelo CI']) assert.ok(privacy.includes(phrase));
  assert.match(privacy,/Não usar “consentimento” como resposta por omissão/);
});

test('continuity pack requires real backup and measured recovery',()=>{
  for(const phrase of ['RPO por dado/serviço','RTO por serviço','backup real','destino isolado','RPO observado','RTO observado']) assert.ok(continuity.includes(phrase));
  assert.match(continuity,/não substituto/i);
});
