import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const text=readFileSync(new URL('../../public/.well-known/security.txt',import.meta.url),'utf8');
test('RFC 9116 security.txt has required current fields',()=>{
  assert.ok(Buffer.byteLength(text,'utf8')<32768);
  assert.match(text,/^Contact: https:\/\/baticamigo\.pt\/#contact$/m);
  assert.match(text,/^Canonical: https:\/\/baticamigo\.pt\/\.well-known\/security\.txt$/m);
  const expires=text.match(/^Expires: (.+)$/m)?.[1];
  assert.ok(expires,'Expires required');
  const expiry=Date.parse(expires);
  assert.ok(Number.isFinite(expiry));
  assert.ok(expiry>Date.now(),'security.txt must not be expired');
});
