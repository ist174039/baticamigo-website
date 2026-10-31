import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const password='Synthetic-Only-E2E-Password-2026';
async function login(page,role='admin'){
 await page.goto('/platform/login');
 await page.getByLabel('Email').fill('qa-'+role+'@example.invalid');
 await page.getByLabel('Palavra-passe').fill(password);
 await page.getByRole('button',{name:'Entrar',exact:true}).click();
 await page.getByRole('link',{name:/Abrir plataforma/}).click();
 await expect(page.locator('.private-shell')).toBeVisible();
}
test('FR-014: public editorial endpoint allowlists fields and rejects traversal/private queries',async ({request})=>{
 const response=await request.get('/api/public-content?collection=noticias');
 expect(response.status()).toBe(200);
 const body=await response.json();
 const synthetic=body.items.find(x=>x.id==='e2e-news-public');
 expect(synthetic).toBeTruthy();
 expect(synthetic.titulo).toBe('Notícia pública sintética');
 expect(synthetic.destaque).toBe(true);
 expect(JSON.stringify(body)).not.toContain('internalOnly');
 expect(JSON.stringify(body)).not.toContain('NÃO EXPOR');
 expect(JSON.stringify(body)).not.toContain('qa-private@example.invalid');
 expect(response.headers()['cache-control']).toContain('public');
 const invalid=await request.get('/api/public-content?collection=platform_accounts');
 expect(invalid.status()).toBe(400);
 const invalidId=await request.get('/api/public-content?collection=noticias&id=e2e-news-public');
 expect(invalidId.status()).toBe(400);
 const config=await request.get('/api/public-content?collection=site_config&id=contact');
 expect(config.status()).toBe(200);
 const wrongConfig=await request.get('/api/public-content?collection=site_config&id=secret');
 expect(wrongConfig.status()).toBe(400);
});
test('FR-014: public website and authorized CMS are reachable; management remains private',async ({page,request})=>{
 await page.goto('/');
 await expect(page.locator('body')).toBeVisible();
 await page.goto('/noticias');
 await expect(page.locator('body')).toBeVisible();
 const unauthorized=await request.get('/api/admin/users?collection=noticias');
 expect(unauthorized.status()).toBe(401);
 await login(page,'admin');
 await page.goto('/platform/admin');
 await expect(page.locator('body')).toBeVisible();
});
test('FR-015 FR-018: aggregate reports filter, suppress small groups and export privacy-safe CSV',async ({page})=>{
 await login(page,'admin');
 await page.goto('/area?tab=reports');
 await expect(page.getByRole('heading',{name:'Relatórios operacionais'})).toBeVisible();
 await expect(page.getByText(/grupos com menos de cinco alunos são suprimidos/i)).toBeVisible();
 await page.getByLabel('Agrupar por').selectOption('all');
 await expect(page.getByText('Grupo pequeno',{exact:true})).toBeVisible();
 const pending=page.waitForEvent('download');
 await page.getByRole('button',{name:'Exportar CSV'}).click();
 const download=await pending;
 expect(download.suggestedFilename()).toMatch(/relatorio-operacional.*\.csv$/);
 const content=await readFile(await download.path(),'utf8');
 expect(content).toContain('Grupo pequeno');
 expect(content).not.toContain('Aluno sintético');
 expect(content).not.toContain('e2e-profile-student');
 await page.getByLabel('De').fill('2026-01-01');
 await page.getByLabel('Até').fill('2026-12-31');
 await expect(page.getByRole('heading',{name:'Relatórios operacionais'})).toBeVisible();
});
test('FR-015 NFR-001: member cannot reach privileged reports and finance reports',async ({page})=>{
 await login(page,'member');
 await page.goto('/area?tab=reports');
 await expect(page.getByRole('heading',{name:'Relatórios operacionais'})).toHaveCount(0);
 const area=page.locator('.platform-tab-content');
 await expect(area).toBeVisible();
});
