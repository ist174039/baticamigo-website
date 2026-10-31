import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyIncident,incidentSeverities} from '../../lib/platform/incident.mjs';

test('security and data incidents default to critical classification',()=>{
  for(const input of [{dataExposure:true},{dataLoss:true},{authBypass:true},{serviceUnavailable:true}]) assert.equal(classifyIncident(input),'SEV1');
  assert.equal(classifyIncident({limitedDegradation:true}),'SEV2');
  assert.equal(classifyIncident({}),'SEV3');
});
test('incident severities have bounded acknowledgement targets',()=>{
  assert.ok(incidentSeverities.SEV1.maxAckMinutes < incidentSeverities.SEV2.maxAckMinutes);
  assert.ok(incidentSeverities.SEV2.maxAckMinutes < incidentSeverities.SEV3.maxAckMinutes);
});
