import {assert,id,manages,hasRole,profileIds,canReadStudent,canAttend} from './domain.mjs';
const kinds=['assignment','material','document','message','assessment','justification'];
export function moduleInput(body) {
  assert(body && typeof body==='object' && !Array.isArray(body));
  const allowed=['id','version','kind','studentId','title','content','url','filePath','fileName','dueAt','subject','period','origin','score','scaleMin','scaleMax','gaps','sessionId','assessedOn'];
  assert(Object.keys(body).every(key=>allowed.includes(key)),'Campo não permitido.');
  assert(kinds.includes(body.kind),'Tipo de registo inválido.');
  const clean=(value,max,required=false)=>{ assert(typeof value==='string' && value.length<=max && (!required || value.trim()),'Preencha os campos obrigatórios.'); return value.trim(); };
  const result={kind:body.kind,studentId:id(body.studentId),title:clean(body.title,160,true),content:clean(body.content || '',6000),url:'',filePath:'',fileName:'',dueAt:'',subject:'',period:'',origin:'',score:null,scaleMin:null,scaleMax:null,gaps:'',sessionId:'',assessedOn:''};
  if(body.url) { try { const url=new URL(body.url); assert(url.protocol==='https:' && !url.username && !url.password,'Use uma ligação HTTPS.'); result.url=url.toString(); } catch { assert(false,'Ligação inválida. Use HTTPS.'); } }
  if(body.filePath || body.fileName) { assert(typeof body.filePath==='string' && body.filePath.length<=220 && /^platform-files\/[A-Za-z0-9_-]{1,128}\/[a-f0-9-]{36}$/.test(body.filePath),'Ficheiro inválido.'); result.filePath=body.filePath; result.fileName=clean(body.fileName,180,true); }
  if(body.dueAt) { assert(/^\d{4}-\d{2}-\d{2}$/.test(body.dueAt) && Number.isFinite(Date.parse(body.dueAt)) && new Date(body.dueAt).toISOString().slice(0,10)===body.dueAt,'Prazo inválido.'); result.dueAt=body.dueAt; }
  if(body.kind==='message') assert(result.content,'Escreva a mensagem.');
  if(['material','document','assignment'].includes(body.kind)) assert(result.content || result.url || result.filePath,'Indique uma descrição, uma ligação ou um ficheiro.');
  if(body.kind==='assessment') {
    if(body.assessedOn) { assert(/^\d{4}-\d{2}-\d{2}$/.test(body.assessedOn) && Number.isFinite(Date.parse(body.assessedOn)) && new Date(body.assessedOn).toISOString().slice(0,10)===body.assessedOn,'Data de avaliação inválida.'); result.assessedOn=body.assessedOn; }
    result.subject=clean(body.subject,100,true); result.period=clean(body.period,100,true); result.origin=clean(body.origin,200,true); result.gaps=clean(body.gaps || '',2000);
    if(body.score !== null && body.score !== undefined && body.score !== '') {
      assert([body.score,body.scaleMin,body.scaleMax].every(n=>typeof n==='number' && Number.isFinite(n)),'Escala inválida.');
      assert(body.scaleMin<body.scaleMax && body.score>=body.scaleMin && body.score<=body.scaleMax,'A nota tem de respeitar a escala indicada.');
      Object.assign(result,{score:body.score,scaleMin:body.scaleMin,scaleMax:body.scaleMax});
    }
  }
  if(body.kind==='justification') { result.sessionId=id(body.sessionId); assert(result.content,'Indique o motivo da justificação.'); }
  if(body.id) result.id=id(body.id);
  assert(Number.isInteger(body.version ?? 0) && (body.version ?? 0)>=0,'Versão inválida.'); result.version=(body.version || 0)+1;
  return result;
}
export function canWriteStudent(account,student,sessions) { return manages(account) || sessions.some(s=>s.studentIds.includes(student.id) && canAttend(account,s)); }
export function canReadRecord(account,record,student,sessions) {
  if(manages(account)) return true;
  if(!student) return false;
  if(student.kind==='member') return ['message','document'].includes(record.kind) && ownMember(account,student);
  if(student.kind!=='student') return false;
  return canReadStudent(account,student) || canWriteStudent(account,student,sessions);
}
export function canWriteRecord(account,record,student,sessions) {
  if(record.kind==='message') return canReadRecord(account,record,student,sessions);
  if(record.kind==='justification') return manages(account) || hasRole(account,'guardian') && canReadStudent(account,student);
  return canWriteStudent(account,student,sessions);
}
export function progressSummary(student,records,attendance,sessions) {
  const assessments=records.filter(r=>r.kind==='assessment' && r.studentId===student.id).sort((a,b)=>(a.assessedOn || a.createdAt || '').localeCompare(b.assessedOn || b.createdAt || ''));
  const subjects=[...new Set(assessments.map(r=>r.subject))].map(subject=>{
    const evidence=assessments.filter(r=>r.subject===subject), latest=evidence.at(-1);
    const comparable=evidence.filter(r=>typeof r.score==='number' && r.scaleMin===latest.scaleMin && r.scaleMax===latest.scaleMax && r.origin===latest.origin);
    return {subject,count:evidence.length,latest,change:typeof latest.score==='number' && comparable.length>=2 ? latest.score-comparable[0].score : null,evidenceIds:evidence.map(r=>r.id)};
  });
  const completed=sessions.filter(s=>s.status==='scheduled' && s.studentIds.includes(student.id) && Date.parse(s.endsAt)<Date.now());
  const marks=attendance.filter(a=>a.studentId===student.id && completed.some(s=>s.id===a.sessionId));
  return {studentId:student.id,assessmentCount:assessments.length,subjects,scheduled:completed.length,registered:marks.length,present:marks.filter(a=>a.status==='present').length,missing:completed.length-marks.length,reviewRequired:true,method:'Resumo descritivo dos registos disponíveis. Sem previsão, diagnóstico ou conversão de escalas.'};
}
export function ownMember(account,profile) { return profile.kind==='member' && hasRole(account,'member') && profileIds(account).includes(profile.id); }
