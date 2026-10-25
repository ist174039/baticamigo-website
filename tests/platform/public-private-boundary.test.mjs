import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const collectionNames=source=>[...source.matchAll(/collection\(["']([^"']+)["']\)/g)].map(match=>match[1]);

test('public website reads editorial data only through the sanitized server API',()=>{
  const source=read('public/js/firebase-data-loader.js');
  assert.match(source,/fetch\(\`\/api\/public-content\?/);
  assert.equal(source.includes('firebase.firestore'),false);
  assert.equal(collectionNames(source).length,0);
  assert.equal(source.includes('platform_'),false);
});

test('public contact form is server mediated and has no direct Firestore write path',()=>{
  const source=read('public/js/contact-form-firebase.js');
  assert.match(source,/fetch\("\/api\/contact"/);
  assert.equal(source.includes('firebase.firestore'),false);
  assert.equal(collectionNames(source).length,0);
});

test('legacy CMS direct Firestore access is restricted to editorial/contact collections',()=>{
  const source=read('public/admin/js/admin.js');
  const allowed=new Set(['site_config','membros','parceiros','eventos','programas','agenda','noticias','contato']);
  const observed=new Set(collectionNames(source));
  assert.deepEqual(observed,allowed);
  assert.equal(source.includes('platform_'),false);
});
