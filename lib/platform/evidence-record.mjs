const types=new Set(['accessibility','responsive','usability','backup-restore','iam-review','rules-deployment','privacy-review','risk-review','standards-review']);

export function validateEvidenceRecord(value){
  if(!value||typeof value!=='object'||Array.isArray(value)) throw new Error('Evidence record must be an object.');
  const result={
    id:String(value.id||'').trim(),type:String(value.type||'').trim(),environment:String(value.environment||'').trim(),
    version:String(value.version||'').trim(),executedAt:String(value.executedAt||'').trim(),executor:String(value.executor||'').trim(),
    reviewer:String(value.reviewer||'').trim(),result:String(value.result||'').trim(),artifact:String(value.artifact||'').trim(),
    limitations:String(value.limitations||'').trim(),acceptanceCriterion:String(value.acceptanceCriterion||'').trim()
  };
  if(!result.id||!types.has(result.type)) throw new Error('Evidence id/type invalid.');
  for(const key of ['environment','version','executedAt','executor','reviewer','result','artifact','acceptanceCriterion']) if(!result[key]) throw new Error(`Evidence ${key} is required.`);
  if(!/^20\d{2}-\d{2}-\d{2}(?:T.*Z)?$/.test(result.executedAt)) throw new Error('Evidence executedAt invalid.');
  if(!['passed','failed','blocked'].includes(result.result)) throw new Error('Evidence result invalid.');
  return result;
}
export function evidencePassed(value){return validateEvidenceRecord(value).result==='passed';}
