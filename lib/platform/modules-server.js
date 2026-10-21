import {collection,audit,json} from './server';
import {assert,id,manages,hasRole,profileIds} from './domain.mjs';
import {moduleInput,canReadRecord,canWriteRecord,ownMember} from './modules.mjs';
import {canAccessArea} from './access.mjs';
const rows=s=>s.docs.map(d=>({...d.data(),id:d.id}));
async function bounded(query) { const s=await query.limit(501).get(); assert(s.size<=500,'Demasiados registos. Contacte a coordenação.',409); return rows(s); }
export async function readModules(db,account,profiles,sessions,storage) {
  let records=[];
  if(manages(account)) records=await bounded(collection(db,'records'));
  else for(const student of profiles.filter(p=>['student','member'].includes(p.kind))) records.push(...await bounded(collection(db,'records').where('studentId','==',student.id)));
  const fullProfiles=new Map(profiles.map(person=>[person.id,person]));
  if(!manages(account)) {
    const refs=profiles.filter(p=>['student','member'].includes(p.kind)).map(person=>collection(db,'profiles').doc(person.id));
    if(refs.length) for(const stored of await db.getAll(...refs)) if(stored.exists) fullProfiles.set(stored.id,{...stored.data(),id:stored.id});
  }
  records=records.filter(record=>canReadRecord(account,record,fullProfiles.get(record.studentId),sessions));
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
  assert(Object.keys(body).every(k=>['action','record'].includes(k)),'Campo não permitido.');
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
    if(existingId) {
      assert(previous.exists,'Registo inexistente.',404);
      const old=previous.data(); assert(old.kind===record.kind && old.studentId===record.studentId,'Não pode alterar o tipo ou o aluno.');
      assert(old.version===record.version-1,'O registo foi alterado. Atualize os dados.',409);
      assert(manages(account) || old.authorUid===account.uid,'Apenas o autor ou a coordenação podem alterar este registo.',403);
      assert(!record.filePath || record.filePath===old.filePath || record.filePath.startsWith(`platform-files/${account.uid}/`),'Não pode associar um ficheiro carregado por outra conta.',403);
    } else { assert(record.version===1,'Versão inválida.'); assert(!record.filePath || record.filePath.startsWith(`platform-files/${account.uid}/`),'Não pode associar um ficheiro carregado por outra conta.',403); }
    if(record.kind==='justification') {
      const session=await tx.get(collection(db,'sessions').doc(record.sessionId));
      assert(session.exists && session.data().status==='scheduled' && session.data().studentIds.includes(record.studentId) && Date.parse(session.data().startsAt)<=Date.now(),'Sessão inválida para justificar.');
    }
    tx.set(ref,{...record,authorUid:previous.exists ? previous.data().authorUid : account.uid,authorRoles:previous.exists ? previous.data().authorRoles : account.roles,createdAt:previous.exists ? previous.data().createdAt : new Date().toISOString(),updatedAt:new Date().toISOString()});
    audit(tx,db,account,body.action,ref.id);
  });
  return json({saved:true,id:ref.id});
}
export function memberVisible(account,profile) { return manages(account) || ownMember(account,profile); }
