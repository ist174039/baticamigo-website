import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observabilityStatus} from '../../lib/platform/observability.mjs';

const config=JSON.parse(readFileSync(new URL('../../docs/operations/observability-baseline.json',import.meta.url),'utf8'));

test('observability baseline forbids PII and stays blocked without live evidence',()=>{
  const result=observabilityStatus(config,{});
  assert.equal(result.ready,false);
  assert.equal(result.signalCount,5);
  assert.ok(result.missing.includes('owner'));
  assert.ok(result.missing.includes('testAlertAt'));
});

test('observability can only become ready with explicit operational evidence',()=>{
  const result=observabilityStatus(config,{
    owner:'operations owner',channel:'approved channel',testAlertAt:'2026-10-25',
    reviewer:'reviewer',productionEnvironment:'production',evidenceUrl:'https://example.org/evidence'
  });
  assert.equal(result.ready,true);
  assert.deepEqual(result.missing,[]);
});
