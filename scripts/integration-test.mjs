import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {spawn} from 'node:child_process';
import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore} from 'firebase-admin/firestore';
import {defaultAccessProfiles} from '../lib/platform/access.mjs';
for(const key of ['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST']) assert.match(process.env[key] || '',/^(127\.0\.0\.1|localhost):\d+$/,'Integration tests require local Firebase emulators; cloud access is forbidden.');
const projectId='baticamigo-c0384', host='http://127.0.0.1:3101';
const app=initializeApp({projectId},'integration-fixtures'), db=getFirestore(app), auth=getAuth(app);
const {privateKey}=generateKeyPairSync('rsa',{modulusLength:2048,privateKeyEncoding:{type:'pkcs8',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
// Ephemeral synthetic key: never persisted, never used outside local emulators.
const credential={project_id:projectId,client_email:'test-only@baticamigo-c0384.iam.gserviceaccount.com',private_key:privateKey};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3101'],{env:{...process.env,FIREBASE_SERVICE_ACCOUNT_JSON:JSON.stringify(credential)},stdio:['ignore','pipe','pipe']});
let serverLog='';for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog=(serverLog+chunk.toString()).slice(-12000);});
const tokens={};
const fixtures=[['admin','admin',[]],['student','student',['s1']],['otherStudent','student',['s2']],['guardian','guardian',['g1']],['otherGuardian','guardian',['g2']],['tutor','tutor',['t1']],['otherTutor','tutor',['t2']],['member','member',['m1']]];
async function request(who,body,path='/api/platform') {const response=await fetch(host+path,{method:body?'POST':'GET',headers:{...(who ? {Authorization:'Bearer '+tokens[who]} : {}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,body:await response.json()};}
async function expect(who,body,status=200,path='/api/platform') {const result=await request(who,body,path);assert.equal(result.status,status,result.body.error);return result.body;}
try {
  for(let attempt=0;attempt<120;attempt++){try{const response=await fetch(host+'/api/platform');if(response.status===401)break;}catch{}if(attempt===119)throw new Error('Local server did not start.');await new Promise(resolve=>setTimeout(resolve,500));}
  for(const [name,role,profileIds] of fixtures){const email=name.toLowerCase()+'@example.invalid';await auth.createUser({uid:name,email,password:'Synthetic-fixture-password-42',emailVerified:true});await db.collection('platform_accounts').doc(name).set({roles:[role],role,profileIds,active:true});const response=await fetch('http://'+process.env.FIREBASE_AUTH_EMULATOR_HOST+'/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-only',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Synthetic-fixture-password-42',returnSecureToken:true})});const result=await response.json();assert.ok(result.idToken,'Emulated sign-in failed.');tokens[name]=result.idToken;}
  for(const [id,kind,name,guardians] of [['s1','student','Aluno de teste A',['g1']],['s2','student','Aluno de teste B',['g2']],['s3','student','Aluno de teste C',['g3']],['g1','guardian','Encarregado de teste A',[]],['g2','guardian','Encarregado de teste B',[]],['g3','guardian','Encarregado de teste C',[]],['t1','tutor','Explicador de teste A',[]],['t2','tutor','Explicador de teste B',[]],['m1','member','Sócio de teste',[]]])await db.collection('platform_profiles').doc(id).set({kind,name,guardianIds:guardians,active:true});
  await db.collection('platform_access_settings').doc('profiles').set({profiles:{...defaultAccessProfiles,member:['overview','finance','document']}});
  const unauthorized=await fetch(host+'/api/platform');
  assert.equal(unauthorized.status,401);
  assert.match(unauthorized.headers.get('content-type')||'',/application\/problem\+json/);
  const unauthorizedProblem=await unauthorized.json();
  assert.equal(unauthorizedProblem.status,401);
  assert.equal(unauthorizedProblem.type,'about:blank');
  assert.equal(unauthorizedProblem.error,unauthorizedProblem.detail);
  console.log('PASS: RFC 9457 unauthorized problem response.');
  await expect(null,null,401);
  const contactEmail='synthetic-contact@example.invalid';
  const contactResponse=await fetch(host+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Contacto sintético',email:contactEmail,subject:'Teste de integração',message:'Mensagem sintética sem dados reais.',website:''})});
  assert.equal(contactResponse.status,201);
  assert.equal((await contactResponse.json()).accepted,true);
  const storedContact=await db.collection('contato').where('email','==',contactEmail).get();
  assert.equal(storedContact.size,1,'Valid server-mediated contact must be persisted.');
  const honeypotResponse=await fetch(host+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Bot',email:'bot@example.invalid',subject:'Spam',message:'Spam',website:'https://spam.invalid'})});
  assert.equal(honeypotResponse.status,202);
  assert.equal((await db.collection('contato').where('email','==','bot@example.invalid').get()).size,0,'Honeypot submissions must not be persisted.');
  console.log('PASS: server-mediated public contact form and honeypot.');
  const start=new Date(Date.now()-86400000).toISOString(),end=new Date(Date.now()-82800000).toISOString();
  const session={title:'Sessão de teste',studentIds:['s1','s2'],tutorId:'t1',room:'Teste A',startsAt:start,endsAt:end};
  const created=await expect('admin',{action:'create-session',session});
  await expect('admin',{action:'set-attendance',sessionId:created.id,studentId:'s1',status:'present',version:0});
  await expect('admin',{action:'set-attendance',sessionId:created.id,studentId:'s2',status:'absent',version:0});
  await expect('admin',{action:'create-session',session},409);
  const otherSession=await expect('admin',{action:'create-session',session:{...session,studentIds:['s3'],tutorId:'t2',room:'Teste B'}});
  await expect('admin',{action:'set-attendance',sessionId:otherSession.id,studentId:'s3',status:'present',version:0});
  for(const [name,ownStudent,otherStudent] of [['student','s1','s2'],['guardian','s1','s2'],['otherStudent','s2','s1'],['otherGuardian','s2','s1']]){
    const result=await expect(name);
    assert.ok(result.profiles.some(p=>p.id===ownStudent));
    assert.equal(result.profiles.some(p=>p.id===otherStudent),false);
    assert.equal(result.sessions.length,2,'The calendar remains visible to every account.');
    const personalSession=result.sessions.find(item=>item.id===created.id);
    const otherVisibleSession=result.sessions.find(item=>item.id===otherSession.id);
    assert.ok(personalSession);
    assert.deepEqual(personalSession.studentIds,[ownStudent]);
    assert.ok(otherVisibleSession);
    assert.deepEqual(otherVisibleSession.studentIds,[],'Calendar metadata must not disclose another pupil in the session.');
    assert.equal('tutorId' in otherVisibleSession,false,'Calendar metadata must not disclose an unrelated tutor identity.');
    assert.ok(result.attendance.some(record=>record.studentId===ownStudent));
    assert.equal(result.attendance.some(record=>record.studentId===otherStudent),false,'Attendance for another pupil must not be disclosed.');
    assert.equal(result.attendance.some(record=>record.studentId==='s3'),false,'Attendance from a session with no verified relationship must not be disclosed.');
    assert.equal(result.attendance.some(record=>record.sessionId===otherSession.id),false,'Attendance from another session must not be disclosed.');
    assert.equal(result.attendance.find(record=>record.studentId===ownStudent)?.status,ownStudent==='s1'?'present':'absent','The authorized attendance status must be preserved.');
    assert.equal(result.profiles.find(p=>p.id==='t1')?.name,'Explicador de teste A');
    assert.equal(result.profiles.some(profile=>profile.id==='t2'),false,'Profiles without a relationship must not receive unrelated tutor details.');
  }
  const tutorView=await expect('tutor');
  assert.deepEqual(new Set(tutorView.attendance.map(record=>record.studentId)),new Set(['s1','s2']));
  assert.equal(tutorView.attendance.some(record=>record.sessionId===otherSession.id),false,'Tutors must not receive attendance from sessions assigned to another tutor.');
  assert.equal(tutorView.profiles.some(profile=>profile.id==='t2'),false,'A tutor must not receive another tutor profile through the shared calendar.');
  const otherTutorView=await expect('otherTutor');
  assert.deepEqual(new Set(otherTutorView.attendance.map(record=>record.studentId)),new Set(['s3']));
  assert.equal(otherTutorView.attendance.some(record=>['s1','s2'].includes(record.studentId)),false,'A tutor must not receive attendance from another tutor’s session.');
  assert.equal(otherTutorView.profiles.some(profile=>profile.id==='t1'),false,'A tutor must not receive another tutor profile through the shared calendar.');
  const memberView=await expect('member');
  assert.deepEqual(memberView.account.modules,['overview','sessions','finance','document'],'Customized profile menus are loaded, the shared calendar remains available, and unassigned menus are removed.');
  assert.equal(memberView.sessions.length,2,'Profiles without the learning modules still receive the shared calendar.');
  assert.ok(memberView.sessions.every(item=>item.studentIds.length===0),'Calendar sessions must not disclose attendee identities to unrelated profiles.');
  assert.ok(memberView.sessions.every(item=>!('tutorId' in item)),'Calendar sessions must not disclose unrelated tutor identities.');
  assert.equal(memberView.profiles.some(profile=>['t1','t2'].includes(profile.id)),false,'Unrelated tutor profiles must not be disclosed through the shared calendar.');
  assert.deepEqual(memberView.attendance,[],'Profiles without a verified relationship receive no attendance records.');
  const adminView=await expect('admin');
  assert.deepEqual(new Set(adminView.attendance.map(record=>record.studentId)),new Set(['s1','s2','s3']),'Administrators retain authorized visibility to all attendance.');
  console.log('PASS: authenticated reads and family/tutor isolation.');
  const assessment={kind:'assessment',studentId:'s1',title:'Avaliação de teste',subject:'Português',period:'Mensal',origin:'Teste sintético',score:14,scaleMin:0,scaleMax:20};
  for(const name of ['student','guardian','otherTutor','member'])await expect(name,{action:'save-record',record:assessment},403);
  const saved=await expect('tutor',{action:'save-record',record:assessment});
  assert.equal((await expect('guardian')).records.length,1,'Guardians must retain authorized access to their pupil’s assessment after profile data is redacted from the API response.');assert.equal((await expect('otherGuardian')).records.length,0);
  await expect('tutor',{action:'save-record',record:{...assessment,id:saved.id,version:1,score:15}});
  await expect('tutor',{action:'save-record',record:{...assessment,id:saved.id,version:1,score:16}},409);
  await expect('tutor',{action:'save-record',record:{...assessment,score:22}},400);
  console.log('PASS: record permissions, scale validation and optimistic concurrency.');
  const presence={action:'set-attendance',sessionId:created.id,studentId:'s1',status:'present',version:1};
  await expect('student',presence,403);await expect('otherTutor',presence,403);await expect('tutor',presence);await expect('tutor',presence,409);
  await expect('guardian',{action:'save-record',record:{kind:'justification',studentId:'s1',title:'Motivo de teste',content:'Texto sintético',sessionId:created.id}});
  await expect('otherGuardian',{action:'save-record',record:{kind:'justification',studentId:'s1',title:'Motivo de teste',content:'Texto sintético',sessionId:created.id}},403);
  console.log('PASS: attendance and guardian justification permissions.');
  await expect('admin',{action:'save-record',record:{kind:'document',studentId:'m1',title:'Documento de teste',content:'Conteúdo sintético'}});
  assert.equal((await expect('member')).records.length,1);assert.equal((await expect('student')).records.some(r=>r.studentId==='m1'),false);
  await expect('student',{action:'save-record',record:{kind:'message',studentId:'s1',title:'Mensagem de teste',content:'Mensagem sintética'}});
  assert.ok((await expect('tutor')).records.some(r=>r.kind==='message'));
  await expect('student',{action:'create-person-records'},403,'/api/platform/users');
  await expect('admin',{action:'save-profile',profile:{kind:'member',name:'Novo sócio sintético',active:true,memberNumber:'TEST',membershipStatus:'pending'}});
  assert.ok((await db.collection('platform_audit').get()).size>=8);
  console.log('PASS: member documents, messaging, account privilege protection and audit writes.');
  await db.collection('platform_accounts').doc('student').update({active:false});await expect('student',null,403);
  for(const path of ['/','/area','/admin/dashboard']){const response=await fetch(host+path);assert.equal(response.status,200);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(await response.text(),/Saltar para o conteúdo/);}
  console.log('PASS: inactive account rejection and shared HTTP/accessibility baseline.');
  const direct=await fetch('http://'+process.env.FIRESTORE_EMULATOR_HOST+'/v1/projects/'+projectId+'/databases/(default)/documents/platform_profiles/s1',{headers:{Authorization:'Bearer '+tokens.guardian}});
  assert.equal(direct.status,403,'Direct client access must be denied by emulator fixture rules.');
  console.log('PASS: direct client access denied by local fixture rules.');
  console.log('Integration tests completed against local emulators only.');
} catch(error) {console.error('Integration test failed:',error.message);process.exitCode=1;} finally {
  try { const contacts=await db.collection('contato').where('email','in',['synthetic-contact@example.invalid','bot@example.invalid']).get();await Promise.all(contacts.docs.map(item=>item.ref.delete())); } catch {}
  server.kill('SIGTERM');await app.delete();
}
