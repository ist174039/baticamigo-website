function clone(value){return value===undefined?undefined:JSON.parse(JSON.stringify(value));}
export function subjectExport({subjectProfile,linkedProfiles=[],sessions=[],attendance=[],records=[],account=null}={}){
  if(!subjectProfile?.id) throw new Error('Subject profile required.');
  const subjectId=subjectProfile.id;
  const allowedProfileIds=new Set([subjectId,...linkedProfiles.filter(p=>
    p?.id && (
      (subjectProfile.kind==='student' && Array.isArray(subjectProfile.guardianIds) && subjectProfile.guardianIds.includes(p.id)) ||
      (subjectProfile.kind==='guardian' && Array.isArray(p.guardianIds) && p.guardianIds.includes(subjectId))
    )
  ).map(p=>p.id)]);
  const relatedSessions=sessions.filter(s=>Array.isArray(s.studentIds)&&s.studentIds.includes(subjectId));
  const sessionIds=new Set(relatedSessions.map(s=>s.id));
  const cleanSession=s=>({...s,studentIds:(s.studentIds||[]).filter(id=>id===subjectId)});
  return {
    schemaVersion:1,
    generatedFor:subjectId,
    profile:clone(subjectProfile),
    linkedProfiles:clone(linkedProfiles.filter(p=>allowedProfileIds.has(p.id))),
    account:account?clone({uid:account.uid,roles:account.roles||[account.role],active:account.active,suspended:Boolean(account.suspended)}):null,
    sessions:clone(relatedSessions.map(cleanSession)),
    attendance:clone(attendance.filter(a=>a.studentId===subjectId&&(!a.sessionId||sessionIds.has(a.sessionId)))),
    records:clone(records.filter(r=>r.studentId===subjectId)),
  };
}
