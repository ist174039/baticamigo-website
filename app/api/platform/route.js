import {readModules,writeModule} from '../../../lib/platform/modules-server';
import {context,collection,audit,json,failure} from '../../../lib/platform/server';
import {assert,id,profileInput,sessionInput,accountInput,manages,hasRole,profileIds,canReadStudent,canAttend,overlaps,attendanceVersion} from '../../../lib/platform/domain.mjs';
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
    const {db,account}=await context(request);
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
    // Only expose names of the tutors already present on this account's sessions.
    for(const tutorId of new Set(sessions.map(s=>s.tutorId))) if(!profiles.some(p=>p.id===tutorId)) { const tutor=await collection(db,'profiles').doc(id(tutorId)).get(); if(tutor.exists) profiles.push({id:tutor.id,kind:'tutor',name:tutor.data().name,active:tutor.data().active}); }
    const modules=await readModules(db,account,profiles,sessions);
    const attendance=await readAttendance(db,sessions);
    return json({...modules,account,profiles:[...new Map(profiles.map(p=>[p.id,p])).values()],sessions,attendance});
  } catch(error) { return failure(error); }
}
export async function POST(request) {
  try {
    const {db,account,auth}=await context(request);
    const body=await readJson(request);
    assert(body && typeof body==='object' && !Array.isArray(body));
    if(body.action==='save-record') return await writeModule(db,account,body);
    const allowed={ 'save-profile':['action','profile'], 'save-account':['action','account'], 'create-session':['action','session'], 'update-session':['action','id','version','session','status'], 'set-attendance':['action','sessionId','studentId','status','version'] };
    assert(allowed[body.action] && Object.keys(body).every(k=>allowed[body.action].includes(k)),'Operação inválida.');
    if(body.action==='save-account') {
      assert(hasRole(account,'admin'),'Apenas administradores podem atribuir acessos.',403); const value=accountInput(body.account);
      assert(value.uid!==account.uid,'Não pode alterar o seu próprio acesso.',403);
      let target; try { target=await auth.getUser(value.uid); } catch { assert(false,'Conta Firebase inexistente.'); } assert(!target.disabled || !value.active,'Conta Firebase desativada.');
      await db.runTransaction(async tx=>{
        const lock=collection(db,'locks').doc('accounts'); await tx.get(lock);
        const linked=[]; for(const profileId of value.profileIds) { const p=await tx.get(collection(db,'profiles').doc(profileId)); assert(p.exists && p.data().active===true,'Perfil inexistente ou inativo.'); assert(!p.data().accountUid || p.data().accountUid===value.uid,'Perfil associado a outra conta.'); linked.push({id:profileId,data:p.data()}); const used=await tx.get(collection(db,'accounts').where('profileIds','array-contains',profileId).limit(2)); assert(used.docs.every(d=>d.id===value.uid),'Perfil já associado a outra conta.'); }
        const represented=(role)=>role==='volunteer' ? linked.some(p=>p.data.kind==='tutor') : linked.some(p=>p.data.kind===role);
        assert(linked.every(p=>value.roles.includes(p.data.kind) || (p.data.kind==='tutor' && value.roles.includes('volunteer'))) && value.roles.filter(r=>['student','guardian','tutor','volunteer','member'].includes(r)).every(represented),'Os papéis devem corresponder aos perfis.');
        const targetRef=collection(db,'accounts').doc(value.uid); const previous=await tx.get(targetRef);
        const previousIds=previous.exists ? profileIds(previous.data()) : [];
        const removedIds=previousIds.filter(profileId=>!value.profileIds.includes(profileId));
        const removedRefs=removedIds.map(profileId=>collection(db,'profiles').doc(profileId));
        const removedProfiles=removedRefs.length ? await tx.getAll(...removedRefs) : [];
        if(previous.exists && previous.data().active===true && (previous.data().roles || [previous.data().role]).includes('admin') && (!value.active || !value.roles.includes('admin'))) {
          const admins=collection(db,'accounts');
          const [arrayAdmins,legacyAdmins]=await Promise.all([
            tx.get(admins.where('roles','array-contains','admin').where('active','==',true).limit(10)),
            tx.get(admins.where('role','==','admin').where('active','==',true).limit(10)),
          ]);
          const remaining=new Set([...arrayAdmins.docs,...legacyAdmins.docs].map(doc=>doc.id).filter(uid=>uid!==value.uid));
          assert(remaining.size>0,'Não pode remover ou desativar a última conta administradora ativa.');
        }
        tx.set(lock,{updatedAt:Date.now()});
        removedProfiles.forEach((profile,index)=>{ if(profile.exists && profile.data().accountUid===value.uid) tx.set(removedRefs[index],{...profile.data(),accountUid:''}); });
        linked.forEach(profile=>tx.set(collection(db,'profiles').doc(profile.id),{...profile.data,accountUid:value.uid}));
        tx.set(targetRef,value); audit(tx,db,account,body.action,value.uid);
      });
      return json({saved:true});
    }
    if(body.action==='save-profile') {
      assert(manages(account),'Sem permissão.',403); const value=profileInput(body.profile); const ref=value.id ? collection(db,'profiles').doc(value.id) : collection(db,'profiles').doc(); delete value.id;
      await db.runTransaction(async tx=>{ const previous=await tx.get(ref); assert(!previous.exists || previous.data().kind===value.kind,'Não pode alterar o tipo de perfil.'); for(const guardian of value.guardianIds) {const p=await tx.get(collection(db,'profiles').doc(guardian)); assert(p.exists && p.data().kind==='guardian' && p.data().active,'Encarregado inválido.');} value.accountUid=previous.exists ? previous.data().accountUid || '' : '';
        const history=previous.exists ? previous.data().membershipHistory || [] : [];
        if(value.kind==='member' && (!previous.exists || previous.data().membershipStatus!==value.membershipStatus)) history.push({status:value.membershipStatus,at:new Date().toISOString(),actorUid:account.uid});
        tx.set(ref,{...value,...(value.kind==='member' ? {membershipHistory:history.slice(-100)} : {})}); audit(tx,db,account,body.action,ref.id); }); return json({saved:true,id:ref.id});
    }
    if(body.action==='create-session' || body.action==='update-session') {
      assert(manages(account),'Sem permissão.',403); const value=sessionInput(body.session); const ref=body.action==='create-session' ? collection(db,'sessions').doc() : collection(db,'sessions').doc(id(body.id));
      if(body.action==='update-session') {assert(Number.isInteger(body.version) && body.version>0); assert(['scheduled','cancelled'].includes(body.status)); value.status=body.status; value.version=body.version+1;}
      await db.runTransaction(async tx=>{ const previous=await tx.get(ref); if(body.action==='update-session') assert(previous.exists && previous.data().version===body.version,'A sessão foi alterada. Atualize os dados.',409);
        const people=await tx.getAll(...[value.tutorId,...value.studentIds].map(p=>collection(db,'profiles').doc(p))); assert(people[0].exists && people[0].data().kind==='tutor' && people[0].data().active,'Explicador inválido.'); assert(people.slice(1).every(p=>p.exists && p.data().kind==='student' && p.data().active),'Aluno inválido.');
        // Shared scheduling lock serializes concurrent creates, including empty-query races.
        const lock=collection(db,'locks').doc('schedule'); await tx.get(lock);
        const existing=await tx.get(collection(db,'sessions').where('endsAt','>',value.startsAt).limit(501)); assert(existing.size<=500,'Intervalo demasiado abrangente.',409); assert(!rows(existing).some(s=>s.id!==ref.id && overlaps(s,value)),'Conflito de horário de aluno, explicador ou sala.',409);
        tx.set(lock,{updatedAt:Date.now()}); tx.set(ref,value); audit(tx,db,account,body.action,ref.id); }); return json({saved:true,id:ref.id});
    }
    const sessionId=id(body.sessionId),studentId=id(body.studentId); assert(['present','absent','excused'].includes(body.status),'Presença inválida.');
    await db.runTransaction(async tx=>{ const session=await tx.get(collection(db,'sessions').doc(sessionId)); assert(session.exists,'Sessão inexistente.',404); assert(canAttend(account,session.data()),'Sem permissão para registar presenças.',403); assert(session.data().status==='scheduled' && session.data().studentIds.includes(studentId),'Aluno ou sessão inválidos.'); assert(Date.parse(session.data().startsAt)<=Date.now(),'A sessão ainda não começou.'); const ref=collection(db,'attendance').doc(`${sessionId}:${studentId}`); const old=await tx.get(ref); const version=attendanceVersion(old.data(),body.version); tx.set(ref,{sessionId,studentId,status:body.status,version}); audit(tx,db,account,body.action,ref.id); }); return json({saved:true});
  } catch(error) { return failure(error); }
}
