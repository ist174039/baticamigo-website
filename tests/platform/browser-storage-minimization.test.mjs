import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const shell=readFileSync(new URL('../../app/components/private/private-shell.js',import.meta.url),'utf8');
test('private localStorage is limited to non-sensitive UI preferences',()=>{
  const keys=[...shell.matchAll(/localStorage\.(?:getItem|setItem)\(["']([^"']+)["']/g)].map(match=>match[1]);
  assert.deepEqual(new Set(keys),new Set(['baticamigo-sidebar-collapsed','baticamigo-sidebar-collapsed-groups']));
  for(const forbidden of ['token','auth','email','student','guardian','profile','attendance','assessment']) assert.equal(keys.some(key=>key.toLowerCase().includes(forbidden)),false);
});
