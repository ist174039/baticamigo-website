import {context,collection,json,failure,audit} from '../../../../lib/platform/server';
import {assert,hasRole,profileIds} from '../../../../lib/platform/domain.mjs';
import {dueInput,paymentInput,donationInput,lisbonToday,movementId} from '../../../../lib/platform/finance.mjs';

export const runtime='nodejs';
export const dynamic='force-dynamic';
const rows=snapshot=>snapshot.docs.map(doc=>({...doc.data(),id:doc.id}));
async function bounded(query,label='registos financeiros') { const result=await query.limit(501).get();assert(result.size<=500,`Demasiados ${label}. Contacte o suporte.`,409);return rows(result); }
async function body(request) { const length=Number(request.headers.get('content-length')||0);assert(length>0&&length<=16384,'Pedido inválido.',413);let value;try{value=await request.json();}catch{assert(false,'JSON inválido.');}assert(value&&typeof value==='object'&&!Array.isArray(value));return value; }
function manager(account) { assert(hasRole(account,'admin'),'Apenas a administração pode consultar ou alterar a gestão financeira.',403); }
function snapshot(data) { const keys=['memberId','periodType','period','amountCents','dueAt','paidAt','donatedAt','dueId','method','reference','donorName','anonymous','purpose','notes'];return Object.fromEntries(keys.filter(key=>data[key]!==undefined).map(key=>[key,data[key]])); }

export async function GET(request) {
  try {
    const {db,account}=await context(request);
    const admin=hasRole(account,'admin');
    const memberIds=profileIds(account);
    assert(admin||(hasRole(account,'member')&&memberIds.length>0),'Sem acesso à gestão financeira.',403);
    let profiles=[];
    if(admin) profiles=await bounded(collection(db,'profiles').where('kind','==','member'),'sócios');
    else {
      const docs=await db.getAll(...memberIds.map(profileId=>collection(db,'profiles').doc(profileId)));
      profiles=docs.filter(doc=>doc.exists&&doc.data().kind==='member'&&doc.data().active===true).map(doc=>({...doc.data(),id:doc.id}));
    }
    let dues=[];
    if(admin) dues=await bounded(collection(db,'dues'));
    else for(const member of profiles) dues.push(...await bounded(collection(db,'dues').where('memberId','==',member.id)));
    const dueIds=dues.map(due=>due.id);
    let payments=[];
    if(admin) payments=await bounded(collection(db,'due_payments'));
    else for(let offset=0;offset<dueIds.length;offset+=10) payments.push(...await bounded(collection(db,'due_payments').where('dueId','in',dueIds.slice(offset,offset+10))));
    const donations=admin?await bounded(collection(db,'donations')):[];
    return json({permissions:{manage:admin},profiles,dues,payments,donations});
  } catch(error) { return failure(error); }
}

export async function POST(request) {
  try {
    const {db,account}=await context(request);manager(account);
    const value=await body(request);assert(typeof value.action==='string','Operação inválida.');
    if(value.action==='create-due') {
      assert(Object.keys(value).every(key=>['action','due'].includes(key)),'Campo não permitido.');
      const due=dueInput(value.due);const memberRef=collection(db,'profiles').doc(due.memberId);const ref=collection(db,'dues').doc();
      await db.runTransaction(async tx=>{
        const lock=collection(db,'locks').doc('finance-dues');await tx.get(lock);
        const member=await tx.get(memberRef);assert(member.exists&&member.data().kind==='member'&&member.data().active===true,'Selecione um sócio ativo.',404);
        const duplicate=await tx.get(collection(db,'dues').where('memberId','==',due.memberId).where('period','==',due.period).limit(501));assert(duplicate.size<=500,'Histórico extenso; contacte o suporte.',409);assert(duplicate.docs.every(item=>(item.data().periodType||'yearly')!==due.periodType),'Já existe uma quota para este sócio e período.',409);
        const now=new Date().toISOString();tx.set(lock,{updatedAt:now});tx.set(ref,{...due,version:1,createdAt:now,updatedAt:now,createdBy:account.uid});audit(tx,db,account,'create-due',ref.id);
      });return json({saved:true,id:ref.id},201);
    }
    if(value.action==='update-due') {
      assert(Object.keys(value).every(key=>['action','id','version','due'].includes(key)),'Campo não permitido.');
      const due=dueInput(value.due),ref=collection(db,'dues').doc(movementId(value.id));
      await db.runTransaction(async tx=>{const lock=collection(db,'locks').doc('finance-dues');await tx.get(lock);const current=await tx.get(ref);assert(current.exists,'Quota não encontrada.',404);assert(current.data().version===value.version,'A quota foi alterada. Atualize a página e tente novamente.',409);assert(current.data().memberId===due.memberId,'Não é possível alterar o sócio associado à quota.',409);const payments=await tx.get(collection(db,'due_payments').where('dueId','==',ref.id).limit(501));assert(payments.size<=500,'Histórico extenso; contacte o suporte.',409);const received=rows(payments).reduce((sum,item)=>sum+item.amountCents,0);assert(received<=due.amountCents,'O valor da quota não pode ficar abaixo dos pagamentos já recebidos.',409);const dup=await tx.get(collection(db,'dues').where('memberId','==',due.memberId).where('period','==',due.period).limit(501));assert(dup.size<=500,'Histórico extenso; contacte o suporte.',409);assert(dup.docs.every(item=>item.id===ref.id||(item.data().periodType||'yearly')!==due.periodType),'Já existe uma quota para este sócio e período.',409);const now=new Date().toISOString();tx.update(ref,{...due,version:value.version+1,updatedAt:now,updatedBy:account.uid});audit(tx,db,account,'update-due',ref.id,{before:snapshot(current.data())});});return json({saved:true});
    }
    if(value.action==='delete-due') {
      assert(Object.keys(value).every(key=>['action','id','version'].includes(key)),'Campo não permitido.');const ref=collection(db,'dues').doc(movementId(value.id));
      await db.runTransaction(async tx=>{const lock=collection(db,'locks').doc('finance-dues');await tx.get(lock);const current=await tx.get(ref);assert(current.exists,'Quota não encontrada.',404);assert(current.data().version===value.version,'A quota foi alterada. Atualize a página e tente novamente.',409);const payments=await tx.get(collection(db,'due_payments').where('dueId','==',ref.id).limit(1));assert(payments.empty,'Apague primeiro os pagamentos associados a esta quota.',409);tx.delete(ref);tx.set(lock,{updatedAt:new Date().toISOString()},{merge:true});audit(tx,db,account,'delete-due',ref.id,{deleted:snapshot(current.data())});});return json({deleted:true});
    }
    if(value.action==='record-payment') {
      assert(Object.keys(value).every(key=>['action','payment'].includes(key)),'Campo não permitido.');
      const payment=paymentInput(value.payment);assert(payment.paidAt<=lisbonToday(),'A data do pagamento não pode ser futura.');
      const ref=collection(db,'due_payments').doc();const dueRef=collection(db,'dues').doc(payment.dueId);
      await db.runTransaction(async tx=>{
        const due=await tx.get(dueRef);assert(due.exists,'Quota não encontrada.',404);
        const history=await tx.get(collection(db,'due_payments').where('dueId','==',payment.dueId).limit(501));assert(history.size<=500,'Histórico extenso; contacte o suporte.',409);
        const received=rows(history).reduce((sum,record)=>sum+record.amountCents,0);assert(received+payment.amountCents<=due.data().amountCents,'O pagamento excede o valor ainda em aberto.',409);
        const now=new Date().toISOString();tx.set(ref,{...payment,version:1,createdAt:now,createdBy:account.uid});tx.update(dueRef,{updatedAt:now});audit(tx,db,account,'record-due-payment',ref.id);
      });return json({saved:true,id:ref.id},201);
    }
    if(value.action==='update-payment') {
      assert(Object.keys(value).every(key=>['action','id','version','payment'].includes(key)),'Campo não permitido.');const payment=paymentInput(value.payment);assert(payment.paidAt<=lisbonToday(),'A data do pagamento não pode ser futura.');const ref=collection(db,'due_payments').doc(movementId(value.id));
      await db.runTransaction(async tx=>{const current=await tx.get(ref);assert(current.exists,'Pagamento não encontrado.',404);assert(current.data().version===value.version,'O pagamento foi alterado. Atualize a página e tente novamente.',409);assert(current.data().dueId===payment.dueId,'Não é possível transferir o pagamento para outra quota.',409);const dueRef=collection(db,'dues').doc(payment.dueId);const due=await tx.get(dueRef);assert(due.exists,'Quota não encontrada.',404);const history=await tx.get(collection(db,'due_payments').where('dueId','==',payment.dueId).limit(501));assert(history.size<=500,'Histórico extenso; contacte o suporte.',409);const received=rows(history).reduce((sum,item)=>sum+(item.id===ref.id?0:item.amountCents),0);assert(received+payment.amountCents<=due.data().amountCents,'O pagamento excede o valor ainda em aberto.',409);const now=new Date().toISOString();tx.update(ref,{...payment,version:value.version+1,updatedAt:now,updatedBy:account.uid});tx.update(dueRef,{updatedAt:now});audit(tx,db,account,'update-due-payment',ref.id,{before:snapshot(current.data())});});return json({saved:true});
    }
    if(value.action==='delete-payment') {
      assert(Object.keys(value).every(key=>['action','id','version'].includes(key)),'Campo não permitido.');const ref=collection(db,'due_payments').doc(movementId(value.id));
      await db.runTransaction(async tx=>{const current=await tx.get(ref);assert(current.exists,'Pagamento não encontrado.',404);assert(current.data().version===value.version,'O pagamento foi alterado. Atualize a página e tente novamente.',409);const dueRef=collection(db,'dues').doc(current.data().dueId);const due=await tx.get(dueRef);tx.delete(ref);if(due.exists)tx.update(dueRef,{updatedAt:new Date().toISOString()});audit(tx,db,account,'delete-due-payment',ref.id,{deleted:snapshot(current.data())});});return json({deleted:true});
    }
    if(value.action==='record-donation') {
      assert(Object.keys(value).every(key=>['action','donation'].includes(key)),'Campo não permitido.');
      const donation=donationInput(value.donation);assert(donation.donatedAt<=lisbonToday(),'A data da doação não pode ser futura.');
      const ref=collection(db,'donations').doc();await db.runTransaction(async tx=>{const now=new Date().toISOString();tx.set(ref,{...donation,version:1,createdAt:now,createdBy:account.uid});audit(tx,db,account,'record-donation',ref.id);});return json({saved:true,id:ref.id},201);
    }
    if(value.action==='update-donation'||value.action==='delete-donation') {
      assert(Object.keys(value).every(key=>['action','id','version','donation'].includes(key)),'Campo não permitido.');const ref=collection(db,'donations').doc(movementId(value.id));
      await db.runTransaction(async tx=>{const current=await tx.get(ref);assert(current.exists,'Doação não encontrada.',404);assert(current.data().version===value.version,'A doação foi alterada. Atualize a página e tente novamente.',409);if(value.action==='delete-donation'){tx.delete(ref);audit(tx,db,account,'delete-donation',ref.id,{deleted:snapshot(current.data())});return;}const donation=donationInput(value.donation);assert(donation.donatedAt<=lisbonToday(),'A data da doação não pode ser futura.');tx.update(ref,{...donation,version:value.version+1,updatedAt:new Date().toISOString(),updatedBy:account.uid});audit(tx,db,account,'update-donation',ref.id,{before:snapshot(current.data())});});return json(value.action==='delete-donation'?{deleted:true}:{saved:true});
    }
    assert(false,'Operação financeira inválida.');
  } catch(error) { return failure(error); }
}
