import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

test('production Firebase configuration versions deny-all private data rules',()=>{
  const config=JSON.parse(read('firebase.json'));
  assert.equal(config.firestore.rules,'firestore.rules');
  assert.equal(config.storage.rules,'storage.rules');

  for(const path of ['firestore.rules','storage.rules']) {
    const rules=read(path);
    assert.match(rules,/rules_version\s*=\s*'2'/);
    assert.match(rules,/allow read, write:\s*if false/);
  }
});

test('emulator Firestore boundary matches the production direct-access posture',()=>{
  const production=read('firestore.rules').replace(/\/\/.*$/gm,'').replace(/\s+/g,' ').trim();
  const emulator=read('tests/emulators/firestore.rules').replace(/\/\/.*$/gm,'').replace(/\s+/g,' ').trim();
  assert.match(production,/allow read, write: if false/);
  assert.match(emulator,/allow read, write: if false/);
});
