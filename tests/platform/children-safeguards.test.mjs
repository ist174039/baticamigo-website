import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const access=readFileSync(new URL('../../lib/platform/access.mjs',import.meta.url),'utf8');
const integration=readFileSync(new URL('../../scripts/integration-test.mjs',import.meta.url),'utf8');
const safeguards=readFileSync(new URL('../../docs/security/children-digital-safeguards.md',import.meta.url),'utf8');

test('children safeguards remain tied to relationship authorization and synthetic tests',()=>{
  assert.match(access,/canReadStudent|guardian/);
  assert.match(integration,/synthetic|sintétic/i);
  for(const phrase of ['outros alunos','dados sintéticos','revisão humana']) assert.ok(safeguards.toLowerCase().includes(phrase));
});
