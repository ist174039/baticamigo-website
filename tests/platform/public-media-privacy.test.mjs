import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const loader=readFileSync(new URL('../../public/js/firebase-data-loader.js',import.meta.url),'utf8');
const config=readFileSync(new URL('../../next.config.js',import.meta.url),'utf8');

test('public editorial media is restricted to same-origin or trusted storage hosts',()=>{
  assert.match(loader,/function safeMediaUrl\(value\)/);
  assert.match(loader,/firebasestorage\.googleapis\.com/);
  assert.match(loader,/storage\.googleapis\.com/);
  assert.match(loader,/const safe = safeMediaUrl\(url\)/);
  assert.match(loader,/img\.src = safeMediaUrl\(item\.url\)/);
  assert.match(loader,/video\.src = safeMediaUrl\(item\.url\)/);
  assert.match(loader,/safeMediaUrl\(event\.imagem\)/);
});

test('external navigation remains separate from media trust and CSP does not allow arbitrary HTTPS media',()=>{
  assert.match(loader,/safeUrl\(partner\.website\)/);
  assert.match(loader,/safeUrl\(item\.inscricao\)/);
  assert.match(loader,/safeUrl\(item\.link\)/);
  assert.match(config,/img-src 'self' data: https:\/\/firebasestorage\.googleapis\.com https:\/\/storage\.googleapis\.com/);
  assert.match(config,/media-src 'self' https:\/\/firebasestorage\.googleapis\.com https:\/\/storage\.googleapis\.com/);
  assert.equal(config.includes("img-src 'self' data: https:;"),false);
  assert.equal(config.includes("media-src 'self' https:;"),false);
});
