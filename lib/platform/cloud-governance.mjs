export function cloudGovernanceStatus(matrix){
  if(!matrix||matrix.schemaVersion!==1||!Array.isArray(matrix.services)||!matrix.services.length) throw new Error('Invalid cloud responsibility matrix.');
  const services=matrix.services.map(service=>{
    if(!service?.service) throw new Error('Cloud service name required.');
    const checks=['dpaConfirmed','regionConfirmed','subprocessorsReviewed','retentionReviewed','incidentProcessReviewed'];
    const missing=checks.filter(key=>service[key]!==true);
    if(!String(service.owner||'').trim()) missing.push('owner');
    return {service:service.service,ready:missing.length===0,missing};
  });
  return {ready:services.every(item=>item.ready)&&/^20\d{2}-\d{2}-\d{2}$/.test(String(matrix.reviewedAt||'')),services};
}
