import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const policy=readFileSync(new URL('../../docs/operations/main-protection-policy.md',import.meta.url),'utf8');
const workflow=readFileSync(new URL('../../.github/workflows/quality-gate.yml',import.meta.url),'utf8');

test('main protection policy requires PR review checks and no force-push',()=>{
  for(const phrase of ['exigir pull request','revisão humana','Quality Gate','force-push','break-glass']) assert.ok(policy.includes(phrase));
  assert.match(policy,/não prova que branch protection esteja configurada/i);
});

test('quality gate contains the release-critical automated stages',()=>{
  for(const needle of ['npm ci','check:secrets','npm audit','check:release','check:sbom','npm test','npm run lint','public-rules-test.mjs','npm run build','build-evidence.mjs','production-smoke.mjs','@axe-core/cli']) assert.ok(workflow.includes(needle),needle);
});
