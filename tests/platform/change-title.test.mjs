import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('change-title checker accepts conventional titles and rejects ambiguous titles',()=>{
  const run=value=>spawnSync(process.execPath,['scripts/check-change-title.mjs',value],{encoding:'utf8'});
  assert.equal(run('feat(platform): complete requirements').status,0);
  assert.notEqual(run('Update things').status,0);
});
