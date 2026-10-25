import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {percentile,qualityBudgets} from '../lib/platform/quality-budgets.mjs';

const host='http://127.0.0.1:3102';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3102'],{stdio:['ignore','pipe','pipe']});
let log=''; for(const stream of [server.stdout,server.stderr]) stream.on('data',chunk=>{log=(log+chunk.toString()).slice(-12000);});
async function ready(){
  for(let i=0;i<80;i++){
    try{const response=await fetch(host+'/');if(response.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error('Production server did not start: '+log);
}
try{
  await ready();
  for(const path of ['/','/platform/login']){
    const response=await fetch(host+path);
    assert.equal(response.status,200,path);
    for(const [header,expected] of [
      ['x-content-type-options','nosniff'],
      ['x-frame-options','DENY'],
      ['cross-origin-opener-policy','same-origin'],
      ['cross-origin-resource-policy','same-origin'],
      ['x-permitted-cross-domain-policies','none'],
    ]) assert.equal(response.headers.get(header),expected,`${path} ${header}`);
    assert.match(response.headers.get('strict-transport-security')||'',/max-age=31536000/);
    const csp=response.headers.get('content-security-policy')||'';
    assert.match(csp,/object-src 'none'/); assert.match(csp,/frame-ancestors 'none'/);
    const html=await response.text();
    assert.match(html,/<html[^>]+lang="pt"/);
    assert.match(html,/<main\b/);
    assert.match(html,/<h1\b/);
  }
  const timings=[];
  for(let i=0;i<5;i++){const start=performance.now();const response=await fetch(host+'/');assert.equal(response.status,200);await response.arrayBuffer();timings.push(performance.now()-start);}
  const p95=percentile(timings,.95);
  assert.ok(p95<=qualityBudgets.localHttpP95Ms,`Local production smoke p95 ${Math.round(p95)}ms exceeds ${qualityBudgets.localHttpP95Ms}ms budget.`);
  console.log(`Local production smoke p95: ${Math.round(p95)}ms.`);
  const home=await (await fetch(host+'/')).text();
  assert.match(home,/Saltar para o conteúdo/);
  assert.match(home,/id="conteudo"/);
  const login=await (await fetch(host+'/platform/login')).text();
  assert.match(login,/noindex/);
  const security=await fetch(host+'/.well-known/security.txt');
  assert.equal(security.status,200);
  assert.match(security.headers.get('content-type')||'',/text\/plain/);
  const securityText=await security.text();
  assert.match(securityText,/^Contact:/m);
  assert.match(securityText,/^Expires:/m);
  assert.match(securityText,/^Canonical:/m);
  const api=await fetch(host+'/api/platform');
  assert.equal(api.status,401);
  assert.match(api.headers.get('content-type')||'',/application\/problem\+json/);
  const problem=await api.json();
  assert.equal(problem.status,401); assert.equal(problem.type,'about:blank'); assert.equal(problem.detail,problem.error);
  console.log('PASS: production HTTP, semantic baseline, headers and problem responses.');
} finally {
  server.kill('SIGTERM');
}
