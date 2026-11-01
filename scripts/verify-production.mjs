import {validateDeploymentHeaders,validateHealthPayload} from '../lib/platform/production-verification.mjs';

const base=String(process.env.BATIC_PRODUCTION_DEPLOYMENT_URL||'').replace(/\/$/,'');
const sha=String(process.env.BATIC_RELEASE_SHA||'').trim();
let url;try{url=new URL(base);}catch{throw new Error('BATIC_PRODUCTION_DEPLOYMENT_URL must be a valid URL.');}
if(url.protocol!=='https:') throw new Error('Production deployment URL must use HTTPS.');
if(!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('BATIC_RELEASE_SHA must be a 40-character SHA.');

const health=await fetch(base+'/api/health',{redirect:'error'});
if(!health.ok) throw new Error('Health endpoint failed: '+health.status);
validateHealthPayload(await health.json(),sha);

const home=await fetch(base+'/',{redirect:'error'});
if(!home.ok) throw new Error('Homepage failed: '+home.status);
validateDeploymentHeaders(home.headers);

const security=await fetch(base+'/.well-known/security.txt',{redirect:'error'});
if(!security.ok) throw new Error('security.txt failed: '+security.status);
const securityText=await security.text();
if(!/^Contact:/m.test(securityText)||!/^Expires:/m.test(securityText)||!/^Canonical:/m.test(securityText)) throw new Error('security.txt is incomplete.');

console.log(JSON.stringify({status:'passed',deploymentUrl:base,releaseSha:sha,checkedAt:new Date().toISOString()}));
