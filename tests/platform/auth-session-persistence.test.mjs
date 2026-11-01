import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const login=readFileSync(new URL('../../app/platform/login-view.js',import.meta.url),'utf8');
const legacy=readFileSync(new URL('../../public/admin/js/firebaseConfig.js',import.meta.url),'utf8');

test('canonical login uses browser-session Firebase persistence',()=>{
  assert.match(login,/browserSessionPersistence/);
  assert.match(login,/setPersistence\(platformAuth\(\),\s*browserSessionPersistence\)/);
  assert.equal(login.includes('browserLocalPersistence'),false);
});

test('the platform email-verification denial exposes a resend action without relying on the CMS admin endpoint',()=>{
  assert.match(login,/failure\.status === 403 && failure\.message === "Confirme o endereço de email antes de aceder à plataforma\."/);
  assert.match(login,/setVerificationUser\(user\)/);
  assert.match(login,/sendEmailVerification\(verificationUser\)/);
  assert.match(login,/Reenviar email de verificação/);
});

test('legacy CMS shares the canonical Firebase app namespace',()=>{
  assert.match(legacy,/baticamigo-platform-client/);
  assert.equal(legacy.includes('Persistence.LOCAL'),false);
});

