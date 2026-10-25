const allowedSeverities=new Set(['low','medium','high']);
const allowedOperationalEvents=new Set(['auth-failure','platform-api-error','access-denied']);
export function observabilityStatus(config={},evidence={}){
  if(config?.schemaVersion!==1||!Array.isArray(config.signals)||config.signals.length===0) throw new Error('Invalid observability baseline.');
  const ids=new Set();
  for(const signal of config.signals){
    if(!signal?.id||ids.has(signal.id)) throw new Error('Observability signal id invalid or duplicate.');
    ids.add(signal.id);
    if(!signal.source||!allowedSeverities.has(signal.severity)) throw new Error('Observability signal source/severity invalid.');
    if(!Number.isInteger(signal.windowMinutes)||signal.windowMinutes<1) throw new Error('Observability window invalid.');
    if(signal.piiAllowed!==false) throw new Error('Observability signals must prohibit PII by default.');
    if(!signal.runbook) throw new Error('Observability runbook required.');
    if(signal.source==='application' && !allowedOperationalEvents.has(signal.eventName)) throw new Error('Application observability signal requires an allowlisted runtime eventName.');
  }
  const required=Array.isArray(config.requiredOperationalEvidence)?config.requiredOperationalEvidence:[];
  const missing=required.filter(key=>!String(evidence[key]||'').trim());
  return {ready:missing.length===0,missing,signalCount:config.signals.length};
}
