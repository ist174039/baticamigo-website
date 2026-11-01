import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const policy=readFileSync(new URL('../../SECURITY.md',import.meta.url),'utf8');

test('security policy routes reports away from public issues and production data',()=>{
  assert.match(policy,/do \*\*not\*\* open a public GitHub issue/i);
  assert.match(policy,/\.well-known\/security\.txt/);
  assert.match(policy,/children\/families/);
  assert.match(policy,/service-account JSON/);
});

test('security policy does not invent a bounty SLA or safe harbor',()=>{
  assert.match(policy,/does not promise a bug-bounty payment, response SLA, or safe-harbor/i);
});
