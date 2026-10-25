import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

const retired=[
  '../../public/legacy-home.html',
  '../../public/estrutura-teste.html',
  '../../public/index-simplificado.html',
  '../../public/js/debug.js',
  '../../public/js/debug-contact.js',
  '../../public/js/debug-carousel.js',
  '../../public/js/fix-css.js',
  '../../public/js/fix-visibility.js',
  '../../public/js/visibility-check.js',
  '../../public/js/contact-form.js',
  '../../public/admin/dashboard.html',
];

test('retired public test/debug surfaces are not shipped',()=>{
  for(const path of retired) assert.equal(existsSync(new URL(path,import.meta.url)),false,path);
});
