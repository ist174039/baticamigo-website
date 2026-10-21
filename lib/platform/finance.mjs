import {assert,id} from './domain.mjs';

const shape=(value,keys)=>{assert(value&&typeof value==='object'&&!Array.isArray(value));assert(Object.keys(value).every(key=>keys.includes(key)),'Campo não permitido.');};
const text=(value,max,label,required=false)=>{assert(typeof value==='string'&&value.length<=max&&(!required||value.trim()),`${label} inválido.`);return value.trim();};
const cents=value=>{assert(typeof value==='number'&&Number.isFinite(value)&&value>0&&value<=10000000,'Indique um valor positivo até 100 000 €.');const result=Math.round(value*100);assert(result>0);return result;};
export const lisbonToday=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Lisbon'});
export function dueInput(value) {
  shape(value,['memberId','periodType','period','amount','dueAt','notes']);
  const periodType=value.periodType||'yearly';
  assert(['monthly','yearly','custom'].includes(periodType),'Frequência da quota inválida.');
  const result={memberId:id(value.memberId),periodType,period:text(value.period,40,'Período',true),amountCents:cents(value.amount),dueAt:text(value.dueAt,10,'Data limite',true),notes:text(value.notes||'',1000,'Observações')};
  assert(periodType==='monthly'?/^20\d{2}-(0[1-9]|1[0-2])$/.test(result.period):periodType==='yearly'?/^20\d{2}$/.test(result.period):/^[\p{L}\p{N}][\p{L}\p{N} ._/-]{0,39}$/u.test(result.period),'Período inválido.');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(result.dueAt)&&Number.isFinite(Date.parse(`${result.dueAt}T00:00:00Z`))&&new Date(`${result.dueAt}T00:00:00Z`).toISOString().slice(0,10)===result.dueAt,'Data limite inválida.');
  return result;
}
export function movementId(value) { return id(value); }
export function paymentInput(value) {
  shape(value,['dueId','amount','paidAt','method','reference','notes']);
  const result={dueId:id(value.dueId),amountCents:cents(value.amount),paidAt:text(value.paidAt,10,'Data de pagamento',true),method:text(value.method,30,'Método',true),reference:text(value.reference||'',120,'Referência'),notes:text(value.notes||'',1000,'Observações')};
  assert(/^\d{4}-\d{2}-\d{2}$/.test(result.paidAt)&&Number.isFinite(Date.parse(`${result.paidAt}T00:00:00Z`))&&new Date(`${result.paidAt}T00:00:00Z`).toISOString().slice(0,10)===result.paidAt,'Data de pagamento inválida.');
  assert(['cash','transfer','mbway','other'].includes(result.method),'Método de pagamento inválido.');
  return result;
}
export function donationInput(value) {
  shape(value,['amount','donatedAt','donorName','anonymous','method','reference','purpose','notes']);
  const result={amountCents:cents(value.amount),donatedAt:text(value.donatedAt,10,'Data da doação',true),donorName:text(value.donorName||'',120,'Nome do doador'),anonymous:value.anonymous===true,method:text(value.method,30,'Método',true),reference:text(value.reference||'',120,'Referência'),purpose:text(value.purpose||'',160,'Finalidade'),notes:text(value.notes||'',1000,'Observações')};
  assert(/^\d{4}-\d{2}-\d{2}$/.test(result.donatedAt)&&Number.isFinite(Date.parse(`${result.donatedAt}T00:00:00Z`))&&new Date(`${result.donatedAt}T00:00:00Z`).toISOString().slice(0,10)===result.donatedAt,'Data da doação inválida.');
  assert(['cash','transfer','mbway','other'].includes(result.method),'Método de pagamento inválido.');
  if(result.anonymous) result.donorName='';
  return result;
}
function financialDate(value,label) {
  const date=text(value,10,label,true);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(`${date}T00:00:00Z`))&&new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)===date,`${label} inválida.`);
  return date;
}
export function financingInput(value) {
  shape(value,['amount','receivedAt','funder','purpose','method','reference','notes']);
  const result={amountCents:cents(value.amount),receivedAt:financialDate(value.receivedAt,'Data de recebimento'),funder:text(value.funder,160,'Entidade financiadora',true),purpose:text(value.purpose,180,'Finalidade',true),method:text(value.method,30,'Método',true),reference:text(value.reference||'',120,'Referência'),notes:text(value.notes||'',1000,'Observações')};
  assert(['cash','transfer','mbway','other'].includes(result.method),'Método de recebimento inválido.');
  return result;
}
export function expenseInput(value) {
  shape(value,['amount','paidAt','payee','category','purpose','method','reference','notes']);
  const result={amountCents:cents(value.amount),paidAt:financialDate(value.paidAt,'Data da despesa'),payee:text(value.payee,160,'Beneficiário',true),category:text(value.category,40,'Categoria',true),purpose:text(value.purpose,180,'Descrição',true),method:text(value.method,30,'Método',true),reference:text(value.reference||'',120,'Referência'),notes:text(value.notes||'',1000,'Observações')};
  assert(['operations','education','materials','events','transport','social-support','other'].includes(result.category),'Categoria de despesa inválida.');
  assert(['cash','transfer','mbway','other'].includes(result.method),'Método de pagamento inválido.');
  return result;
}
export function dueStatus(due,payments,today=lisbonToday()) {
  const paidCents=payments.filter(payment=>payment.dueId===due.id).reduce((sum,payment)=>sum+payment.amountCents,0);
  const remainingCents=Math.max(0,due.amountCents-paidCents);
  return {paidCents,remainingCents,status:remainingCents===0?'paid':paidCents>0?'partial':due.dueAt<today?'overdue':'pending'};
}
