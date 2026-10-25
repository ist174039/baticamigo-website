import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../../public/admin/login.html',import.meta.url),'utf8');

test('legacy admin login only redirects to the canonical platform login',()=>{
  assert.match(html,/url=\/platform\/login/);
  assert.match(html,/noindex,nofollow/);
  assert.equal(html.includes('firebase-app.js'),false);
  assert.equal(html.includes('js/auth.js'),false);
  assert.equal(/<form\b/i.test(html),false);
});
