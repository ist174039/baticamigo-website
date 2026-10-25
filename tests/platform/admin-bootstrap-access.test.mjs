import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {adminAuthorization,availablePlatformDestinations,bootstrapAdminEmails,isBootstrapAdmin,resolvePlatformAccount} from '../../lib/platform/access.mjs';

test('the unified login offers destinations according to active profile permissions',()=>{
  assert.deepEqual(availablePlatformDestinations({active:true,roles:['admin']}),['admin','area']);
  assert.deepEqual(availablePlatformDestinations({active:true,roles:['tutor'],modules:['overview','sessions']}),['area']);
  // The API returns the server-validated active state with its normalized account.
  assert.deepEqual(availablePlatformDestinations({active:true,role:'admin',roles:['admin'],modules:['overview']}),['admin','area']);
  assert.deepEqual(availablePlatformDestinations({active:false,roles:['admin']}),[]);
  assert.deepEqual(availablePlatformDestinations({active:true,suspended:true,roles:['admin']}),[]);
});

test('the admin dashboard shares the unified login Firebase Auth persistence namespace',()=>{
  const loginClient=readFileSync(new URL('../../lib/firebase-client.js',import.meta.url),'utf8');
  const adminClient=readFileSync(new URL('../../public/admin/js/firebaseConfig.js',import.meta.url),'utf8');
  const appName=loginClient.match(/const name = "([^"]+)"/)?.[1];
  assert.equal(appName,'baticamigo-platform-client');
  assert.match(adminClient,new RegExp(`const platformAppName = "${appName}"`));
  assert.match(adminClient,/platformApp\.auth\(\)/);
  assert.match(adminClient,/platformApp\.firestore\(\)/);
  assert.match(adminClient,/platformApp\.storage\(\)/);
});

test('bootstrap administrator emails are environment-only, normalized and verified',()=>{
  const env='bootstrap-admin@example.invalid, second-admin@example.invalid';
  assert.equal(bootstrapAdminEmails().size,0);
  assert.equal(bootstrapAdminEmails(env).has('bootstrap-admin@example.invalid'),true);
  assert.equal(isBootstrapAdmin('Bootstrap-Admin@Example.Invalid',true,env),true);
  assert.equal(isBootstrapAdmin('bootstrap-admin@example.invalid',false,env),false);
});

test('an active persisted platform admin must verify email before reaching /admin',()=>{
  const identity={uid:'owner-1',email:'bootstrap-admin@example.invalid',email_verified:false};
  const storedAccount={active:true,roles:['admin']};
  const areaAccount=resolvePlatformAccount(identity,storedAccount);
  assert.equal(areaAccount.active,true);
  assert.equal(areaAccount.roles.includes('admin'),true);
  const result=adminAuthorization(identity,storedAccount);
  assert.deepEqual(result,{authorized:false,verificationRequired:true});
});

test('a Firebase-issued admin claim keeps legacy administrators active when no account document exists',()=>{
  const identity={uid:'legacy-admin',email:'legacy-admin@example.com',email_verified:true,admin:true};
  const resolved=resolvePlatformAccount(identity,null);
  assert.equal(resolved.active,true);
  assert.deepEqual(resolved.roles,['admin']);
  assert.deepEqual(adminAuthorization(identity,null),{authorized:true,verificationRequired:false});
});

test('an existing inactive or non-admin platform account overrides a stale admin claim',()=>{
  for(const account of [{active:false,roles:['admin']},{active:true,suspended:true,roles:['admin']},{active:true,roles:['member']}]) {
    assert.deepEqual(adminAuthorization({email:'other@example.com',email_verified:true,admin:true},account),{authorized:false,verificationRequired:false});
  }
});

test('bootstrap and stored platform accounts are resolved consistently for both panels',()=>{
  const identity={uid:'owner-2',email:'bootstrap-admin@example.invalid',email_verified:true,admin:true};
  const bootstrapAccount=resolvePlatformAccount(identity,null,'bootstrap-admin@example.invalid');
  assert.equal(bootstrapAccount.superAdmin,true);
  assert.equal(adminAuthorization(identity,null,'bootstrap-admin@example.invalid').authorized,true);
  const storedAccount={uid:'owner-2',active:true,roles:['member']};
  assert.equal(resolvePlatformAccount({...identity,email:'member@example.com'},storedAccount).roles[0],'member');
  assert.equal(adminAuthorization({...identity,email:'member@example.com'},storedAccount).authorized,false);
  assert.equal(resolvePlatformAccount({...identity,email:'legacy-admin@example.com'},null).roles[0],'admin');
});

test('bootstrap-only access still requires email verification and suspended admins remain blocked',()=>{
  assert.deepEqual(adminAuthorization({email:'bootstrap-admin@example.invalid',email_verified:false},null,'bootstrap-admin@example.invalid'),{authorized:false,verificationRequired:true});
  assert.deepEqual(adminAuthorization({email:'bootstrap-admin@example.invalid',email_verified:false},{active:true,suspended:true,roles:['admin']}),{authorized:false,verificationRequired:false});
  assert.deepEqual(adminAuthorization({email:'other@example.com',email_verified:false},{active:true,suspended:true,roles:['admin']}),{authorized:false,verificationRequired:false});
});
