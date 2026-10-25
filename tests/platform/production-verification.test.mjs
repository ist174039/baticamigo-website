import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeploymentHeaders,validateHealthPayload} from '../../lib/platform/production-verification.mjs';

test('health validation requires exact release SHA',()=>{
  const sha='a'.repeat(40);
  assert.equal(validateHealthPayload({status:'ok',service:'baticamigo-website',commitSha:sha},sha),true);
  assert.throws(()=>validateHealthPayload({status:'ok',service:'baticamigo-website',commitSha:'b'.repeat(40)},sha),/does not match/);
});
test('production headers require HSTS, nosniff and restrictive CSP',()=>{
  const headers=new Headers({
    'x-content-type-options':'nosniff',
    'strict-transport-security':'max-age=31536000',
    'content-security-policy':"default-src 'self'; frame-ancestors 'none'"
  });
  assert.equal(validateDeploymentHeaders(headers),true);
  assert.throws(()=>validateDeploymentHeaders(new Headers()),/nosniff/);
});
