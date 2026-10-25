import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const admin=readFileSync(new URL('../../public/admin/js/admin.js',import.meta.url),'utf8');
const storage=readFileSync(new URL('../../storage.rules',import.meta.url),'utf8');

test('CMS media storage keys use generated names rather than original filenames',()=>{
  assert.match(admin,/function safeUploadFileName\(file\)/);
  assert.match(admin,/crypto\.randomUUID/);
  assert.equal(/\`(?:eventos|agendas|noticias|membros|parceiros)\/[^\`]*\$\{file\.name\}/.test(admin),false);
  for(const mime of ['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm']) assert.ok(admin.includes(`"${mime}"`));
});

test('Storage Rules restrict CMS media to the same passive image/video allowlist',()=>{
  assert.match(storage,/image\/\(jpeg\|png\|gif\|webp\)/);
  assert.match(storage,/video\/\(mp4\|webm\)/);
  assert.equal(storage.includes("image/.*"),false);
  assert.equal(storage.includes("video/.*"),false);
});
