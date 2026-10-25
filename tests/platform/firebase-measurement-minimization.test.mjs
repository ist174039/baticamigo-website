import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const paths=[
  '../../js/firebase-init.js',
  '../../js/firebase-config.js',
  '../../admin/js/firebaseConfig.js',
  '../../public/js/firebase-init.js',
  '../../public/js/firebase-config.js',
  '../../public/admin/js/firebaseConfig.js',
];
test('Firebase configs do not expose unused Analytics measurement identifiers',()=>{
  for(const path of paths){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.equal(source.includes('measurementId'),false,path);
  }
});
