const high=new Set([
  'update-platform-access-profiles','update-platform-user-access','suspend-platform-user','restore-platform-user',
  'delete-platform-user','generate-platform-user-temporary-password','send-platform-user-invite','reset-platform-user-password'
]);
const mediumPrefixes=['delete-','record-donation','record-financing','record-expense','record-due-payment','update-due','update-donation','update-financing','update-expense','update-due-payment'];

export function classifyAuditAction(action){
  const value=String(action||'').trim();
  if(!value) return {severity:'low',securityRelevant:false,category:'unknown'};
  if(high.has(value)) return {severity:'high',securityRelevant:true,category:'access-control'};
  if(value.includes('platform-user')||value.includes('platform-access')) return {severity:'medium',securityRelevant:true,category:'identity'};
  if(mediumPrefixes.some(prefix=>value.startsWith(prefix))){
    const category=/due|donation|financing|expense|payment/.test(value)?'finance':'data-change';
    return {severity:'medium',securityRelevant:true,category};
  }
  if(/attendance|assessment|justification/.test(value)) return {severity:'low',securityRelevant:true,category:'student-record'};
  return {severity:'low',securityRelevant:false,category:'operation'};
}
