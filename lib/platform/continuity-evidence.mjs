const results=new Set(['passed','failed','blocked']);
const scenarioIds=new Set(['IR-01','IR-02','IR-03','IR-04']);

function text(value,key,max=500){
  const result=String(value?.[key]||'').trim();
  if(!result||result.length>max) throw new Error(`${key} is required.`);
  return result;
}
function positive(value,key){
  const number=Number(value?.[key]);
  if(!Number.isFinite(number)||number<=0) throw new Error(`${key} must be positive.`);
  return number;
}
export function validateRestoreEvidence(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('Restore evidence must be an object.');
  const result={
    id:text(value,'id',80),releaseSha:text(value,'releaseSha',80),environment:text(value,'environment',120),
    backupId:text(value,'backupId',160),backupPointAt:text(value,'backupPointAt',80),startedAt:text(value,'startedAt',80),completedAt:text(value,'completedAt',80),
    approvedRpoMinutes:positive(value,'approvedRpoMinutes'),approvedRtoMinutes:positive(value,'approvedRtoMinutes'),
    observedRpoMinutes:positive(value,'observedRpoMinutes'),observedRtoMinutes:positive(value,'observedRtoMinutes'),
    owner:text(value,'owner',160),reviewer:text(value,'reviewer',160),artifact:text(value,'artifact',500),
    result:text(value,'result',20),integrityValidated:value.integrityValidated===true,authorizationValidated:value.authorizationValidated===true,
    rollbackValidated:value.rollbackValidated===true,
  };
  if(!/^[0-9a-f]{40}$/i.test(result.releaseSha)) throw new Error('releaseSha invalid.');
  if(!results.has(result.result)) throw new Error('Restore result invalid.');
  if(result.result==='passed'){
    if(!result.integrityValidated||!result.authorizationValidated||!result.rollbackValidated) throw new Error('Passed restore requires integrity, authorization and rollback validation.');
    if(result.observedRpoMinutes>result.approvedRpoMinutes) throw new Error('Observed RPO exceeds approved RPO.');
    if(result.observedRtoMinutes>result.approvedRtoMinutes) throw new Error('Observed RTO exceeds approved RTO.');
  }
  return result;
}

export function validateIncidentExercise(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('Incident exercise must be an object.');
  const result={
    id:text(value,'id',80),releaseSha:text(value,'releaseSha',80),executedAt:text(value,'executedAt',80),
    owner:text(value,'owner',160),moderator:text(value,'moderator',160),reviewer:text(value,'reviewer',160),
    scenarioIds:Array.isArray(value.scenarioIds)?value.scenarioIds:[],result:text(value,'result',20),
    artifact:text(value,'artifact',500),actions:Array.isArray(value.actions)?value.actions:[],
  };
  if(!/^[0-9a-f]{40}$/i.test(result.releaseSha)) throw new Error('releaseSha invalid.');
  if(!results.has(result.result)) throw new Error('Incident exercise result invalid.');
  if(!result.scenarioIds.length||result.scenarioIds.some(id=>!scenarioIds.has(id))) throw new Error('Incident scenarios invalid.');
  if(result.result==='passed'&&!result.actions.length) throw new Error('Passed incident exercise requires follow-up actions or explicit no-action records.');
  for(const action of result.actions){
    if(!action?.id||!action.owner||!action.acceptanceCriterion||!action.status) throw new Error('Incident action invalid.');
  }
  return result;
}
