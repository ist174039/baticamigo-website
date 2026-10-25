import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

for(const path of ['app/components/LegacyFirebaseScripts.js','app/admin/components/AdminFirebaseScripts.js']){
  test(`${path} does not log raw error objects`,()=>{
    const source=readFileSync(new URL('../../'+path,import.meta.url),'utf8');
    assert.equal(/console\.error\([^\n]*,\s*error\s*\)/.test(source),false);
    assert.equal(/console\.log\(/.test(source),false);
  });
}
