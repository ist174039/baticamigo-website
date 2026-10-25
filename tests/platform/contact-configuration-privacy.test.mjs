import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const files=['../../lib/platform/access.mjs','../../functions/index.js','../../public/firebase-functions/index.js'];
test('privileged bootstrap and notification contacts are not hardcoded in source',()=>{
  for(const path of files){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/[A-Z0-9._%+-]+@baticamigo\.(?:pt|com)/i,path);
  }
  const access=readFileSync(new URL('../../lib/platform/access.mjs',import.meta.url),'utf8');
  assert.match(access,/FIREBASE_ADMIN_EMAILS/);
  const fn=readFileSync(new URL('../../functions/index.js',import.meta.url),'utf8');
  assert.match(fn,/contact_to/);
});
