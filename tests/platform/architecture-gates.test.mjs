import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');

test('private platform keeps authorization and domain validation server-side',()=>{
  const route=read('app/api/platform/route.js');
  const server=read('lib/platform/server.js');
  const domain=read('lib/platform/domain.mjs');
  assert.match(server,/verifyIdToken\(token,true\)/);
  assert.match(server,/resolvePlatformAccount/);
  assert.match(route,/context\(request\)/);
  assert.match(route,/canAccessArea/);
  assert.match(domain,/export function profileInput|export const profileInput/);
});

test('critical private mutations emit audit records',()=>{
  const route=read('app/api/platform/route.js');
  for(const action of ['save-profile','create-session','update-session','create-session-series','add-attendee','set-attendance']) {
    assert.ok(route.includes(action),`missing action ${action}`);
  }
  assert.match(route,/audit\(tx,db,account,body\.action/);

  const finance=read('app/api/platform/finance/route.js');
  for(const action of ['create-due','update-due','delete-due','record-payment','update-payment','delete-payment']) {
    assert.ok(finance.includes(action),`missing finance action ${action}`);
  }
  assert.match(finance,/audit\(tx,db,account/);

  const modules=read('lib/platform/modules-server.js');
  assert.match(modules,/audit\(tx,db,account/);
});

test('private UI exposes keyboard/focus and responsive affordances in source',()=>{
  const platform=read('app/area/platform.js');
  const css=read('app/area/platform.css');
  assert.match(platform,/Saltar para o conteúdo/);
  assert.match(platform,/role="tabpanel"/);
  assert.match(platform,/aria-labelledby/);
  assert.match(css,/@media\s*\(/);
  assert.match(css,/:focus|focus-visible/);
});
