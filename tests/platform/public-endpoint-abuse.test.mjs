import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route=readFileSync(new URL('../../app/api/contact/route.js',import.meta.url),'utf8');
const publicContent=readFileSync(new URL('../../app/api/public-content/route.js',import.meta.url),'utf8');
const doc=readFileSync(new URL('../../docs/security/public-endpoint-abuse.md',import.meta.url),'utf8');

test('contact endpoint keeps bounded schema and anti-bot controls',()=>{
  assert.match(route,/content-length/);
  assert.match(route,/8192/);
  assert.match(route,/\['name','email','subject','message','website'\]/);
  assert.match(route,/body\.website/);
  assert.match(route,/202/);
});

test('public content endpoint uses explicit collection and output schemas',()=>{
  assert.match(publicContent,/const schemas=/);
  assert.match(publicContent,/Object\.hasOwn\(schemas,name\)/);
  assert.equal(publicContent.includes('platform_'),false);
});

test('abuse plan does not pretend in-memory throttling is distributed protection',()=>{
  assert.match(doc,/não deve inventar um rate limit “global” em memória/i);
  assert.match(doc,/429\/Retry-After/);
  assert.match(doc,/BA-PRIV-001/);
});
