import test from 'node:test';
import {execFileSync} from 'node:child_process';
test('server Firebase imports work without experimental require(ESM), as required by deployed functions',()=>{
  execFileSync(process.execPath,['--no-experimental-require-module','-e','require("firebase-admin/auth"); require("firebase-admin/firestore");'],{cwd:process.cwd(),stdio:'pipe'});
});
