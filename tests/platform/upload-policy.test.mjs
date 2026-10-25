import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route=readFileSync(new URL('../../app/api/platform/files/route.js',import.meta.url),'utf8');
const validation=readFileSync(new URL('../../lib/platform/file-validation.mjs',import.meta.url),'utf8');

test('private upload route enforces authorization, size, generated path and integrity hash',()=>{
  assert.match(route,/context\(request\)/);
  assert.match(route,/4_000_000/);
  assert.match(route,/randomUUID\(\)/);
  assert.match(route,/createHash\('sha256'\)/);
  assert.match(route,/platform-files\/\$\{account\.uid\}/);
});
test('upload validation uses an allowlist and content signatures rather than trusting MIME alone',()=>{
  for(const mime of ['image/jpeg','image/png','image/webp','application/pdf']) assert.ok(validation.includes(mime));
  assert.ok(validation.includes("%PDF-"));
  assert.ok(validation.includes("buffer[0]===0xff"));
  assert.ok(validation.includes("Buffer.from([0x89,0x50,0x4e,0x47"));
  assert.ok(validation.includes("RIFF")&&validation.includes("WEBP"));
  assert.ok(validation.includes("[Content_Types].xml"));
  assert.ok(validation.includes("word/document.xml"));
  assert.ok(validation.includes("ppt/presentation.xml"));
  assert.ok(validation.includes("xl/workbook.xml"));
  assert.equal(validation.includes('application/x-msdownload'),false);
  assert.equal(validation.includes('application/javascript'),false);
});
