import test from 'node:test';
import assert from 'node:assert/strict';
import {productionReadiness} from '../../lib/platform/readiness.mjs';

test('production readiness fails closed when human/operational evidence is absent',()=>{
  const result=productionReadiness({});
  assert.equal(result.ready,false);
  for(const key of ['BATIC_STANDARDS_REVIEWED_AT','BATIC_SECURITY_RISK_REVIEWED_AT','BATIC_PIA_REVIEWED_AT','BATIC_PRIVACY_APPROVED_AT','BATIC_RETENTION_POLICY_VERSION','BATIC_BACKUP_RESTORE_TESTED_AT','BATIC_ACCESSIBILITY_VALIDATED_AT']) assert.ok(result.missing.includes(key));
});

test('production readiness passes only with complete explicit evidence',()=>{
  const result=productionReadiness({
    BATIC_STANDARDS_REVIEWED_AT:'2026-10-25',
    BATIC_SECURITY_RISK_REVIEWED_AT:'2026-10-25',
    BATIC_PIA_REVIEWED_AT:'2026-10-25',
    BATIC_PRIVACY_APPROVED_AT:'2026-10-25',
    BATIC_RETENTION_POLICY_VERSION:'2026-10-v1',
    BATIC_IAM_REVIEWED_AT:'2026-10-25',
    BATIC_FIRESTORE_RULES_DEPLOYED_SHA:'abc123',
    BATIC_STORAGE_RULES_DEPLOYED_SHA:'def456',
    BATIC_BACKUP_RPO_HOURS:'24',
    BATIC_BACKUP_RTO_HOURS:'8',
    BATIC_BACKUP_RESTORE_TESTED_AT:'2026-10-25',
    BATIC_RESPONSIVE_VALIDATED_AT:'2026-10-25',
    BATIC_ACCESSIBILITY_VALIDATED_AT:'2026-10-25',
    BATIC_USABILITY_VALIDATED_AT:'2026-10-25',
  });
  assert.equal(result.ready,true);
  assert.deepEqual(result.missing,[]);
});
