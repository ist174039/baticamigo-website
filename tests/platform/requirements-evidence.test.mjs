import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'../..');
const manifest=JSON.parse(readFileSync(resolve(root,'docs/requirements-evidence.json'),'utf8'));
const expected=[
  ...Array.from({length:20},(_,index)=>`FR-${String(index+1).padStart(3,'0')}`),
  ...Array.from({length:7},(_,index)=>`NFR-${String(index+1).padStart(3,'0')}`),
];

test('every canonical requirement has traceable repository evidence',()=>{
  assert.deepEqual(new Set(Object.keys(manifest.requirements)),new Set(expected));
  for(const id of expected) {
    const item=manifest.requirements[id];
    assert.ok(['implemented-observed','manual-validation-required','external-validation-required'].includes(item.status),`${id} has invalid status`);
    assert.ok(Array.isArray(item.files)&&item.files.length>0,`${id} needs evidence files`);
    for(const path of item.files) assert.ok(existsSync(resolve(root,path)),`${id} references missing evidence file: ${path}`);
    if(item.status!=='implemented-observed') assert.ok(item.blocker?.trim(),`${id} must explain its blocker`);
  }
});

test('non-code completion blockers remain explicit rather than being silently marked complete',()=>{
  for(const id of ['NFR-002','NFR-003','NFR-004','NFR-007']) assert.notEqual(manifest.requirements[id].status,'implemented-observed');
});
