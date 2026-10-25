import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('build evidence script is explicitly non-attestation and hashes lockfile/SBOM',()=>{
  const source=readFileSync(new URL('../../scripts/build-evidence.mjs',import.meta.url),'utf8');
  assert.match(source,/packageLockSha256/);
  assert.match(source,/runtimeSbomSha256/);
  assert.match(source,/not a signed SLSA provenance attestation/);
  assert.match(source,/GITHUB_SHA/);
});
