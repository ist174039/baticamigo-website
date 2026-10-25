import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(readFileSync(resolve(root,'docs/standards-controls.json'),'utf8'));
const expected=Array.from({length:40},(_,i)=>`BA-STD-${String(i+1).padStart(3,'0')}`);

test('all canonical standards have repository traceability',()=>{
  assert.deepEqual(new Set(Object.keys(manifest.controls)),new Set(expected));
  for(const id of expected){
    const item=manifest.controls[id];
    assert.ok(item.mode,`${id} missing mode`);
    assert.ok(Array.isArray(item.evidence)&&item.evidence.length>0,`${id} missing evidence`);
    for(const path of item.evidence) assert.ok(existsSync(resolve(root,path)),`${id} references missing evidence: ${path}`);
    if(item.mode!=='technical-evidence') assert.ok(item.blocker?.trim(),`${id} must make non-code blocker explicit`);
  }
});

test('legal, privacy, accessibility and recovery standards fail closed instead of implying compliance',()=>{
  for(const id of ['BA-STD-001','BA-STD-002','BA-STD-003','BA-STD-008','BA-STD-031','BA-STD-032','BA-STD-035','BA-STD-037','BA-STD-039','BA-STD-040']){
    assert.notEqual(manifest.controls[id].mode,'technical-evidence',`${id} must not be represented as code-only compliance`);
  }
});
