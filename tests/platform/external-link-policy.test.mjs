import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const admin=readFileSync(new URL('../../public/admin/js/admin.js',import.meta.url),'utf8');
const loader=readFileSync(new URL('../../public/js/firebase-data-loader.js',import.meta.url),'utf8');

test('CMS validates external editorial links as HTTPS without embedded credentials',()=>{
  assert.match(admin,/function isHttpsUrl\(value\)/);
  assert.match(admin,/url\.protocol === "https:"/);
  assert.match(admin,/!url\.username && !url\.password/);
  for(const snippet of ['isHttpsUrl(values.instagram)','isHttpsUrl(inscricao)','isHttpsUrl(link)','isHttpsUrl(website)']) assert.ok(admin.includes(snippet),`missing ${snippet}`);
});

test('public loader accepts same-origin navigation but requires HTTPS for external links',()=>{
  assert.match(loader,/url\.origin === window\.location\.origin/);
  assert.match(loader,/return url\.protocol === "https:" \? url\.href : ""/);
  assert.match(loader,/url\.protocol === "https:"\) document\.querySelectorAll\("\[data-contact-instagram\]"/);
});
