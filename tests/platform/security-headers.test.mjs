import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const config=readFileSync(new URL('../../next.config.js',import.meta.url),'utf8');
test('HTTP baseline includes restrictive security headers',()=>{
  for(const header of [
    'X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy',
    'Content-Security-Policy','Strict-Transport-Security','Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy','X-Permitted-Cross-Domain-Policies'
  ]) assert.ok(config.includes(header),`missing ${header}`);
  assert.match(config,/frame-ancestors 'none'/);
  assert.match(config,/object-src 'none'/);
});
