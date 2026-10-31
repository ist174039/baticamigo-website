import {test,expect} from '@playwright/test';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
const password='Synthetic-Only-E2E-Password-2026';
async function token(request,role='admin'){
 const r=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}});
 expect(r.status()).toBe(200);return (await r.json()).idToken;
}
async function login(page,role='student'){
 await page.goto('/platform/login');
 await page.getByLabel('Email').fill('qa-'+role+'@example.invalid');
 await page.getByLabel('Palavra-passe').fill(password);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('link',{name:/Abrir plataforma/}).click();
 await expect(page.locator('.private-shell')).toBeVisible();
}
test('FR-016 FR-017 FR-019 FR-020: assessments retain scale, show comparable progress and trace evidence to source records',async ({request,page},testInfo)=>{
 const subject='Ciências E2E '+testInfo.retry;
 const admin=await token(request);
 const post=body=>request.post('/api/platform',{headers:{Authorization:'Bearer '+admin,'Content-Type':'application/json'},data:body});
 for(const [score,date,title] of [[10,'2026-09-07','Avaliação diagnóstica de Ciências'],[13,'2026-10-08','Avaliação de seguimento de Ciências']]){
  const res=await post({action:'save-record',record:{kind:'assessment',studentId:'e2e-profile-student',title,content:'Evidência educativa sintética',subject,period:'2026-T1',origin:'Teste E2E progressão',score,scaleMin:0,scaleMax:20,assessedOn:date,gaps:'Rever exercícios de Ciências'}});
  expect(res.status(),await res.text()).toBe(200);
 }
 await login(page,'student');await page.goto('/area?tab=progress');
 await expect(page.getByRole('heading',{name:'Resumo por disciplina'})).toBeVisible();
 await expect(page.locator('.platform-progress-desktop-results:visible').getByText(subject,{exact:true})).toBeVisible();
 await expect(page.locator('.platform-progress-desktop-results:visible tr').filter({hasText:subject}).getByText('+3 pontos')).toBeVisible();
 await page.locator('.platform-progress-desktop-results:visible').getByRole('button',{name:'Ver histórico de '+subject+' (2 registos)'}).click();
 const dialog=page.getByRole('dialog',{name:'Histórico de '+subject});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByText('Avaliação diagnóstica de Ciências')).toBeVisible();
 await expect(dialog.getByText('Avaliação de seguimento de Ciências')).toBeVisible();
 await expect(dialog.getByText('Resultado: 10 numa escala de 0 a 20')).toBeVisible();
 await expect(dialog.getByText('Resultado: 13 numa escala de 0 a 20')).toBeVisible();
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
});
test('NFR-005: authenticated mutation produces minimal timestamped server-side audit event',async ({request})=>{
 const emulator=String(process.env.FIRESTORE_EMULATOR_HOST||'');
 expect(emulator).toMatch(/^(127\.0\.0\.1|localhost):8080$/);
 const admin=await token(request);
 const post=await request.post('/api/platform',{headers:{Authorization:'Bearer '+admin,'Content-Type':'application/json'},data:{action:'save-profile',profile:{kind:'tutor',name:'Audit E2E (fictício)',active:true,subjects:'Matemática'}}});
 expect(post.status(),await post.text()).toBe(200);
 const id=(await post.json()).id;
 const app=initializeApp({projectId:'baticamigo-c0384'},'audit-check-'+id);
 try{
  const db=getFirestore(app);
  const snap=await db.collection('platform_audit').where('target','==',id).limit(10).get();
  const entries=snap.docs.map(x=>x.data());
  expect(entries.length).toBeGreaterThan(0);
  const event=entries.find(e=>e.action==='save-profile');
  expect(event).toBeTruthy();
  expect(event.actorUid).toBe('e2e-admin');
  expect(event.createdAt).toBeTruthy();
  expect(JSON.stringify(event)).not.toContain('Audit E2E (fictício)');
  expect(JSON.stringify(event)).not.toContain('qa-admin@example.invalid');
 }finally{await deleteApp(app);}
});
