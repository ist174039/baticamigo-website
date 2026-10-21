import test from 'node:test';
import assert from 'node:assert/strict';
import {moduleInput,canReadRecord,canWriteRecord,progressSummary} from '../../lib/platform/modules.mjs';
import {profileInput} from '../../lib/platform/domain.mjs';
import {escapeHtml,safeMediaUrl} from '../../public/shared/safe-content.mjs';
const student={id:'s1',kind:'student',guardianIds:['g1']};
const sessions=[{id:'lesson1',tutorId:'t1',studentIds:['s1'],status:'scheduled',startsAt:'2026-01-01T10:00:00.000Z',endsAt:'2026-01-01T11:00:00.000Z'}];
const account=(role,ids=[])=>({uid:role,roles:[role],profileIds:ids});
const record={kind:'assignment',studentId:'s1'};
test('only the student, associated family, assigned tutor and management can read pupil records',()=>{
  for(const a of [account('student',['s1']),account('guardian',['g1']),account('tutor',['t1']),account('admin')]) assert.ok(canReadRecord(a,record,student,sessions));
  for(const a of [account('student',['s2']),account('guardian',['g2']),account('tutor',['t2']),account('member',['m1'])]) assert.equal(canReadRecord(a,record,student,sessions),false);
});
test('students and guardians cannot write assessments or materials; tutors cannot write unrelated pupils',()=>{
  for(const a of [account('student',['s1']),account('guardian',['g1']),account('tutor',['t2'])]) assert.equal(canWriteRecord(a,record,student,sessions),false);
  assert.ok(canWriteRecord(account('tutor',['t1']),record,student,sessions));
});
test('associated families may communicate, but only guardians may justify an absence',()=>{
  assert.ok(canWriteRecord(account('student',['s1']),{...record,kind:'message'},student,sessions));
  assert.ok(canWriteRecord(account('guardian',['g1']),{...record,kind:'justification'},student,sessions));
  assert.equal(canWriteRecord(account('student',['s1']),{...record,kind:'justification'},student,sessions),false);
});
test('members can read only their own communications and documents',()=>{
  const member={id:'m1',kind:'member'};
  assert.ok(canReadRecord(account('member',['m1']),{kind:'document'},member,[]));
  assert.equal(canReadRecord(account('member',['m2']),{kind:'document'},member,[]),false);
  assert.equal(canReadRecord(account('member',['m1']),{kind:'assessment'},member,[]),false);
});
test('records reject extra fields, unsafe links and invalid scales',()=>{
  const base={kind:'assessment',studentId:'s1',title:'Teste',subject:'Português',period:'Mensal',origin:'Teste escolar',score:14,scaleMin:0,scaleMax:20};
  assert.equal(moduleInput(base).score,14);
  assert.throws(()=>moduleInput({...base,score:21}));
  assert.throws(()=>moduleInput({...base,scaleMin:20}));
  assert.throws(()=>moduleInput({...base,authorUid:'admin'}));
  assert.throws(()=>moduleInput({...base,url:'javascript:alert(1)'}));
  assert.throws(()=>moduleInput({...base,url:'https://user:pass@example.com'}));
  assert.throws(()=>moduleInput({...base,dueAt:'2026-02-30'}));
});
test('qualitative evidence stays qualitative; comparisons require matching scales and source',()=>{
  const base={kind:'assessment',studentId:'s1',subject:'Matemática',scaleMin:0,scaleMax:20,origin:'Teste'};
  const records=[{...base,id:'r1',createdAt:'2026-01-01',score:10},{...base,id:'r2',createdAt:'2026-02-01',score:15}, {...base,id:'r3',subject:'Música',createdAt:'2026-02-02',score:null,scaleMin:null,scaleMax:null}];
  const summary=progressSummary(student,records,[],sessions);
  assert.equal(summary.subjects[0].change,5);assert.equal(summary.subjects[1].change,null);assert.equal(summary.missing,1);
  assert.deepEqual(summary.subjects[0].evidenceIds,['r1','r2']);
  const mixed=progressSummary(student,[records[0],{...records[1],scaleMax:100}],[],sessions);
  assert.equal(mixed.subjects[0].change,null);
});
test('member profiles preserve nonfinancial details and reject invalid states',()=>{
  assert.equal(profileInput({kind:'member',name:'Sócio teste',active:true,memberNumber:'42',membershipStatus:'pending'}).membershipStatus,'pending');
  assert.throws(()=>profileInput({kind:'member',name:'Teste',membershipStatus:'paid'}));
});
test('admin rendering escapes stored text and attributes and disallows executable media URLs',()=>{
  assert.equal(escapeHtml('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
  assert.equal(safeMediaUrl('javascript:alert(1)'), '');
  assert.equal(safeMediaUrl('data:text/html;base64,AAAA'), '');
  assert.equal(safeMediaUrl('https://example.org/a" onerror="x'), 'https://example.org/a%22%20onerror=%22x');
});

test('assessment chronology uses the pedagogical date rather than entry order',()=>{
  const base={kind:'assessment',studentId:'s1',subject:'Português',origin:'Teste',scaleMin:0,scaleMax:20};
  const records=[{...base,id:'old',assessedOn:'2026-01-01',createdAt:'2026-03-01',score:10},{...base,id:'new',assessedOn:'2026-02-01',createdAt:'2026-02-02',score:14}];
  const summary=progressSummary(student,records,[],[]);assert.equal(summary.subjects[0].latest.id,'new');assert.equal(summary.subjects[0].change,4);
  assert.throws(()=>moduleInput({...base,title:'Teste',period:'Mensal',score:10,assessedOn:'2026-99-99'}));
});
