import {test,expect} from '@playwright/test';
const password='Synthetic-Only-E2E-Password-2026';
async function bearer(request,role){
 const res=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}});
 expect(res.status()).toBe(200);
 return (await res.json()).idToken;
}
const headers=token=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
test('financial quota lifecycle, partial payments and member isolation',async ({request})=>{
 const admin=await bearer(request,'admin'),member=await bearer(request,'member'),student=await bearer(request,'student');
 const post=body=>request.post('/api/platform/finance',{headers:headers(admin),data:body});
 const due={memberId:'e2e-profile-member',periodType:'monthly',period:'2026-10',amount:50,dueAt:'2026-11-10',notes:'Quota de teste sintética'};
 const create=await post({action:'create-due',due});
 expect(create.status(),await create.text()).toBe(201);
 const dueId=(await create.json()).id;
 const duplicate=await post({action:'create-due',due});
 expect(duplicate.status()).toBe(409);
 const studentRead=await request.get('/api/platform/finance',{headers:{Authorization:'Bearer '+student}});
 expect(studentRead.status()).toBe(403);
 const memberRead=await request.get('/api/platform/finance',{headers:{Authorization:'Bearer '+member}});
 expect(memberRead.status()).toBe(200);
 const memberData=await memberRead.json();
 expect(memberData.permissions.manage).toBe(false);
 expect(memberData.dues.map(x=>x.id)).toContain(dueId);
 expect(memberData.donations).toEqual([]);
 expect(memberData.financings).toEqual([]);
 expect(memberData.expenses).toEqual([]);
 const memberWrite=await request.post('/api/platform/finance',{headers:headers(member),data:{action:'delete-due',id:dueId,version:1}});
 expect(memberWrite.status()).toBe(403);
 const payment={dueId,amount:20,paidAt:'2026-10-01',method:'cash',notes:'Recebimento parcial sintético'};
 const paid=await post({action:'record-payment',payment});
 expect(paid.status(),await paid.text()).toBe(201);
 const paymentId=(await paid.json()).id;
 const overpay=await post({action:'record-payment',payment:{...payment,amount:40}});
 expect(overpay.status()).toBe(409);
 const deleteDue=await post({action:'delete-due',id:dueId,version:1});
 expect(deleteDue.status()).toBe(409);
 const deletePayment=await post({action:'delete-payment',id:paymentId,version:1});
 expect(deletePayment.status()).toBe(200);
 const deleteAfter=await post({action:'delete-due',id:dueId,version:1});
 expect(deleteAfter.status()).toBe(200);
});
test('anonymous donor input avoids storing a named financial record',async ({request})=>{
 const admin=await bearer(request,'admin');
 const post=body=>request.post('/api/platform/finance',{headers:headers(admin),data:body});
 const response=await post({action:'record-donation',donation:{amount:5,donatedAt:'2026-10-01',donorName:'Pessoa sintética',anonymous:true,method:'cash',purpose:'Teste de privacidade'}});
 expect(response.status(),await response.text()).toBe(201);
 const id=(await response.json()).id;
 const get=await request.get('/api/platform/finance',{headers:{Authorization:'Bearer '+admin}});
 expect(get.status()).toBe(200);
 const value=(await get.json()).donations.find(x=>x.id===id);
 expect(value.anonymous).toBe(true);
 expect(value.donorName).toBe('');
});

test('FR-013: financing, expenses and donation CRUD enforce versions and least-privilege',async ({request})=>{
 const admin=await bearer(request,'admin'),member=await bearer(request,'member');
 const post=body=>request.post('/api/platform/finance',{headers:headers(admin),data:body});
 const financing={amount:1250,receivedAt:'2026-10-05',funder:'Financiador sintético',purpose:'Projeto E2E',method:'transfer',reference:'E2E-F'};
 const expense={amount:90,paidAt:'2026-10-07',payee:'Fornecedor sintético',category:'materials',purpose:'Materiais E2E',method:'transfer',reference:'E2E-E'};
 const donation={amount:12,donatedAt:'2026-10-06',donorName:'Doador fictício',anonymous:false,method:'cash',purpose:'Teste E2E'};
 for(const [type,body,createAction,updateAction,deleteAction] of [
   ['financing',financing,'record-financing','update-financing','delete-financing'],
   ['expense',expense,'record-expense','update-expense','delete-expense'],
   ['donation',donation,'record-donation','update-donation','delete-donation']
 ]){
   const created=await post({action:createAction,[type]:body});
   expect(created.status(),type+': '+await created.text()).toBe(201);
   const id=(await created.json()).id;
   const altered=await post({action:updateAction,id,version:1,[type]:{...body,notes:'Atualização E2E'}});
   expect(altered.status(),await altered.text()).toBe(200);
   const stale=await post({action:updateAction,id,version:1,[type]:body});
   expect(stale.status()).toBe(409);
   const visible=await request.get('/api/platform/finance',{headers:{Authorization:'Bearer '+admin}});
   expect(visible.status()).toBe(200);
   const key=type==='financing'?'financings':type==='expense'?'expenses':'donations';
   expect((await visible.json())[key].some(item=>item.id===id&&item.version===2)).toBe(true);
   const denied=await request.post('/api/platform/finance',{headers:headers(member),data:{action:deleteAction,id,version:2}});
   expect(denied.status()).toBe(403);
   const deletion=await post({action:deleteAction,id,version:2});
   expect(deletion.status(),await deletion.text()).toBe(200);
   const gone=await request.get('/api/platform/finance',{headers:{Authorization:'Bearer '+admin}});
   expect((await gone.json())[key].some(item=>item.id===id)).toBe(false);
 }
 const negative=await post({action:'record-expense',expense:{...expense,amount:-1}});
 expect(negative.status()).toBe(400);
});
