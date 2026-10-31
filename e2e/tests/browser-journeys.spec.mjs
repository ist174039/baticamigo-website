import {test,expect} from '@playwright/test';
const password='Synthetic-Only-E2E-Password-2026';
async function signIn(page,role='admin'){
 await page.goto('/platform/login');
 await page.getByLabel('Email').fill('qa-'+role+'@example.invalid');
 await page.getByLabel('Palavra-passe').fill(password);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('link',{name:/Abrir plataforma/}).click();
 // During the first cold WebKit navigation, Next dev Fast Refresh can cancel
 // the /platform/area request and leave the authorized space chooser visible.
 // Retry only that interrupted navigation, never an authorization error.
 try {
  await expect(page.locator('.private-shell')).toBeVisible({timeout:5000});
 } catch(error) {
  if(new URL(page.url()).pathname!=='/platform/login') throw error;
  await expect(page.getByRole('link',{name:/Abrir plataforma/})).toBeVisible();
  await page.getByRole('link',{name:/Abrir plataforma/}).click();
  await expect(page.locator('.private-shell')).toBeVisible();
 }
}
test('FR-010 NFR-003 NFR-004: document folder creation, search and panel dismissal via browser',async ({page})=>{
 await signIn(page);
 await page.goto('/area?tab=document');
 await expect(page.getByRole('heading',{name:'Documentos e pastas'})).toBeVisible();
 await page.getByRole('button',{name:/Nova pasta/}).click();
 const panel=page.locator('.ba-workspace-panel[open]');
 await expect(panel.getByRole('heading',{name:'Criar pasta'})).toBeVisible();
 await panel.getByLabel('Nome da pasta').fill('Pasta criada no browser');
 await panel.getByRole('button',{name:'Guardar pasta'}).click();
 await expect(panel).not.toBeVisible();
 await expect(page.getByRole('button',{name:/Pasta criada no browser/})).toBeVisible();
 await page.getByRole('button',{name:/Pasta criada no browser/}).click();
 await expect(page.getByRole('button',{name:/Configurar esta pasta/})).toBeVisible();
 await page.getByRole('button',{name:/Configurar esta pasta/}).click();
 await expect(panel.getByRole('heading',{name:'Configurar pasta'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(panel).not.toBeVisible();
 await page.getByRole('button',{name:'Arquivo principal'}).click();
 await page.getByLabel('Pesquisar documentos').fill('palavra-inexistente-e2e');
 await expect(page.getByText(/0 documento\(s\) encontrado\(s\)/)).toBeVisible();
 await page.getByRole('button',{name:'Partilhados comigo'}).click();
 await expect(page.getByRole('heading',{name:'Documentos e pastas'})).toBeVisible();
});
for(const {width,height} of [{width:320,height:568},{width:375,height:667},{width:768,height:1024},{width:1440,height:900}]){
 test('NFR-003: document create/edit side panel and action controls at '+width+'px',async ({page})=>{
  await page.setViewportSize({width,height});await signIn(page);
  await page.goto('/area?tab=document');
  await page.getByRole('button',{name:/Adicionar documento/}).click();
  const panel=page.locator('.ba-workspace-panel[open]');
  await expect(panel).toBeVisible();
  await panel.getByLabel('Título do documento').fill('Um título longo para testar quebras '.repeat(5).slice(0,145));
  await panel.getByLabel('Descrição').fill('Dados sintéticos de uma descrição extensa '.repeat(35).slice(0,1400));
  const a=await panel.boundingBox(), footer=await panel.locator('.ba-panel-footer').boundingBox();
  expect(a.x).toBeGreaterThanOrEqual(-1);
  expect(a.x+a.width).toBeLessThanOrEqual(width+1);
  expect(footer.x).toBeGreaterThanOrEqual(-1);
  expect(footer.x+footer.width).toBeLessThanOrEqual(width+1);
  await expect(panel.getByRole('button',{name:'Criar documento'})).toBeVisible();
  await panel.getByRole('button',{name:'Cancelar'}).click();
  await expect(panel).not.toBeVisible();
 });
}
test('NFR-004: manual search and screen-reader navigation remain available on narrow screen',async ({page})=>{
 await page.setViewportSize({width:375,height:667});
 await signIn(page,'guardian');
 await page.goto('/platform/manual');
 await expect(page.getByRole('heading',{name:'Manual completo da plataforma'})).toBeVisible();
 await page.getByRole('searchbox',{name:'Pesquisar processos'}).fill('documentos');
 await expect(page.getByRole('navigation',{name:'Índice do manual'})).toBeVisible();
 const btn=page.getByRole('navigation',{name:'Índice do manual'}).getByRole('button',{name:/Pastas, documentos, partilha e versões/});
 await expect(btn).toBeVisible();
 await btn.click();
 await expect(page.getByRole('heading',{name:/Pastas, documentos, partilha e versões/})).toBeVisible();
 await page.getByRole('button',{name:/Assinalar este passo/}).click();
 await expect(page.getByText(/1 de .* passos assinalados/)).toBeVisible();
 const index=await page.locator('.ba-manual-index').boundingBox();
 expect(index.x).toBeGreaterThanOrEqual(-1);
 expect(index.x+index.width).toBeLessThanOrEqual(376);
});
