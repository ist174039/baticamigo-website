import {collection,audit,json} from './server';
import {assert,id,manages,hasRole,profileIds} from './domain.mjs';
import {moduleInput,canReadRecord,canWriteRecord,ownMember} from './modules.mjs';
import {canAccessArea} from './access.mjs';
import {recordGovernance} from './records-management.mjs';
const rows=s=>s.docs.map(d=>({...d.data(),id:d.id}));
async function bounded(query) { const s=await query.limit(501).get(); assert(s.size<=500,'Demasiados registos. Contacte a coordenação.',409); return rows(s); }
export async function readModules(db,account,profiles,sessions,storage) {
  let records=[];
  if(manages(account)) records=await bounded(collection(db,'records'));
  else {
    const queries=profiles.filter(p=>['student','member'].includes(p.kind)).map(person=>collection(db,'records').where('studentId','==',person.id));
    const roles=account.roles||[account.role];
    if(roles.length) queries.push(collection(db,'records').where('shareWithRoles','array-contains-any',roles));
    const linked=profileIds(account);
    if(linked.length) queries.push(collection(db,'records').where('shareWithProfileIds','array-contains-any',linked));
    const resultSets=await Promise.all(queries.map(bounded));
    records=[...new Map(resultSets.flat().map(record=>[record.id,record])).values()];
    assert(records.length<=500,'Demasiados registos partilhados. Contacte a coordenação para arquivar dados antigos.',409);
  }
  const fullProfiles=new Map(profiles.map(person=>[person.id,person]));
  if(!manages(account)) {
    const missingIds=[...new Set(records.map(record=>record.studentId).filter(profileId=>!fullProfiles.has(profileId)))];
    for(let index=0;index<missingIds.length;index+=100) {
      const refs=missingIds.slice(index,index+100).map(profileId=>collection(db,'profiles').doc(profileId));
      for(const stored of await db.getAll(...refs)) if(stored.exists) fullProfiles.set(stored.id,{...stored.data(),id:stored.id});
    }
  }
  records=records.filter(record=>(!record.archivedAt&&!record.deletedAt||manages(account)||record.authorUid===account.uid)&&canReadRecord(account,record,fullProfiles.get(record.studentId),sessions));
  if(storage) records=await Promise.all(records.map(async record=>{
    if(!record.filePath || !record.filePath.startsWith('platform-files/')) return record;
    try { const [fileUrl]=await storage.file(record.filePath).getSignedUrl({action:'read',expires:Date.now()+10*60*1000,responseDisposition:'attachment'}); return {...record,fileUrl}; }
    catch { return {...record,fileUrl:''}; }
  }));
  let accounts=[];
  if(hasRole(account,'admin')&&canAccessArea(account,'profiles')) accounts=await bounded(collection(db,'accounts'));
  return {records,accounts};
}
export async function writeModule(db,account,body) {
  if(body.action==='archive-record'||body.action==='restore-record'||body.action==='delete-record') {
    assert(Object.keys(body).every(key=>['action','id','version'].includes(key)),'Campo não permitido.');
    const recordId=id(body.id),version=body.version;
    assert(Number.isInteger(version)&&version>0,'Versão do registo inválida.');
    const ref=collection(db,'records').doc(recordId),archiving=body.action==='archive-record',deleting=body.action==='delete-record';
    await db.runTransaction(async tx=>{
      const stored=await tx.get(ref);assert(stored.exists,'Registo inexistente.',404);const old=stored.data();
      assert(['assessment','message'].includes(old.kind),'Este tipo de registo não pode ser gerido nesta área.',403);
      assert(canAccessArea(account,old.kind),'Este menu não está disponível para esta conta.',403);
      assert(manages(account)||old.authorUid===account.uid,'Apenas o autor ou a coordenação podem gerir este registo.',403);
      assert(old.version===version,'O registo foi alterado. Atualize os dados.',409);
      if(deleting) assert(!old.archivedAt&&!old.deletedAt,'Restaure o registo antes de o apagar.',409);
      else if(archiving) assert(!old.archivedAt&&!old.deletedAt,'O registo já está arquivado ou apagado.',409);
      else assert(Boolean(old.archivedAt)||Boolean(old.deletedAt),'O registo já está ativo.',409);
      const now=new Date().toISOString();
      tx.set(ref,{...old,version:version+1,archivedAt:archiving?now:body.action==='restore-record'?'':'',archivedBy:archiving?account.uid:body.action==='restore-record'?'':old.archivedBy,deletedAt:deleting?now:body.action==='restore-record'?'':old.deletedAt||'',deletedBy:deleting?account.uid:body.action==='restore-record'?'':old.deletedBy||'',updatedAt:now});
      audit(tx,db,account,body.action,recordId,{kind:old.kind});
    });
    return json({saved:true});
  }
  if(body.action==='review-justification') {
    assert(Object.keys(body).every(key=>['action','recordId','version','decision','reviewNote'].includes(key)),'Campo não permitido.');
    assert(manages(account)&&canAccessArea(account,'justification'),'Só a coordenação pode analisar justificações.',403);
    const recordId=id(body.recordId),version=body.version,decision=body.decision,reviewNote=String(body.reviewNote||'').trim();
    assert(Number.isInteger(version)&&version>0,'Versão da justificação inválida.');
    assert(['approved','rejected'].includes(decision),'Decisão inválida.');
    assert(reviewNote.length<=1200,'A nota não pode exceder 1200 caracteres.');
    const ref=collection(db,'records').doc(recordId);
    await db.runTransaction(async tx=>{
      const stored=await tx.get(ref);assert(stored.exists,'Justificação inexistente.',404);const record=stored.data();
      assert(record.kind==='justification'&&!record.archivedAt,'Justificação inválida ou arquivada.',404);
      assert(record.version===version,'A justificação foi alterada. Atualize os dados.',409);
      assert((record.justificationStatus||'submitted')==='submitted','Esta justificação já foi analisada.',409);
      let attendanceRef=null,attendance=null;
      if(decision==='approved') {
        const session=await tx.get(collection(db,'sessions').doc(record.sessionId));
        assert(session.exists&&session.data().status==='scheduled'&&session.data().studentIds.includes(record.studentId),'Sessão associada indisponível.',409);
        attendanceRef=collection(db,'attendance').doc(`${record.sessionId}:${record.studentId}`);
        const mark=await tx.get(attendanceRef);attendance=mark.data();
        assert(mark.exists&&attendance.sessionId===record.sessionId&&attendance.studentId===record.studentId&&attendance.status==='absent','Só pode aprovar uma justificação ligada a uma falta registada.',409);
      }
      const now=new Date().toISOString();
      tx.set(ref,{...record,justificationStatus:decision,reviewNote,reviewedAt:now,reviewedBy:account.uid,version:version+1,updatedAt:now});
      if(attendanceRef) tx.set(attendanceRef,{...attendance,status:'excused',version:(attendance.version||0)+1,recordedAt:now,recordedBy:account.uid,comment:reviewNote||record.content||attendance.comment||'',justificationRecordId:recordId});
      audit(tx,db,account,'review-justification',recordId,{decision});
    });
    return json({saved:true});
  }
  assert(body.action==='save-record'&&Object.keys(body).every(k=>['action','record'].includes(k)),'Campo não permitido.');
  const record=moduleInput(body.record), existingId=record.id; delete record.id;
  const ref=existingId ? collection(db,'records').doc(existingId) : collection(db,'records').doc();
  const sessions=manages(account) ? [] : (await Promise.all(profileIds(account).map(p=>bounded(collection(db,'sessions').where('tutorId','==',p))))).flat();
  await db.runTransaction(async tx=>{
    const student=await tx.get(collection(db,'profiles').doc(record.studentId));
    assert(student.exists && ['student','member'].includes(student.data().kind),'Aluno inexistente.',404);
    const person={...student.data(),id:student.id};
    assert(person.kind==='student' || ['message','document'].includes(record.kind),'Tipo de registo inválido para sócios.');
    assert(canWriteRecord(account,record,person,sessions),'Sem permissão para este aluno.',403);
    const previous=await tx.get(ref);
    const sharedProfiles=record.shareWithProfileIds.length ? await tx.getAll(...record.shareWithProfileIds.map(profileId=>collection(db,'profiles').doc(profileId))) : [];
    assert(sharedProfiles.every(profile=>profile.exists && profile.data().active===true),'Escolha apenas pessoas com perfis ativos.');
    if(existingId) {
      assert(previous.exists,'Registo inexistente.',404);
      const old=previous.data(); assert(old.kind===record.kind && old.studentId===record.studentId,'Não pode alterar o tipo ou o aluno.');
      assert(old.version===record.version-1,'O registo foi alterado. Atualize os dados.',409);
      assert(!old.archivedAt&&!old.deletedAt,'Restaure o registo antes de o editar.',409);
      assert(manages(account) || old.authorUid===account.uid,'Apenas o autor ou a coordenação podem alterar este registo.',403);
      if(record.kind==='justification') assert((old.justificationStatus||'submitted')==='submitted','Uma justificação já analisada não pode ser alterada.',409);
      assert(!record.filePath || record.filePath===old.filePath || record.filePath.startsWith(`platform-files/${account.uid}/`),'Não pode associar um ficheiro carregado por outra conta.',403);
    } else { assert(record.version===1,'Versão inválida.'); assert(!record.filePath || record.filePath.startsWith(`platform-files/${account.uid}/`),'Não pode associar um ficheiro carregado por outra conta.',403); }
    if(record.kind==='justification') {
      const session=await tx.get(collection(db,'sessions').doc(record.sessionId));
      assert(session.exists && session.data().status==='scheduled' && session.data().studentIds.includes(record.studentId) && Date.parse(session.data().startsAt)<=Date.now(),'Sessão inválida para justificar.');
      const attendance=await tx.get(collection(db,'attendance').doc(`${record.sessionId}:${record.studentId}`));
      assert(attendance.exists&&attendance.data().sessionId===record.sessionId&&attendance.data().studentId===record.studentId&&attendance.data().status==='absent','Só pode justificar uma falta registada pelo explicador.');
      record.justificationStatus=previous.exists?previous.data().justificationStatus||'submitted':'submitted';
      record.reviewNote=previous.exists?previous.data().reviewNote||'':'';
    }
    const governance=recordGovernance(record.kind);
    tx.set(ref,{...record,...governance,authorUid:previous.exists ? previous.data().authorUid : account.uid,authorRoles:previous.exists ? previous.data().authorRoles : account.roles,createdAt:previous.exists ? previous.data().createdAt : new Date().toISOString(),updatedAt:new Date().toISOString()});
    audit(tx,db,account,body.action,ref.id);
  });
  return json({saved:true,id:ref.id});
}
export function memberVisible(account,profile) { return manages(account) || ownMember(account,profile); }
