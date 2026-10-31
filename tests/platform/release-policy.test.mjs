import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pkg=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8'));
const changelog=readFileSync(new URL('../../CHANGELOG.md',import.meta.url),'utf8');
test('package version and changelog follow the release policy',()=>{
  assert.match(pkg.version,/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/);
  assert.match(changelog,new RegExp(`^## ${pkg.version.replace(/\./g,'\\.')}\\s*$`,'m'));
  assert.match(changelog,/^## Unreleased\s*$/m);
});
