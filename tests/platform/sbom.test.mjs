import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cyclonedxFromLock,productionComponents} from '../../scripts/generate-sbom.mjs';

const lock=JSON.parse(readFileSync(new URL('../../package-lock.json',import.meta.url),'utf8'));
test('SBOM generator includes runtime dependencies and excludes dev-only packages',()=>{
  const components=productionComponents(lock);
  const names=new Set(components.map(item=>item.name));
  for(const name of ['next','react','firebase','firebase-admin']) assert.ok(names.has(name),`missing ${name}`);
  assert.equal(components.some(item=>item.name==='eslint'),false);
  const bom=cyclonedxFromLock(lock);
  assert.equal(bom.bomFormat,'CycloneDX');
  assert.equal(bom.specVersion,'1.6');
});
