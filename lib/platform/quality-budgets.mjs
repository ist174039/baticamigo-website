export const qualityBudgets={
  localHttpP95Ms:1500,
  maxApiBodyBytes:16384,
  maxUploadBytes:4000000,
  maxProfilesPerAccount:30,
  maxListRecords:500,
};

export function percentile(values,p=0.95){
  if(!Array.isArray(values)||values.length===0) throw new Error('values required');
  const sorted=[...values].sort((a,b)=>a-b);
  const index=Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1);
  return sorted[index];
}
