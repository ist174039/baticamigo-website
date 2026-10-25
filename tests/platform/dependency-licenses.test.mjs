import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dependencyLicenseStatus} from '../../lib/platform/dependency-licenses.mjs';

const lock=JSON.parse(readFileSync(new URL('../../package-lock.json',import.meta.url),'utf8'));
const exceptions=JSON.parse(readFileSync(new URL('../../docs/dependency-license-exceptions.json',import.meta.url),'utf8'));

test('every runtime package missing lockfile license metadata is explicitly documented',()=>{
  const missing=[];
  for(const [path,pkg] of Object.entries(lock.packages||{})){
    if(!path.startsWith('node_modules/')||pkg.dev===true) continue;
    if(!pkg.license) missing.push(`${path.replace(/^node_modules\//,'')}@${pkg.version}`);
  }
  const documented=exceptions.exceptions.map(item=>`${item.package}@${item.version}`).sort();
  assert.deepEqual(missing.sort(),documented);
});

test('dependency license review remains fail-closed until exceptions are approved',()=>{
  const status=dependencyLicenseStatus(exceptions);
  assert.equal(status.ready,false);
  assert.deepEqual(status.pending,['limiter@1.1.5']);
});
