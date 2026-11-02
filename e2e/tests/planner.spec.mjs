import {test,expect} from '@playwright/test';

const password='Synthetic-Only-E2E-Password-2026';
async function token(request,role){
 const response=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
  data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
 });
 expect(response.status(),role).toBe(200);
 return (await response.json()).idToken;
}
const headers=value=>({Authorization:'Bearer '+value,'Content-Type':'application/json'});
test('association planner: authorization, assignee visibility, versioning and archive lifecycle',async ({request})=>{
 const admin=await token(request,'admin'),member=await token(request,'member');
 const create=await request.post('/api/platform/planner',{headers:headers(admin),data:{action:'save',task:{
  title:'Tarefa sintética E2E',description:'Planeamento fictício para validar o fluxo.',status:'todo',priority:'normal',
  startDate:'2026-11-05',dueDate:'2026-11-10',assigneeProfileIds:['e2e-profile-member']
 }}});
 expect(create.status(),await create.text()).toBe(200);
 const id=(await create.json()).id;
 const memberRead=await request.get('/api/platform/planner',{headers:headers(member)});
 expect((await memberRead.json()).tasks.some(task=>task.id===id)).toBe(true);
 const forbidden=await request.post('/api/platform/planner',{headers:headers(member),data:{action:'save',task:{title:'Sem autorização',assigneeProfileIds:['e2e-profile-member']}}});
 expect(forbidden.status()).toBe(403);
 const update=await request.post('/api/platform/planner',{headers:headers(admin),data:{action:'save',task:{id,version:1,title:'Tarefa sintética atualizada',description:'Atualização fictícia.',status:'in_progress',priority:'high',startDate:'2026-11-05',dueDate:'2026-11-10',assigneeProfileIds:['e2e-profile-member']}}});
 expect(update.status(),await update.text()).toBe(200);
 const stale=await request.post('/api/platform/planner',{headers:headers(admin),data:{action:'save',task:{id,version:1,title:'Edição antiga',description:'',status:'todo',priority:'normal',startDate:'',dueDate:'',assigneeProfileIds:[]}}});
 expect(stale.status()).toBe(409);
 const archived=await request.post('/api/platform/planner',{headers:headers(admin),data:{action:'archive',id,version:2}});
 expect(archived.status(),await archived.text()).toBe(200);
 const archiveRead=await request.get('/api/platform/planner?archived=1',{headers:headers(admin)});
 expect((await archiveRead.json()).tasks.some(task=>task.id===id)).toBe(true);
 const restored=await request.post('/api/platform/planner',{headers:headers(admin),data:{action:'restore',id,version:3}});
 expect(restored.status(),await restored.text()).toBe(200);
});
