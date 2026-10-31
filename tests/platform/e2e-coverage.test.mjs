import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

const base=join(process.cwd(),'e2e','tests');
const mapping={
 'FR-001':['security-users.spec.mjs','platform.spec.mjs'],
 'FR-002':['security-users.spec.mjs','role-access.spec.mjs'],
 'FR-003':['profiles-recurrence.spec.mjs'],
 'FR-004':['profiles-recurrence.spec.mjs','sessions-attendance.spec.mjs'],
 'FR-005':['profiles-recurrence.spec.mjs','sessions-attendance.spec.mjs'],
 'FR-006':['profiles-recurrence.spec.mjs','sessions-attendance.spec.mjs'],
 'FR-007':['sessions-attendance.spec.mjs','education-records.spec.mjs'],
 'FR-008':['sessions-attendance.spec.mjs'],
 'FR-009':['sessions-attendance.spec.mjs','education-records.spec.mjs'],
 'FR-010':['document-boundaries.spec.mjs','education-records.spec.mjs','browser-journeys.spec.mjs'],
 'FR-011':['education-records.spec.mjs','platform.spec.mjs'],
 'FR-012':['profiles-recurrence.spec.mjs'],
 'FR-013':['finance.spec.mjs'],
 'FR-014':['cms-reporting.spec.mjs'],
 'FR-015':['cms-reporting.spec.mjs'],
 'FR-016':['education-records.spec.mjs','progress-audit.spec.mjs'],
 'FR-017':['progress-audit.spec.mjs'],
 'FR-018':['cms-reporting.spec.mjs'],
 'FR-019':['education-records.spec.mjs','progress-audit.spec.mjs'],
 'FR-020':['progress-audit.spec.mjs']
};
test('every canonical functional requirement has an executable E2E source file',async()=>{
 const ids=Object.keys(mapping);
 assert.equal(ids.length,20);
 assert.deepEqual(ids,Array.from({length:20},(_,i)=>'FR-'+String(i+1).padStart(3,'0')));
 const available=await readdir(base);
 const all=await Promise.all(available.filter(x=>x.endsWith('.spec.mjs')).map(x=>readFile(join(base,x),'utf8')));
 assert(all.length>=8,'E2E tests cannot be silently removed');
 for(const [id,names] of Object.entries(mapping)){
  assert(names.length,id+': no mapped test');
  for(const name of names){
   assert(available.includes(name),id+': missing '+name);
   const source=await readFile(join(base,name),'utf8');
   assert.match(source,/\btest\(/,id+': no executable test in '+name);
   assert(!source.includes('test.skip('),id+': skipped E2E in '+name);
  }
 }
 const matrix=await readFile(join(process.cwd(),'docs','operations','e2e-coverage-matrix.md'),'utf8');
 for(const id of ids)assert(matrix.includes('| '+id+' |'),id+': missing traceability row');
 for(const id of Array.from({length:7},(_,i)=>'NFR-'+String(i+1).padStart(3,'0')))
  assert(matrix.includes('| '+id+' |'),id+': missing nonfunctional traceability');
});
