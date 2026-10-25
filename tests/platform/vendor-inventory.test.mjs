import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const layout=readFileSync(new URL('../../app/layout.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../../next.config.js',import.meta.url),'utf8');
const inventory=readFileSync(new URL('../../docs/security/vendor-inventory.md',import.meta.url),'utf8');

test('externally referenced runtime providers are represented in the vendor inventory',()=>{
  const observed=[
    ['fonts.googleapis.com','Google Fonts'],
    ['fonts.gstatic.com','Google Fonts'],
    ['cdnjs.cloudflare.com','cdnjs'],
    ['firebasestorage.googleapis.com','Firebase Storage'],
  ];
  for(const [host,label] of observed){
    assert.ok(layout.includes(host)||config.includes(host),`fixture host ${host} not observed in source`);
    assert.ok(inventory.includes(label),`vendor inventory missing ${label}`);
  }
  for(const required of ['Firebase Authentication','Cloud Firestore','Vercel','GitHub / GitHub Actions']) assert.ok(inventory.includes(required));
});
