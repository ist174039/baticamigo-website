import {test,expect} from '@playwright/test';
const password='Synthetic-Only-E2E-Password-2026';
async function bearer(request,role){
 const response=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
   data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
 });expect(response.status()).toBe(200);return (await response.json()).idToken;
}
const h=token=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
test('FR-001 FR-002: rejects invalid auth, malformed requests, unverified accounts and cross-origin mutations',async ({request})=>{
 const invalid=await request.get('/api/platform',{headers:{Authorization:'Bearer not-a-jwt'}});
 expect(invalid.status()).toBe(401);
 const unauthorized=await request.post('/api/platform',{headers:{'Content-Type':'application/json'},data:{action:'save-profile',profile:{kind:'student',name:'Indevido'}}});
 expect(unauthorized.status()).toBe(401);
 const admin=await bearer(request,'admin');
 const invalidJSON=await request.post('/api/platform',{headers:h(admin),data:'{broken-json'});
 expect(invalidJSON.status()).toBe(400);
 const extraField=await request.post('/api/platform',{headers:h(admin),data:{action:'create-session',session:{title:'X'},ignored:'unexpected'}});
 expect(extraField.status()).toBe(400);
 const badOrigin=await request.post('/api/platform/document-library',{headers:{...h(admin),Origin:'https://untrusted.example.invalid'},data:{action:'create-folder',name:'Cross origin forbidden'}});
 expect([400,403]).toContain(badOrigin.status());
 const unauth=[...['/api/platform/users','/api/platform/finance','/api/platform/files','/api/platform/document-library']];
 for(const path of unauth){
  const res=await request.post(path,{headers:{'Content-Type':'application/json'},data:{action:'create-folder'}});
  expect([401,403,415]).toContain(res.status());
 }
});
test('FR-002 NFR-001: user administration lifecycle and self-protection',async ({request})=>{
 const admin=await bearer(request,'admin'),member=await bearer(request,'member');
 const adminReq=(method,data,extra={})=>request.fetch('/api/platform/users',{method,headers:h(admin),data,...extra});
 const memberList=await request.get('/api/platform/users',{headers:{Authorization:'Bearer '+member}});
 expect(memberList.status()).toBe(403);
 const before=await request.get('/api/platform/users',{headers:{Authorization:'Bearer '+admin}});
 expect(before.status()).toBe(200);
 expect((await before.json()).users.some(u=>u.uid==='e2e-admin')).toBe(true);
 const self=await adminReq('PATCH',{action:'suspend',uid:'e2e-admin'});
 expect(self.status()).toBe(403);
 const create=await adminReq('POST',{email:'qa-new-e2e-2026@example.invalid',displayName:'Conta E2E temporária',roles:['member'],creationMode:'account',delivery:'temporary'});
 expect(create.status(),await create.text()).toBe(201);
 const newUser=(await create.json()).user;
 expect(newUser.uid).toBeTruthy();
 const listed=await request.get('/api/platform/users',{headers:{Authorization:'Bearer '+admin}});
 expect((await listed.json()).users.some(u=>u.uid===newUser.uid&&u.roles.includes('member'))).toBe(true);
 const suspend=await adminReq('PATCH',{action:'suspend',uid:newUser.uid});
 expect(suspend.status(),await suspend.text()).toBe(200);
 const afterSuspend=await request.get('/api/platform/users',{headers:{Authorization:'Bearer '+admin}});
 expect((await afterSuspend.json()).users.find(u=>u.uid===newUser.uid).suspended).toBe(true);
 const restore=await adminReq('PATCH',{action:'restore',uid:newUser.uid});
 expect(restore.status(),await restore.text()).toBe(200);
 const invalid=await adminReq('PATCH',{action:'update-access',uid:newUser.uid,roles:['unknown-role'],profileIds:[],active:true});
 expect(invalid.status()).toBe(400);
 const removed=await adminReq('DELETE',{uid:newUser.uid});
 expect(removed.status(),await removed.text()).toBe(200);
 const verified=await request.get('/api/platform/users',{headers:{Authorization:'Bearer '+admin}});
 expect((await verified.json()).users.some(u=>u.uid===newUser.uid)).toBe(false);
});
test('NFR-001: unverified identity cannot use private platform',async ({request})=>{
 const created=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=e2e-only',{
   data:{email:'unverified-e2e-2026@example.invalid',password:'Unverified-Synthetic-2026!',returnSecureToken:true}
 });
 expect(created.status()).toBe(200);
 const unverifiedToken=(await created.json()).idToken;
 const response=await request.get('/api/platform',{headers:{Authorization:'Bearer '+unverifiedToken}});
 expect([401,403]).toContain(response.status());
});
