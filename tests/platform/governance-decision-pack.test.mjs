import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pack=readFileSync(new URL('../../docs/operations/governance-decision-pack.md',import.meta.url),'utf8');

test('governance decision pack requires owners scope metrics standards and GO decision',()=>{
  for(const phrase of ['Accountability','Âmbito de lançamento','Critérios de aceitação','Métricas e baselines','Normas e controlos','Gate GO/NO-GO']) assert.ok(pack.includes(phrase));
});

test('governance pack prevents inferred approval',()=>{
  assert.match(pack,/Não inferir MVP/);
  assert.match(pack,/não podem preencher ou aprovar esta secção por inferência/i);
  assert.match(pack,/resultado: GO \/ NO-GO/);
});
