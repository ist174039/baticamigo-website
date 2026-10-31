export function privacyAssessmentStatus(value={}){
  const required=['scope','purposes','dataSubjects','dataCategories','recipients','retentionDecision','necessity','risks','measures','reviewer','reviewedAt','decision'];
  const missing=required.filter(key=>{
    const item=value[key];
    return Array.isArray(item)?item.length===0:!String(item||'').trim();
  });
  const reviewed=/^20\d{2}-\d{2}-\d{2}$/.test(String(value.reviewedAt||''));
  const decision=['approved','approved-with-actions','not-approved','not-required'].includes(value.decision);
  const approved=missing.length===0&&reviewed&&decision&&['approved','approved-with-actions','not-required'].includes(value.decision);
  return {approved,missing:[...new Set([...missing,...(!reviewed?['reviewedAt']:[]),...(!decision?['decision']:[])])]};
}
