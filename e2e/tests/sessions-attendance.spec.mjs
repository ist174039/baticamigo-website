import {test,expect} from '@playwright/test';

const password='Synthetic-Only-E2E-Password-2026';
async function auth(request,role){
 const response=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=e2e-only',{
   data:{email:'qa-'+role+'@example.invalid',password,returnSecureToken:true}
 });
 expect(response.status()).toBe(200);
 return (await response.json()).idToken;
}
const headers=token=>({Authorization:'Bearer '+token,'Content-Type':'application/json'});
const post=(request,token,data)=>request.post('/api/platform',{headers:headers(token),data});
const sessionInput={
 title:'Sessão de controlo E2E',studentIds:['e2e-profile-student'],tutorId:'e2e-profile-tutor',
 startsAt:'2026-09-14T10:00:00Z',endsAt:'2026-09-14T11:00:00Z',room:'Sala E2E'
};
test('session lifecycle: CRUD, conflict prevention, attendance, optimistic concurrency and privacy',async ({request})=>{
 const admin=await auth(request,'admin'),member=await auth(request,'member'),tutor=await auth(request,'tutor'),student=await auth(request,'student'),guardian=await auth(request,'guardian');
 const created=await post(request,admin,{action:'create-session',session:sessionInput});
 expect(created.status(),await created.text()).toBe(200);
 const id=(await created.json()).id;
 const collision=await post(request,admin,{action:'create-session',session:{...sessionInput,title:'Conflito de sessão'}});
 expect(collision.status()).toBe(409);
 const memberMutation=await post(request,member,{action:'update-session',id,version:1,status:'scheduled',session:sessionInput});
 expect(memberMutation.status()).toBe(403);
 const tutorView=await request.get('/api/platform',{headers:{Authorization:'Bearer '+tutor}});
 expect(tutorView.status()).toBe(200);
 const tutorSession=(await tutorView.json()).sessions.find(s=>s.id===id);
 expect(tutorSession.studentIds).toContain('e2e-profile-student');
 const studentView=await request.get('/api/platform',{headers:{Authorization:'Bearer '+student}});
 expect((await studentView.json()).sessions.find(s=>s.id===id).studentIds).toContain('e2e-profile-student');
 const guardianView=await request.get('/api/platform',{headers:{Authorization:'Bearer '+guardian}});
 expect((await guardianView.json()).sessions.find(s=>s.id===id).studentIds).toContain('e2e-profile-student');
 const memberView=await request.get('/api/platform',{headers:{Authorization:'Bearer '+member}});
 expect((await memberView.json()).sessions.find(s=>s.id===id).studentIds).toEqual([]);
 const attendance=await post(request,tutor,{action:'set-attendance',sessionId:id,studentId:'e2e-profile-student',status:'present',version:0});
 expect(attendance.status(),await attendance.text()).toBe(200);
 const duplicated=await post(request,tutor,{action:'set-attendance',sessionId:id,studentId:'e2e-profile-student',status:'absent',version:0});
 expect(duplicated.status()).toBe(409);
 const memberAttendance=await post(request,member,{action:'set-attendance',sessionId:id,studentId:'e2e-profile-student',status:'absent',version:1});
 expect(memberAttendance.status()).toBe(403);
 const attendanceRead=await request.get('/api/platform',{headers:{Authorization:'Bearer '+guardian}});
 const own=(await attendanceRead.json()).attendance.filter(a=>a.sessionId===id);
 expect(own).toHaveLength(1);
 expect(own[0].status).toBe('present');
 const cancelled=await post(request,admin,{action:'update-session',id,version:1,status:'cancelled',session:sessionInput});
 expect(cancelled.status(),await cancelled.text()).toBe(200);
 const stale=await post(request,admin,{action:'update-session',id,version:1,status:'scheduled',session:sessionInput});
 expect(stale.status()).toBe(409);
});
