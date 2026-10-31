import {test,expect} from '@playwright/test';
const password='Synthetic-Only-E2E-Password-2026';
async function bearer(request,role){
 const r=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
   data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
 });
 expect(r.status()).toBe(200);
 return (await r.json()).idToken;
}
const headers=token=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
test('learning records: assignments, materials, legacy documents, assessments, messages and justifications',async ({request})=>{
 const admin=await bearer(request,'admin'),student=await bearer(request,'student'),guardian=await bearer(request,'guardian'),member=await bearer(request,'member');
 const post=body=>request.post('/api/platform',{headers:headers(admin),data:body});
 const studentId='e2e-profile-student';
 const session={title:'Sessão para justificação E2E',studentIds:[studentId],tutorId:'e2e-profile-tutor',startsAt:'2026-09-22T09:00:00Z',endsAt:'2026-09-22T10:00:00Z',room:'Sala B'};
 const createdSession=await post({action:'create-session',session});
 expect(createdSession.status(),await createdSession.text()).toBe(200);
 const sessionId=(await createdSession.json()).id;
 const records=[
  {kind:'assignment',title:'Trabalho sintético',content:'Exercício de interpretação',dueAt:'2026-12-31',shareWithRoles:['guardian']},
  {kind:'material',title:'Material sintético',content:'Conteúdo pedagógico de teste',shareWithProfileIds:['e2e-profile-guardian']},
  {kind:'document',title:'Documento pedagógico legado',content:'Descrição da ficha de acompanhamento'},
  {kind:'assessment',title:'Avaliação de outubro',content:'Avaliação sintética',subject:'Matemática',period:'2026-T1',origin:'Teste E2E',score:12,scaleMin:0,scaleMax:20,assessedOn:'2026-10-01'},
  {kind:'assessment',title:'Avaliação de seguimento',content:'Revisão sintética',subject:'Matemática',period:'2026-T1',origin:'Teste E2E',score:15,scaleMin:0,scaleMax:20,assessedOn:'2026-10-18'},
  {kind:'message',title:'Mensagem sintética',content:'Informação de acompanhamento com dados fictícios'},
  {kind:'justification',title:'Falta justificada E2E',content:'Motivo genérico de teste',sessionId}
 ];
 const created=[];
 for(const record of records){
  const res=await post({action:'save-record',record:{studentId,...record}});
  expect(res.status(),record.kind+': '+await res.text()).toBe(200);
  created.push({kind:record.kind,id:(await res.json()).id});
 }
 for(const [role,token] of [['student',student],['guardian',guardian]]){
  const response=await request.get('/api/platform',{headers:{Authorization:'Bearer '+token}});
  expect(response.status(),role).toBe(200);
  const body=await response.json();
  for(const item of created) expect(body.records.some(record=>record.id===item.id),role+' cannot see '+item.kind).toBe(true);
  const summary=body.records.filter(record=>record.kind==='assessment'&&record.studentId===studentId);
  expect(summary).toHaveLength(2);
 }
 const memberRead=await request.get('/api/platform',{headers:{Authorization:'Bearer '+member}});
 const memberRecords=(await memberRead.json()).records||[];
 for(const item of created) expect(memberRecords.some(record=>record.id===item.id)).toBe(false);
 const forbidden=await request.post('/api/platform',{headers:headers(member),data:{action:'save-record',record:{kind:'assessment',studentId,title:'Invasão de teste',subject:'Matemática',period:'2026-T1',origin:'Outro',score:19,scaleMin:0,scaleMax:20}}});
 expect(forbidden.status()).toBe(403);
 const original=records[0],ref=created[0].id;
 const update=await post({action:'save-record',record:{...original,studentId,id:ref,version:1,title:'Trabalho atualizado'}});
 expect(update.status(),await update.text()).toBe(200);
 const stale=await post({action:'save-record',record:{...original,studentId,id:ref,version:1,title:'Edição antiga'}});
 expect(stale.status()).toBe(409);
 const badScale=await post({action:'save-record',record:{kind:'assessment',studentId,title:'Escala incoerente',subject:'Matemática',period:'2026-T1',origin:'Teste',score:30,scaleMin:0,scaleMax:20}});
 expect(badScale.status()).toBe(400);
});
