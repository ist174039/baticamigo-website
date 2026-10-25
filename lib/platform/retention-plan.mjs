import {retentionCutoff,validateRetentionPolicy} from './retention.mjs';

export function planRetention(items,policy,now=new Date()){
  const normalized=validateRetentionPolicy(policy);
  if(!Array.isArray(items)) throw new Error('Retention items must be an array.');
  const candidates=[],blocked=[],kept=[];
  for(const item of items){
    if(!item?.id||!item.retentionCategory) throw new Error('Retention item requires id and retentionCategory.');
    const category=normalized.categories[item.retentionCategory];
    if(!category) throw new Error(`Unknown retention category: ${item.retentionCategory}`);
    const cutoff=retentionCutoff(normalized,item.retentionCategory,now);
    if(cutoff===null||item.legalHold===true){blocked.push({id:item.id,reason:'legal-hold'});continue;}
    const timestamp=String(item.updatedAt||item.createdAt||'');
    if(!Number.isFinite(Date.parse(timestamp))) throw new Error(`Retention item ${item.id} has no valid timestamp.`);
    if(Date.parse(timestamp)<Date.parse(cutoff)) candidates.push({id:item.id,category:item.retentionCategory,cutoff});
    else kept.push({id:item.id,category:item.retentionCategory});
  }
  return {policyVersion:normalized.version,dryRun:true,candidates,blocked,kept};
}
