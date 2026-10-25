import {readFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const changelog=readFileSync(new URL('../CHANGELOG.md',import.meta.url),'utf8');
if(!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(pkg.version)) throw new Error('package.json version must be valid SemVer.');
if(!changelog.includes(`## ${pkg.version}`)) throw new Error(`CHANGELOG.md must contain the current version ${pkg.version}.`);
if(!changelog.includes('## Unreleased')) throw new Error('CHANGELOG.md must contain an Unreleased section.');
console.log(`Release policy OK for ${pkg.version}.`);
