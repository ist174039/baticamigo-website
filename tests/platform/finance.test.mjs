import test from 'node:test';
import assert from 'node:assert/strict';
import {dueInput,paymentInput,donationInput,dueStatus} from '../../lib/platform/finance.mjs';

test('membership quota supports monthly, annual and custom periods',()=>{
  const due=dueInput({memberId:'member-1',periodType:'yearly',period:'2026',amount:25,dueAt:'2026-12-31',notes:''});
  assert.equal(due.amountCents,2500);
  assert.equal(dueInput({memberId:'member-1',periodType:'monthly',period:'2026-01',amount:25,dueAt:'2026-01-31'}).period,'2026-01');
  assert.equal(dueInput({memberId:'member-1',periodType:'custom',period:'1.º semestre 2026',amount:25,dueAt:'2026-06-30'}).periodType,'custom');
  assert.throws(()=>dueInput({memberId:'member-1',periodType:'monthly',period:'2026-13',amount:25,dueAt:'2026-12-31'}));
  assert.throws(()=>dueInput({memberId:'member-1',periodType:'yearly',period:'26',amount:25,dueAt:'2026-12-31'}));
  assert.throws(()=>dueInput({memberId:'member-1',periodType:'yearly',period:'2026',amount:0,dueAt:'2026-12-31'}));
  assert.throws(()=>dueInput({memberId:'member-1',periodType:'yearly',period:'2026',amount:25,dueAt:'2026-02-30'}));
});

test('payment record validates method, amount, and calendar date',()=>{
  assert.equal(paymentInput({dueId:'due-1',amount:10,paidAt:'2026-10-20',method:'mbway'}).amountCents,1000);
  assert.throws(()=>paymentInput({dueId:'due-1',amount:-1,paidAt:'2026-10-20',method:'cash'}));
  assert.throws(()=>paymentInput({dueId:'due-1',amount:1,paidAt:'2026-02-30',method:'cash'}));
  assert.throws(()=>paymentInput({dueId:'due-1',amount:1,paidAt:'2026-10-20',method:'crypto'}));
  assert.throws(()=>paymentInput({dueId:'due-1',amount:1,paidAt:'2026-10-20',method:'cash',createdBy:'attacker'}));
});

test('donations record received money separately and support anonymous donors',()=>{
  const donation=donationInput({amount:15.5,donatedAt:'2026-10-20',donorName:'Pessoa',anonymous:true,method:'transfer'});
  assert.equal(donation.amountCents,1550);
  assert.equal(donation.donorName,'');
  assert.equal(donation.anonymous,true);
  assert.throws(()=>donationInput({amount:10,donatedAt:'2026-10-20',anonymous:false,method:'cash',status:'promised'}));
});

test('quota balance distinguishes pending, partial, paid, and overdue without counting owed money as received',()=>{
  const due={id:'due-1',amountCents:2500,dueAt:'2026-01-01'};
  const payment={dueId:'due-1',amountCents:1000};
  assert.deepEqual(dueStatus(due,[], '2026-10-20'),{paidCents:0,remainingCents:2500,status:'overdue'});
  assert.deepEqual(dueStatus(due,[payment], '2026-10-20'),{paidCents:1000,remainingCents:1500,status:'partial'});
  assert.equal(dueStatus(due,[{...payment,amountCents:2500}], '2026-10-20').status,'paid');
  assert.equal(dueStatus({...due,dueAt:'2026-12-31'},[], '2026-10-20').status,'pending');
});
