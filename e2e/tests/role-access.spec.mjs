import {test,expect} from '@playwright/test';

const password='Synthetic-Only-E2E-Password-2026';
async function token(request,role){
  const response=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
    data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
  });
  expect(response.ok(),role+' fixture must authenticate').toBeTruthy();
  return (await response.json()).idToken;
}
const headers=idToken=>({Authorization:'Bearer '+idToken});
const expected={
  admin:['overview','sessions','profiles','assignment','material','assessment','progress','justification','finance','document','message','notifications','reports'],
  coordinator:['overview','sessions','profiles','assignment','material','assessment','progress','justification','document','message','notifications','reports'],
  member:['overview','sessions','profiles','finance','document','message','notifications'],
  student:['overview','sessions','profiles','assignment','material','assessment','progress','justification','document','message','notifications'],
  guardian:['overview','sessions','profiles','assignment','material','assessment','progress','justification','document','message','notifications'],
  tutor:['overview','sessions','profiles','assignment','material','assessment','progress','justification','document','message','notifications']
};

for(const [role,modules] of Object.entries(expected)){
  test('role access matrix: '+role+' only receives its allowed platform modules',async ({request})=>{
    const accessToken=await token(request,role);
    const response=await request.get('/api/platform',{headers:headers(accessToken)});
    expect(response.status(),role).toBe(200);
    const payload=await response.json();
    expect(payload.account.active,role).toBe(true);
    expect(payload.account.roles).toContain(role);
    expect(payload.account.modules.sort()).toEqual([...modules].sort());
    const library=await request.get('/api/platform/document-library',{headers:headers(accessToken)});
    expect(library.status(),role).toBe(200);
    const list=await library.json();
    expect(list.folders.every(f=>!('storagePath' in f))).toBe(true);
    expect(list.documents.every(d=>!('storagePath' in d))).toBe(true);
  });
}
test('a non-authorized document is invisible in list, details and version URLs',async ({request})=>{
  const admin=await token(request,'admin'),member=await token(request,'member');
  const create=await request.post('/api/platform/document-library',{headers:{...headers(admin),'Content-Type':'application/json'},
    data:{action:'create-folder',name:'Pasta privada '+Math.random().toString(36).slice(2,7),parentId:''}});
  expect(create.status()).toBe(201);
  const privateFolder=(await create.json()).id;
  const raw=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  const upload=await request.post('/api/platform/document-library',{headers:headers(admin),
    multipart:{file:{name:'privado-e2e.pdf',mimeType:'application/pdf',buffer:raw},title:'Prova privada e2e',category:'juridico',
      folderId:privateFolder,permissions:'{}'}});
  expect(upload.status()).toBe(201);
  const {documentId,versionId}=await upload.json();
  const list=await request.get('/api/platform/document-library',{headers:headers(member)});
  expect(list.status()).toBe(200);
  expect((await list.json()).documents.some(d=>d.id===documentId)).toBe(false);
  const direct=await request.get('/api/platform/document-library?documentId='+documentId,{headers:headers(member)});
  expect(direct.status()).toBe(403);
  const bytes=await request.get('/api/platform/document-library?documentId='+documentId+'&versionId='+versionId,{headers:headers(member)});
  expect(bytes.status()).toBe(403);
  const adminContent=await request.get('/api/platform/document-library?documentId='+documentId+'&versionId='+versionId,{headers:headers(admin)});
  expect(adminContent.status()).toBe(200);
  expect(adminContent.headers()['cache-control']).toContain('no-store');
  expect(adminContent.headers()['x-content-type-options']).toBe('nosniff');
});
test('concurrent editing and inappropriate folder moves are rejected',async ({request})=>{
 const admin=await token(request,'admin');
 const call=body=>request.post('/api/platform/document-library',{headers:{...headers(admin),'Content-Type':'application/json'},data:body});
 const pdf=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
 const response=await request.post('/api/platform/document-library',{headers:headers(admin),
    multipart:{file:{name:'concurrency.pdf',mimeType:'application/pdf',buffer:pdf},title:'Documento concorrente',category:'financeiro',permissions:'{}'}});
 expect(response.status()).toBe(201);
 const id=(await response.json()).documentId;
 const original=await request.get('/api/platform/document-library?documentId='+id,{headers:headers(admin)});
 const revision=(await original.json()).document.revision;
 const first=await call({action:'update-document',documentId:id,revision,title:'Alteração 1'});
 expect(first.status()).toBe(200);
 const stale=await call({action:'update-document',documentId:id,revision,title:'Alteração antiga'});
 expect(stale.status()).toBe(409);
 const invalid=await call({action:'update-document',documentId:id,revision:revision+1,title:'Tentativa de mover',folderId:'not-a-folder'});
 expect([400,404]).toContain(invalid.status());
});
