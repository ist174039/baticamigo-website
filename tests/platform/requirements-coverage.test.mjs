import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const matrix=readFileSync(new URL('../../docs/requirements-implementation-matrix.md',import.meta.url),'utf8');
const expected=[
  ...Array.from({length:20},(_,index)=>`FR-${String(index+1).padStart(3,'0')}`),
  ...Array.from({length:7},(_,index)=>`NFR-${String(index+1).padStart(3,'0')}`),
];

test('implementation matrix covers every canonical requirement exactly once',()=>{
  for(const id of expected) {
    const count=(matrix.match(new RegExp(`\\| ${id.replace('-','\\-')} \\|`,'g'))||[]).length;
    assert.equal(count,1,`${id} must appear exactly once in the implementation table`);
  }
  const tableIds=[...matrix.matchAll(/\| ((?:N?FR)-\d{3}) \|/g)].map(match=>match[1]);
  assert.equal(tableIds.length,27,'the canonical implementation table must contain 27 requirements');
  assert.deepEqual(new Set(tableIds),new Set(expected));
});

test('completion gates require code, test, evidence and applicable controls',()=>{
  for(const required of [
    'implementação estiver ligada a ficheiros/commit/PR',
    'teste reproduzível',
    'execução estiver ligada ao SHA',
    'controlos/normas aplicáveis',
  ]) assert.match(matrix,new RegExp(required.replace('/','\\/')));
});
