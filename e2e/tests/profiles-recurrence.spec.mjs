import {test,expect} from '@playwright/test';

const pwd='Synthetic-Only-E2E-Password-2026';
async function token(request,role='admin'){
  const result=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
    data:{email:'qa-'+role+'@example.invalid',password:pwd,returnSecureToken:true}
  });
  expect(result.status()).toBe(200);
  return (await result.json()).idToken;
}
const headers=token=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
const write=(request,token,body)=>request.post('/api/platform',{headers:headers(token),data:body});

test('FR-003 FR-004: guardian/child relationship, tutor fields, revocation and least privilege',async ({request})=>{
 const admin=await token(request),guardian=await token(request,'guardian'),student=await token(request,'student');
 const create=async(profile)=>{
  const response=await write(request,admin,{action:'save-profile',profile});
  expect(response.status(),await response.text()).toBe(200);
  return (await response.json()).id;
 };
 const guardianId=await create({kind:'guardian',name:'Responsável de teste B',active:true,email:'guardian-b@example.invalid'});
 const newStudent={kind:'student',name:'Aluno de teste B',active:true,schoolYear:'7.º ano',ageBand:'12-14',guardianIds:[guardianId]};
 const studentId=await create(newStudent);
 const tutorId=await create({kind:'tutor',name:'Explicador de teste B',active:true,subjects:'Matemática',availability:'Segunda, 10–12'});
 const adminRead=await request.get('/api/platform',{headers:{Authorization:'Bearer '+admin}});
 expect(adminRead.status()).toBe(200);
 const profiles=(await adminRead.json()).profiles;
 expect(profiles.find(p=>p.id===studentId).guardianIds).toEqual([guardianId]);
 expect(profiles.find(p=>p.id===tutorId).subjects).toBe('Matemática');
 expect(profiles.find(p=>p.id===tutorId).availability).toContain('Segunda');
 const outsider=await request.get('/api/platform',{headers:{Authorization:'Bearer '+guardian}});
 expect((await outsider.json()).profiles.some(p=>p.id===studentId)).toBe(false);
 const otherStudent=await request.get('/api/platform',{headers:{Authorization:'Bearer '+student}});
 expect((await otherStudent.json()).profiles.some(p=>p.id===studentId)).toBe(false);
 const forbidden=await write(request,guardian,{action:'save-profile',profile:{...newStudent,id:studentId,guardianIds:['e2e-profile-guardian']}});
 expect(forbidden.status()).toBe(403);
 const invalidRelation=await write(request,admin,{action:'save-profile',profile:{...newStudent,id:studentId,guardianIds:['e2e-profile-tutor']}});
 expect([400,404]).toContain(invalidRelation.status());
 const revoke=await write(request,admin,{action:'save-profile',profile:{...newStudent,id:studentId,guardianIds:[]}});
 expect(revoke.status()).toBe(200);
 const confirm=await request.get('/api/platform',{headers:{Authorization:'Bearer '+admin}});
 expect((await confirm.json()).profiles.find(p=>p.id===studentId).guardianIds).toEqual([]);
 const invalidKind=await write(request,admin,{action:'save-profile',profile:{...newStudent,id:studentId,kind:'guardian',guardianIds:[]}});
 expect(invalidKind.status()).toBe(400);
});

test('FR-012: member state transition keeps associational history and enforces access',async ({request})=>{
 const admin=await token(request),member=await token(request,'member');
 const base={kind:'member',name:'Sócio de teste novo',active:true,memberNumber:'E2E-2026',membershipStatus:'pending'};
 const created=await write(request,admin,{action:'save-profile',profile:base});
 expect(created.status()).toBe(200);
 const id=(await created.json()).id;
 for(const state of ['active','suspended','left']){
  const changed=await write(request,admin,{action:'save-profile',profile:{...base,id,membershipStatus:state}});
  expect(changed.status(),await changed.text()).toBe(200);
 }
 const current=await request.get('/api/platform',{headers:{Authorization:'Bearer '+admin}});
 const memberRecord=(await current.json()).profiles.find(profile=>profile.id===id);
 expect(memberRecord.membershipStatus).toBe('left');
 expect(memberRecord.membershipHistory.map(h=>h.status)).toEqual(['pending','active','suspended','left']);
 const outsider=await request.get('/api/platform',{headers:{Authorization:'Bearer '+member}});
 expect((await outsider.json()).profiles.some(x=>x.id===id)).toBe(false);
 const denial=await write(request,member,{action:'save-profile',profile:{...base,id,membershipStatus:'active'}});
 expect(denial.status()).toBe(403);
});

test('FR-005 FR-006: recurring schedule is atomic, rejects duplicates and handles DST',async ({request})=>{
 const admin=await token(request);
 const session={title:'Recorrência E2E DST',studentIds:['e2e-profile-student'],tutorId:'e2e-profile-tutor',startsAt:'2027-03-22T10:00:00Z',endsAt:'2027-03-22T11:00:00Z',room:'Sala DST E2E'};
 const recurrence={period:'month',weekdays:[1]}; // Monday, crosses Europe/Lisbon spring transition.
 const first=await write(request,admin,{action:'create-session-series',session,recurrence});
 expect(first.status(),await first.text()).toBe(200);
 const saved=await first.json();
 expect(saved.ids.length).toBeGreaterThanOrEqual(4);
 const read=await request.get('/api/platform',{headers:{Authorization:'Bearer '+admin}});
 const result=(await read.json()).sessions.filter(s=>s.seriesId===saved.seriesId);
 expect(result).toHaveLength(saved.ids.length);
 expect(new Set(result.map(s=>s.startsAt))).toHaveProperty('size',saved.ids.length);
 const offsets=result.map(s=>new Date(s.startsAt).getUTCHours());
 expect(offsets).toContain(10);
 expect(offsets).toContain(9);
 const collision=await write(request,admin,{action:'create-session-series',session,recurrence});
 expect(collision.status()).toBe(409);
 const readAfter=await request.get('/api/platform',{headers:{Authorization:'Bearer '+admin}});
 expect((await readAfter.json()).sessions.filter(s=>s.seriesId===saved.seriesId)).toHaveLength(saved.ids.length);
 const invalid=await write(request,admin,{action:'create-session-series',session,recurrence:{period:'forever',weekdays:[1]}});
 expect(invalid.status()).toBe(400);
});
