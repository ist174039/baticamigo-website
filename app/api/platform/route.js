import {readModules,writeModule} from '../../../lib/platform/modules-server';
import {context,collection,audit,json,failure} from '../../../lib/platform/server';
import {assert,id,profileInput,sessionInput,manages,hasRole,profileIds,canReadStudent,canAttend,canAddUnplannedAttendee,overlaps,attendanceVersion} from '../../../lib/platform/domain.mjs';
import {canAccessArea,sharedCalendarMetadata,sessionsWithAuthorizedAttendees} from '../../../lib/platform/access.mjs';
import {expandLisbonSessionRecurrence} from '../../../lib/platform/time.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const rows=(snapshot)=>snapshot.docs.map(d=>({...d.data(),id:d.id}));
async function readJson(request) {
  const length=Number(request.headers.get('content-length') || 0); assert(length<=16384,'Pedido demasiado grande.',413);
  const reader=request.body?.getReader(); assert(reader,'Pedido vazio.'); const chunks=[]; let size=0;
  try { while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.byteLength; if(size>16384) { await reader.cancel(); assert(false,'Pedido demasiado grande.',413); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const body=new Uint8Array(size); let offset=0; for(const chunk of chunks) { body.set(chunk,offset); offset+=chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(body)); } catch { assert(false,'JSON inválido.'); }
}
async function bounded(query) { const result=await query.limit(501).get(); assert(result.size <= 500,'Demasiados registos. Contacte a coordenação para arquivar dados antigos.',409); return rows(result); }
async function readAttendance(db,sessions) {
  const results=[];
  // Firestore query groups contain at most ten sessions and run five at once.
  for(let offset=0;offset<sessions.length;offset+=50) {
    const groups=Array.from({length:Math.ceil(Math.min(50,sessions.length-offset)/10)},(_,index)=>sessions.slice(offset+index*10,Math.min(offset+(index+1)*10,sessions.length)));
    const snapshots=await Promise.all(groups.map(group=>collection(db,'attendance').where('sessionId','in',group.map(session=>session.id)).limit(501).get()));
    for(let index=0;index<snapshots.length;index++) {
      const snapshot=snapshots[index], byId=new Map(groups[index].map(session=>[session.id,session]));
      assert(snapshot.size<=500,'Demasiados registos de presenças. Contacte a coordenação.',409);
      results.push(...rows(snapshot).filter(record=>byId.get(record.sessionId)?.studentIds.includes(record.studentId)));
    }
  }
  return results;
}
export async function GET(request) {
  try {
    const {db,account,storage}=await context(request);
    let profiles=[],sessions=[];
    if(manages(account)) { [profiles,sessions]=await Promise.all([bounded(collection(db,'profiles')),bounded(collection(db,'sessions'))]); }
    else if(profileIds(account).length) {
      for(const linked of profileIds(account)) { const self=await collection(db,'profiles').doc(id(linked)).get(); if(self.exists) profiles.push({...self.data(),id:self.id}); }
      if(hasRole(account,'guardian')) for(const linked of profiles.filter(p=>p.kind==='guardian').map(p=>p.id)) profiles.push(...await bounded(collection(db,'profiles').where('guardianIds','array-contains',linked)));
      const studentIds=profiles.filter(p=>p.kind==='student' && canReadStudent(account,p)).map(p=>p.id);
      const found=[];
      if(hasRole(account,'tutor') || hasRole(account,'volunteer')) for(const linked of profiles.filter(p=>p.kind==='tutor').map(p=>p.id)) found.push(...await bounded(collection(db,'sessions').where('tutorId','==',linked)));
      for(const student of studentIds) found.push(...await bounded(collection(db,'sessions').where('studentIds','array-contains',student)));
      sessions=[...new Map(found.map(s=>[s.id,s])).values()];
      // Tutors see only the names of pupils in their assigned sessions.
      const assigned=[...new Set(sessions.filter(s=>canAttend(account,s)).flatMap(s=>s.studentIds))];
      for(const student of assigned) if(!profiles.some(p=>p.id===student)) { const p=await collection(db,'profiles').doc(id(student)).get(); if(p.exists) profiles.push({id:p.id,kind:'student',name:p.data().name,active:p.data().active}); }
      profiles=profiles.map(p=>{
        if(profileIds(account).includes(p.id)) return p;
        if(canReadStudent(account,p)) return hasRole(account,'guardian') && !manages(account) ? {id:p.id,kind:p.kind,name:p.name,active:p.active} : p;
        return {id:p.id,kind:p.kind,name:p.name,active:p.active};
      });
      sessions=sessions.map(s=>canAttend(account,s) ? s : {...s,studentIds:s.studentIds.filter(student=>studentIds.includes(student))});
    }
    const personalSessions=sessions;
    if(!manages(account)&&canAccessArea(account,'sessions')) {
      const allSessions=await bounded(collection(db,'sessions'));
      const visibleById=new Map(allSessions.map(session=>[session.id,sharedCalendarMetadata(session)]));
      for(const session of personalSessions) visibleById.set(session.id,session);
      sessions=[...visibleById.values()];
    }
    // Only expose names of the tutors already present on this account's sessions.
    for(const tutorId of new Set(sessions.map(s=>s.tutorId).filter(Boolean))) if(!profiles.some(p=>p.id===tutorId)) { const tutor=await collection(db,'profiles').doc(id(tutorId)).get(); if(tutor.exists) profiles.push({id:tutor.id,kind:'tutor',name:tutor.data().name,active:tutor.data().active}); }
    // Keep the full relationship data for server-side authorization. `profiles`
    // may be redacted for the API response (e.g. guardianIds for families).
    const authorizationProfiles=[...profiles];
    const modules=await readModules(db,account,authorizationProfiles,personalSessions,storage);
    // Calendar metadata can be visible to every account, but attendance stays
    // scoped to the attendees already filtered for this account above.
    const attendance=await readAttendance(db,sessionsWithAuthorizedAttendees(sessions));
    const uniqueProfiles=[...new Map(profiles.map(p=>[p.id,p])).values()];
    const visibleProfiles=canAccessArea(account,'profiles')?uniqueProfiles:uniqueProfiles.map(({id,kind,name,active,schoolYear,ageBand,subjects,membershipStatus,memberNumber})=>({id,kind,name,active,schoolYear,ageBand,subjects,membershipStatus,memberNumber}));
    const visibleSessions=canAccessArea(account,'sessions')?sessions:canAccessArea(account,'reports')?sessions.map(({id,studentIds,tutorId,startsAt,endsAt,status})=>({id,studentIds,tutorId,startsAt,endsAt,status})):[];
    return json({...modules,account,profiles:visibleProfiles,sessions:visibleSessions,attendance:canAccessArea(account,'sessions')?attendance:[]});
  } catch(error) { return failure(error); }
}
export async function POST(request) {
  try {
    const {db,account}=await context(request);
    const body=await readJson(request);
    assert(body && typeof body==='object' && !Array.isArray(body));
    if(body.action==='save-record') return await writeModule(db,account,body);
    const allowed={ 'save-profile':['action','profile'], 'create-session':['action','session'], 'create-session-series':['action','session','recurrence'], 'add-attendee':['action','sessionId','studentId'], 'update-session':['action','id','version','session','status'], 'set-attendance':['action','sessionId','studentId','status','version'] };
    assert(allowed[body.action] && Object.keys(body).every(k=>allowed[body.action].includes(k)),'Operação inválida.');
    if(body.action==='save-profile') {
      assert(manages(account)&&canAccessArea(account,'profiles'),'Sem permissão.',403); const value=profileInput(body.profile); const ref=value.id ? collection(db,'profiles').doc(value.id) : collection(db,'profiles').doc(); delete value.id;
      await db.runTransaction(async tx=>{ const previous=await tx.get(ref); assert(!previous.exists || previous.data().kind===value.kind,'Não pode alterar o tipo de perfil.'); for(const guardian of value.guardianIds) {const p=await tx.get(collection(db,'profiles').doc(guardian)); assert(p.exists && p.data().kind==='guardian' && p.data().active,'Encarregado inválido.');} value.accountUid=previous.exists ? previous.data().accountUid || '' : '';
        const history=previous.exists ? previous.data().membershipHistory || [] : [];
        if(value.kind==='member' && (!previous.exists || previous.data().membershipStatus!==value.membershipStatus)) history.push({status:value.membershipStatus,at:new Date().toISOString(),actorUid:account.uid});
        tx.set(ref,{...value,...(value.kind==='member' ? {membershipHistory:history.slice(-100)} : {})}); audit(tx,db,account,body.action,ref.id); }); return json({saved:true,id:ref.id});
    }
    if(body.action==='create-session' || body.action==='update-session') {
      assert(manages(account)&&canAccessArea(account,'sessions'),'Sem permissão.',403); const value=sessionInput(body.session); const ref=body.action==='create-session' ? collection(db,'sessions').doc() : collection(db,'sessions').doc(id(body.id));
      if(body.action==='update-session') {assert(Number.isInteger(body.version) && body.version>0); assert(['scheduled','cancelled'].includes(body.status)); value.status=body.status; value.version=body.version+1;}
      await db.runTransaction(async tx=>{ const previous=await tx.get(ref); if(body.action==='update-session') assert(previous.exists && previous.data().version===body.version,'A sessão foi alterada. Atualize os dados.',409);
        const people=await tx.getAll(...[value.tutorId,...value.studentIds].map(p=>collection(db,'profiles').doc(p))); assert(people[0].exists && people[0].data().kind==='tutor' && people[0].data().active,'Explicador inválido.'); assert(people.slice(1).every(p=>p.exists && p.data().kind==='student' && p.data().active),'Aluno inválido.');
        // Shared scheduling lock serializes concurrent creates, including empty-query races.
        const lock=collection(db,'locks').doc('schedule'); await tx.get(lock);
        const existing=await tx.get(collection(db,'sessions').where('endsAt','>',value.startsAt).limit(501)); assert(existing.size<=500,'Intervalo demasiado abrangente.',409); assert(!rows(existing).some(s=>s.id!==ref.id && overlaps(s,value)),'Conflito de horário de aluno, explicador ou sala.',409);
        tx.set(lock,{updatedAt:Date.now()}); tx.set(ref,value); audit(tx,db,account,body.action,ref.id); }); return json({saved:true,id:ref.id});
    }
    if(body.action==='create-session-series') {
      assert(manages(account)&&canAccessArea(account,'sessions'),'Sem permissão.',403);
      const base=sessionInput(body.session);
      assert(body.recurrence && typeof body.recurrence==='object' && !Array.isArray(body.recurrence) && Object.keys(body.recurrence).every(key=>['period','weekdays'].includes(key)),'Repetição inválida.');
      const {period,weekdays}=body.recurrence;
      const schedule=expandLisbonSessionRecurrence(base.startsAt,base.endsAt,period,weekdays);
      const occurrences=schedule.map(times=>({...base,...times}));
      for(let index=0;index<occurrences.length;index++) for(let other=index+1;other<occurrences.length;other++) assert(!overlaps(occurrences[index],occurrences[other]),'As sessões repetidas entram em conflito entre si.');
      const refs=occurrences.map(()=>collection(db,'sessions').doc());
      const seriesId=refs[0].id;
      await db.runTransaction(async tx=>{
        const lock=collection(db,'locks').doc('schedule');
        await tx.get(lock);
        const people=await tx.getAll(...[base.tutorId,...base.studentIds].map(profileId=>collection(db,'profiles').doc(profileId)));
        assert(people[0].exists && people[0].data().kind==='tutor' && people[0].data().active,'Explicador inválido.');
        assert(people.slice(1).every(person=>person.exists && person.data().kind==='student' && person.data().active),'Aluno inválido.');
        const existing=await tx.get(collection(db,'sessions').where('endsAt','>',base.startsAt).limit(501));
        assert(existing.size<=500,'Intervalo demasiado abrangente.',409);
        assert(!rows(existing).some(session=>occurrences.some(occurrence=>overlaps(session,occurrence))),'Conflito de horário de aluno, explicador ou sala. A série não foi criada.');
        tx.set(lock,{updatedAt:Date.now()});
        refs.forEach((ref,index)=>{
          const value={...occurrences[index],seriesId,recurrence:{frequency:'weekly',period,weekdays:[...weekdays],occurrence:index+1,total:occurrences.length}};
          tx.set(ref,value);
        });
        audit(tx,db,account,body.action,seriesId,{occurrences:occurrences.length,period,weekdays});
      });
      return json({saved:true,seriesId,ids:refs.map(ref=>ref.id)});
    }
    if(body.action==='add-attendee') {
      assert(canAccessArea(account,'sessions'),'Este menu não está disponível para esta conta.',403);
      const sessionId=id(body.sessionId),studentId=id(body.studentId);
      const sessionRef=collection(db,'sessions').doc(sessionId), studentRef=collection(db,'profiles').doc(studentId);
      await db.runTransaction(async tx=>{
        const session=await tx.get(sessionRef), student=await tx.get(studentRef);
        assert(session.exists,'Sessão inexistente.',404);
        const value=session.data();
        assert(value.status==='scheduled' && Date.parse(value.startsAt)<=Date.now() && Date.parse(value.endsAt)>=Date.now(),'Só é possível acrescentar alunos enquanto a sessão está a decorrer.');
        assert(canAttend(account,value),'Sem permissão para alterar esta sessão.',403);
        assert(student.exists && student.data().kind==='student' && student.data().active,'Aluno inválido.');
        const assigned=manages(account)?null:await tx.get(collection(db,'sessions').where('tutorId','==',value.tutorId).limit(501));
        assert(!assigned || assigned.size<=500,'Demasiadas sessões atribuídas. Contacte a coordenação.',409);
        const tutorStudentIds=assigned ? rows(assigned).filter(item=>item.studentIds.includes(studentId)).map(()=>studentId) : [];
        assert(canAddUnplannedAttendee(account,value,studentId,tutorStudentIds),'Sem permissão para associar este aluno à sessão.',403);
        assert(!value.studentIds.includes(studentId),'Este aluno já está associado à sessão.');
        const attendanceRef=collection(db,'attendance').doc(`${sessionId}:${studentId}`);
        const previousAttendance=await tx.get(attendanceRef);
        const lock=collection(db,'locks').doc('schedule');
        await tx.get(lock);
        const studentIds=[...value.studentIds,studentId];
        tx.set(sessionRef,{...value,studentIds,version:(value.version||1)+1});
        tx.set(attendanceRef,{sessionId,studentId,status:'present',version:(previousAttendance.data()?.version||0)+1});
        tx.set(lock,{updatedAt:Date.now()});
        audit(tx,db,account,body.action,sessionId,{studentId});
      });
      return json({saved:true});
    }
    assert(canAccessArea(account,'sessions'),'Este menu não está disponível para esta conta.',403);const sessionId=id(body.sessionId),studentId=id(body.studentId); assert(['present','absent','excused'].includes(body.status),'Presença inválida.');
    await db.runTransaction(async tx=>{ const session=await tx.get(collection(db,'sessions').doc(sessionId)); assert(session.exists,'Sessão inexistente.',404); assert(canAttend(account,session.data()),'Sem permissão para registar presenças.',403); assert(session.data().status==='scheduled' && session.data().studentIds.includes(studentId),'Aluno ou sessão inválidos.'); assert(Date.parse(session.data().startsAt)<=Date.now(),'A sessão ainda não começou.'); const ref=collection(db,'attendance').doc(`${sessionId}:${studentId}`); const old=await tx.get(ref); const version=attendanceVersion(old.data(),body.version); tx.set(ref,{sessionId,studentId,status:body.status,version}); audit(tx,db,account,body.action,ref.id); }); return json({saved:true});
  } catch(error) { return failure(error); }
}
