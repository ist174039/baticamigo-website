const states=new Set(['draft','approved','operational','retired']);

export function validateGovernanceEntry(entry){
  if(!entry||typeof entry!=='object'||Array.isArray(entry)) throw new Error('Governance entry must be an object.');
  const id=String(entry.id||'').trim(),title=String(entry.title||'').trim(),state=String(entry.state||'draft');
  if(!id||!title) throw new Error('Governance id and title are required.');
  if(!states.has(state)) throw new Error('Governance state is invalid.');
  const result={id,title,state,owner:String(entry.owner||'').trim(),evidence:String(entry.evidence||'').trim(),reviewedAt:String(entry.reviewedAt||'').trim(),nextReview:String(entry.nextReview||'').trim()};
  if(['approved','operational'].includes(state)){
    for(const key of ['owner','evidence','reviewedAt','nextReview']) if(!result[key]) throw new Error(`${id} cannot be ${state} without ${key}.`);
    for(const key of ['reviewedAt','nextReview']) if(!/^20\d{2}-\d{2}-\d{2}$/.test(result[key])) throw new Error(`${id} has invalid ${key}.`);
  }
  return result;
}
export function governanceStatus(entries=[]){
  const values=entries.map(validateGovernanceEntry);
  return {total:values.length,operational:values.filter(x=>x.state==='operational').map(x=>x.id),pending:values.filter(x=>x.state!=='operational'&&x.state!=='retired').map(x=>x.id),ready:values.length>0&&values.every(x=>['operational','retired'].includes(x.state))};
}
