const events=new Set(['auth-failure','platform-api-error','access-denied']);
const severities=new Set(['low','medium','high']);

function cleanCode(value){
  const code=String(value||'unknown').trim().toLowerCase();
  return /^[a-z0-9._:-]{1,80}$/.test(code)?code:'redacted';
}

export function operationalEvent(event,{severity='medium',code='unknown'}={}){
  if(!events.has(event)) throw new Error('Operational event is not allowlisted.');
  if(!severities.has(severity)) throw new Error('Operational severity is invalid.');
  const record={
    type:'baticamigo-ops',
    event,
    severity,
    code:cleanCode(code),
    timestamp:new Date().toISOString(),
  };
  // Intentionally emit only the allowlisted record. Never pass request/user
  // objects, tokens, emails, profile IDs, payloads or arbitrary metadata.
  console.warn(JSON.stringify(record));
  return record;
}

export function operationalEventRecord(event,input={}){
  if(!events.has(event)) throw new Error('Operational event is not allowlisted.');
  const severity=severities.has(input.severity)?input.severity:'medium';
  return {
    type:'baticamigo-ops',
    event,
    severity,
    code:cleanCode(input.code),
    timestamp:'1970-01-01T00:00:00.000Z',
  };
}
