export function validateHealthPayload(value,expectedSha){
  if(!value||value.status!=='ok'||value.service!=='baticamigo-website') throw new Error('Unexpected health payload.');
  if(!/^[0-9a-f]{40}$/i.test(String(expectedSha||''))) throw new Error('Expected release SHA is invalid.');
  if(value.commitSha!==expectedSha) throw new Error('Deployment SHA does not match release SHA.');
  return true;
}

export function validateDeploymentHeaders(headers){
  const get=name=>String(headers.get?headers.get(name):headers[name.toLowerCase()]||headers[name]||'');
  if(!/nosniff/i.test(get('x-content-type-options'))) throw new Error('Missing nosniff.');
  if(!/max-age=/i.test(get('strict-transport-security'))) throw new Error('Missing HSTS.');
  const csp=get('content-security-policy');
  if(!/default-src 'self'/.test(csp)||!/frame-ancestors 'none'/.test(csp)) throw new Error('CSP baseline missing.');
  return true;
}
