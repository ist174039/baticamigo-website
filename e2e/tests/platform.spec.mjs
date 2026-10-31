import {test,expect} from '@playwright/test';
const password='Synthetic-Only-E2E-Password-2026';
async function login(page,role='admin'){
  await page.goto('/platform/login');
  await page.getByLabel('Email').fill('qa-'+role+'@example.invalid');
  await page.getByLabel('Palavra-passe').fill(password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.getByText('Plataforma BaticAmigo',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:/Abrir plataforma/}).click();
  await expect(page.locator('.private-shell')).toBeVisible();
}
async function bearer(request,role='admin'){
  const r=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
    data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
  });
  expect(r.ok()).toBeTruthy();
  return (await r.json()).idToken;
}
const headers=token=>({Authorization:'Bearer '+token});
test('website, login and private APIs deny anonymous access',async ({page,request})=>{
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
  await page.goto('/platform/manual');
  await expect(page).toHaveURL(/\/platform\/login/);
  for(const path of ['/api/platform','/api/platform/document-library','/api/platform/users']){
    const response=await request.get(path);
    expect([401,403]).toContain(response.status());
  }
});
test('manual is visible by profile and supports navigation',async ({page})=>{
  await login(page,'member');
  await page.goto('/platform/manual');
  await expect(page.getByRole('heading',{name:'Manual completo da plataforma'})).toBeVisible();
  await page.getByRole('button',{name:/Pastas, documentos, partilha e versões/}).click();
  await expect(page.getByRole('heading',{name:/Pastas, documentos, partilha e versões/})).toBeVisible();
  await page.getByRole('button',{name:/Assinalar este passo/}).click();
  await expect(page.getByText(/1 de .* passos assinalados/)).toBeVisible();
});
test('administrator can reach the existing platform modules',async ({page})=>{
  await login(page);
  for(const label of ['Sessões e presenças','Trabalhos','Materiais','Avaliações','Evolução','Justificações','Documentos','Mensagens','Avisos','Relatórios']){
    const nav=page.getByRole('button',{name:label,exact:true});
    await expect(nav).toBeVisible();
    await nav.click();
    await expect(page.locator('.platform-tab-content')).toBeVisible();
  }
});
test('document CRUD, version history, inherited reader permission and soft delete',async ({request})=>{
  const token=await bearer(request,'admin');
  const post=payload=>request.post('/api/platform/document-library',{headers:{...headers(token),'Content-Type':'application/json'},data:payload});
  const folder=await post({action:'create-folder',name:'Pasta E2E',parentId:'',permissions:{viewRoles:['member'],editRoles:[]}});
  expect(folder.status(),await folder.text()).toBe(201);
  const folderId=(await folder.json()).id;
  const pdf=Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  const create=await request.post('/api/platform/document-library',{headers:headers(token),
    multipart:{file:{name:'manual-e2e.pdf',mimeType:'application/pdf',buffer:pdf},title:'Documento de teste E2E',category:'institucional',folderId,description:'Versão original',permissions:JSON.stringify({viewRoles:['member']})}});
  expect(create.status(),await create.text()).toBe(201);
  const documentId=(await create.json()).documentId;
  const item=await request.get('/api/platform/document-library?documentId='+documentId,{headers:headers(token)});
  expect(item.status()).toBe(200);
  const {document,versions}=await item.json();
  expect(versions).toHaveLength(1);
  const member=await bearer(request,'member');
  const memberRead=await request.get('/api/platform/document-library?documentId='+documentId,{headers:headers(member)});
  expect(memberRead.status()).toBe(200);
  const blocked=await request.post('/api/platform/document-library',{headers:{...headers(member),'Content-Type':'application/json'},data:{action:'delete-document',documentId}});
  expect(blocked.status()).toBe(403);
  const change=await post({action:'update-document',documentId,revision:document.revision,title:'Título alterado',description:'Metadados corrigidos',category:'investimentos'});
  expect(change.status(),await change.text()).toBe(200);
  const upload=await request.post('/api/platform/document-library',{headers:headers(token),
    multipart:{documentId,file:{name:'v2.pdf',mimeType:'application/pdf',buffer:pdf}}});
  expect(upload.status(),await upload.text()).toBe(201);
  const history=await request.get('/api/platform/document-library?documentId='+documentId,{headers:headers(token)});
  expect((await history.json()).versions).toHaveLength(2);
  const remove=await post({action:'delete-document',documentId});
  expect(remove.status()).toBe(200);
  const denied=await request.get('/api/platform/document-library?documentId='+documentId,{headers:headers(member)});
  expect(denied.status()).toBe(403);
  const trash=await request.get('/api/platform/document-library?trash=1',{headers:headers(token)});
  expect((await trash.json()).documents.some(d=>d.id===documentId)).toBe(true);
  const restore=await post({action:'restore-document',documentId});
  expect(restore.status()).toBe(200);
  const folderDelete=await post({action:'delete-folder',folderId});
  expect(folderDelete.status()).toBe(409);
});
test('side panels keep footer buttons inside 320px mobile viewport',async ({page})=>{
  await page.setViewportSize({width:320,height:568});
  await login(page);
  await page.goto('/area?tab=document');
  await expect(page.getByRole('heading',{name:'Documentos e pastas'})).toBeVisible();
  await page.getByRole('button',{name:/Adicionar documento/}).click();
  const panel=page.locator('.ba-workspace-panel[open]');
  await expect(panel).toBeVisible();
  await panel.getByLabel('Título do documento').fill('Documento '+ 'muito longo '.repeat(11));
  await panel.getByLabel('Descrição').fill('Descrição de stress. '.repeat(70));
  const bounds=await panel.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.width).toBeLessThanOrEqual(321);
  const footer=panel.locator('.ba-panel-footer');
  const foot=await footer.boundingBox();
  expect(foot.x).toBeGreaterThanOrEqual(-1);
  expect(foot.x+foot.width).toBeLessThanOrEqual(321);
  await expect(footer.getByRole('button',{name:'Criar documento'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(panel).not.toBeVisible();
});
test('unprivileged roles cannot create folders or enumerate private file paths',async ({request})=>{
  const token=await bearer(request,'student');
  const response=await request.get('/api/platform/document-library',{headers:headers(token)});
  expect(response.status()).toBe(200);
  const result=await response.json();
  expect(result.documents.every(doc=>!doc.storagePath)).toBeTruthy();
  const attempt=await request.post('/api/platform/document-library',{
    headers:{...headers(token),'Content-Type':'application/json'},data:{action:'create-folder',name:'Pasta indevida',parentId:''}});
  expect(attempt.status()).toBe(403);
});
