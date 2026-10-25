import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

test('production Firebase configuration separates public CMS from private platform data',()=>{
  const config=JSON.parse(read('firebase.json'));
  assert.equal(config.firestore.rules,'firestore.rules');
  assert.equal(config.storage.rules,'storage.rules');

  const firestore=read('firestore.rules');
  assert.match(firestore,/rules_version\s*=\s*'2'/);
  assert.match(firestore,/function isAdmin\(\)/);
  for(const name of ['membros','parceiros','eventos','programas','agenda','noticias','site_config'])
    assert.ok(firestore.includes(`match /${name}/{document}`),`missing explicit CMS rule for ${name}`);
  assert.match(firestore,/allow read: if true/);
  assert.match(firestore,/allow create, update, delete: if isAdmin\(\)/);
  assert.match(firestore,/match \/contato\/\{document\}/);
  assert.match(firestore,/allow read, create, update, delete: if isAdmin\(\)/);
  assert.match(firestore,/match \/\{document=\*\*\}/);
  assert.match(firestore,/allow read, write: if false/);

  const storage=read('storage.rules');
  assert.match(storage,/function isAdmin\(\)/);
  assert.match(storage,/match \/platform-files\/\{path=\*\*\}/);
  assert.match(storage,/allow read, write: if false/);
});

test('private integration emulator remains deny-all for direct client data access',()=>{
  const emulator=read('tests/emulators/firestore.rules');
  assert.match(emulator,/allow read, write: if false/);
});
