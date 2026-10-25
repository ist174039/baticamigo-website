import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const layout=readFileSync(new URL('../../app/layout.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../../next.config.js',import.meta.url),'utf8');
test('public typography is self-hosted by Next and Google Fonts hosts are absent at runtime',()=>{
  assert.match(layout,/next\/font\/google/);
  assert.equal(layout.includes('fonts.googleapis.com'),false);
  assert.equal(layout.includes('fonts.gstatic.com'),false);
  assert.equal(config.includes('fonts.googleapis.com'),false);
  assert.equal(config.includes('fonts.gstatic.com'),false);
});
