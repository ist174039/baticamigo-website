import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const files=['../../lib/platform/access.mjs','../../functions/index.js'];
test('privileged bootstrap and notification contacts are not hardcoded in source',()=>{
  for(const path of files){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/[A-Z0-9._%+-]+@baticamigo\.(?:pt|com)/i,path);
  }
  const access=readFileSync(new URL('../../lib/platform/access.mjs',import.meta.url),'utf8');
  assert.match(access,/FIREBASE_ADMIN_EMAILS/);
  const fn=readFileSync(new URL('../../functions/index.js',import.meta.url),'utf8');
  assert.match(fn,/contact_to/);
});

test('contact notification emails contain no submitted personal content',()=>{
  for(const path of ['../../functions/index.js']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    const handler=source.slice(source.indexOf('exports.sendContactEmail'));
    assert.match(handler,/Consulte-a no painel administrativo/);
    assert.doesNotMatch(handler,/contactData\.nome|contactData\.email|contactData\.assunto|contactData\.mensagem/);
    assert.doesNotMatch(handler,/Nome:\s*\$\{|Email:\s*\$\{|Mensagem:\s*\$\{/);
  }
});

test('legacy mail transport failures do not return raw provider errors',()=>{
  for(const path of ['../../functions/index.js']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.doesNotMatch(source,/HttpsError\("internal",\s*"Erro ao enviar email\.",\s*error\)/);
    assert.match(source,/error\?\.code \|\| "mail-send-failed"/);
  }
});

test('legacy administrative email callable honors persisted revocation and verified email',()=>{
  for(const path of ['../../functions/index.js']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/platform_accounts/);
    assert.match(source,/email_verified !== true/);
    assert.match(source,/account\\.active !== true/);
    assert.match(source,/account\\.suspended === true/);
    assert.match(source,/roles\.includes\("admin"\)/);
  }
});


test('server Firebase Functions code is not published as a static asset',()=>{
  assert.equal(existsSync(new URL('../../public/firebase-functions/index.js',import.meta.url)),false);
});
