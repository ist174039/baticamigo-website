const treatments=new Set(['reduce','avoid','transfer','accept']);
const statuses=new Set(['open','treating','accepted','closed']);

export function validateRisk(risk){
  if(!risk||typeof risk!=='object'||Array.isArray(risk)) throw new Error('Risk must be an object.');
  const text=(key,max=500)=>{const value=String(risk[key]||'').trim();if(!value||value.length>max) throw new Error(`Risk ${key} is required.`);return value;};
  const result={
    id:text('id',80),asset:text('asset',200),threat:text('threat'),vulnerability:text('vulnerability'),
    impact:text('impact'),likelihoodEvidence:text('likelihoodEvidence'),controls:text('controls',2000),
    treatment:String(risk.treatment||''),status:String(risk.status||'open'),
    owner:String(risk.owner||'').trim(),dueDate:String(risk.dueDate||'').trim(),
    acceptanceCriterion:String(risk.acceptanceCriterion||'').trim(),evidence:String(risk.evidence||'').trim(),
    reviewedAt:String(risk.reviewedAt||'').trim(),
  };
  if(!treatments.has(result.treatment)) throw new Error('Risk treatment is invalid.');
  if(!statuses.has(result.status)) throw new Error('Risk status is invalid.');
  if(result.dueDate && !/^20\d{2}-\d{2}-\d{2}$/.test(result.dueDate)) throw new Error('Risk dueDate is invalid.');
  if(result.reviewedAt && !/^20\d{2}-\d{2}-\d{2}$/.test(result.reviewedAt)) throw new Error('Risk reviewedAt is invalid.');
  if(['accepted','closed'].includes(result.status)){
    for(const key of ['owner','dueDate','acceptanceCriterion','evidence','reviewedAt']) if(!result[key]) throw new Error(`Risk cannot be ${result.status} without ${key}.`);
  }
  if(result.treatment==='accept' && result.status!=='accepted') throw new Error('Accepted treatment requires accepted status.');
  return result;
}

export function riskRegisterStatus(risks=[]){
  const validated=risks.map(validateRisk);
  return {
    total:validated.length,
    open:validated.filter(r=>!['accepted','closed'].includes(r.status)).map(r=>r.id),
    accepted:validated.filter(r=>r.status==='accepted').map(r=>r.id),
    closed:validated.filter(r=>r.status==='closed').map(r=>r.id),
    ready:validated.length>0&&validated.every(r=>['accepted','closed'].includes(r.status)),
  };
}
