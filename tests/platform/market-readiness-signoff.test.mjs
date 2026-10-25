import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const signoff=readFileSync(new URL('../../docs/operations/market-readiness-signoff.md',import.meta.url),'utf8');
test('market readiness sign-off lists every mandatory release gate and fails closed',()=>{
  for(const id of [
    'BA-GOV-001','BA-CRIT-001','BA-COMP-001','BA-RC-001','BA-MAIN-001','BA-REPO-001',
    'BA-ASSET-001','BA-LIC-001','BA-TRACE-001','BA-SEC-001','BA-ENV-001','BA-HOST-001',
    'BA-REL-001','BA-OBS-001','BA-IR-001','BA-PRIV-001','BA-PIA-001','BA-RET-001',
    'BA-VENDOR-001','BA-RIGHTS-001','BA-BCP-001','BA-A11Y-001','BA-UX-001'
  ]) assert.ok(signoff.includes(id),`missing gate ${id}`);
  assert.match(signoff,/\*\*GO\*\* só é admissível|GO só é admissível/);
  assert.match(signoff,/NO-GO/);
  assert.match(signoff,/Blocked \/ Requires Decision/);
});
