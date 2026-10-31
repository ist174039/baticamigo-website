import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan=readFileSync(new URL('../../docs/operations/domain-remediation-plan.md',import.meta.url),'utf8');

test('domain plan records current external DNS diagnosis without authorizing change',()=>{
  assert.match(plan,/serviceType=external/);
  assert.match(plan,/misconfigured=true/);
  assert.match(plan,/62\.233\.41\.47/);
  assert.match(plan,/nenhuma alteração DNS\/produção executada/i);
});

test('domain remediation requires release SHA verification and safe rollback',()=>{
  for(const phrase of ['release SHA aprovado','verified=true','TLS/HTTPS','Rollback DNS','não remover records de email']) assert.ok(plan.includes(phrase));
  assert.match(plan,/recomendação DNS pode mudar/i);
});
