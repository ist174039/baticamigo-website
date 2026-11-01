import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {operationalEventRecord} from '../../lib/platform/operational-events.mjs';

test('operational events expose only allowlisted non-PII fields',()=>{
  const record=operationalEventRecord('auth-failure',{
    severity:'high',
    code:'AUTH invalid token user@example.com uid=abc payload={secret}',
    uid:'abc',
    email:'user@example.com',
    token:'secret',
    payload:{private:true},
  });
  assert.deepEqual(Object.keys(record).sort(),['code','event','severity','timestamp','type']);
  assert.equal(record.type,'baticamigo-ops');
  assert.equal(record.event,'auth-failure');
  assert.equal(record.severity,'high');
  assert.ok(record.code.length<=80);
  assert.equal(JSON.stringify(record).includes('user@example.com'),false);
  assert.equal(JSON.stringify(record).includes('secret'),false);
  for(const key of ['uid','email','token','payload']) assert.equal(key in record,false);
});

test('operational events reject unknown event identifiers',()=>{
  assert.throws(()=>operationalEventRecord('arbitrary-event',{}),/allowlisted/);
});

test('server emits explicit auth/API operational signals without raw error logging',()=>{
  const source=readFileSync(new URL('../../lib/platform/server.js',import.meta.url),'utf8');
  assert.match(source,/operationalEvent\('auth-failure'/);
  assert.match(source,/operationalEvent\('access-denied'/);
  assert.match(source,/operationalEvent\('platform-api-error'/);
  assert.equal(/console\.error\('Platform operation failed'/.test(source),false);
});
