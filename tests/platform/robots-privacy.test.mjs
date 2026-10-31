import test from 'node:test';
import assert from 'node:assert/strict';
import robots from '../../app/robots.js';
import sitemap from '../../app/sitemap.js';

test('robots policy blocks private surfaces and API paths',()=>{
  const value=robots();
  const blocked=new Set(value.rules[0].disallow);
  for(const path of ['/area','/admin','/platform','/api/']) assert.ok(blocked.has(path),`missing ${path}`);
  assert.equal(value.host,'https://baticamigo.pt');
});
test('sitemap contains only public URLs',()=>{
  const values=sitemap();
  assert.deepEqual(values.map(item=>item.url),['https://baticamigo.pt/']);
  assert.equal(values.some(item=>/\/(?:area|admin|platform|api)(?:\/|$)/.test(new URL(item.url).pathname)),false);
});
