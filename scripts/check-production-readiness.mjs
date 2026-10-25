import {productionReadiness} from '../lib/platform/readiness.mjs';

const result=productionReadiness(process.env);
for(const check of result.checks) console.log(`${check.ok?'PASS':'BLOCK'}  ${check.key} — ${check.label}`);
if(!result.ready) {
  console.error(`Production readiness blocked: ${result.missing.join(', ')}`);
  process.exitCode=1;
} else console.log('Production readiness: PASS');
