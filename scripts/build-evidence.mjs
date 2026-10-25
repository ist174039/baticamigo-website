import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const target=process.argv[2];
if(!target) throw new Error('Evidence output path required.');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const lock=readFileSync(new URL('../package-lock.json',import.meta.url));
const sbomPath=process.env.BATIC_SBOM_PATH||'/tmp/baticamigo-sbom.json';
const sbom=readFileSync(sbomPath);
const firestoreRules=readFileSync(new URL('../firestore.rules',import.meta.url));
const storageRules=readFileSync(new URL('../storage.rules',import.meta.url));
const openapi=readFileSync(new URL('../docs/api/openapi.json',import.meta.url));
const dataModel=readFileSync(new URL('../docs/data-model.json',import.meta.url));
const sha256=value=>createHash('sha256').update(value).digest('hex');
const evidence={
  schemaVersion:1,
  application:pkg.name,
  version:pkg.version,
  commitSha:String(process.env.GITHUB_SHA||'').trim(),
  ref:String(process.env.GITHUB_REF||'').trim(),
  nodeVersion:process.version,
  npmUserAgent:String(process.env.npm_config_user_agent||''),
  packageLockSha256:sha256(lock),
  runtimeSbomSha256:sha256(sbom),
  firestoreRulesSha256:sha256(firestoreRules),
  storageRulesSha256:sha256(storageRules),
  openapiSha256:sha256(openapi),
  dataModelSha256:sha256(dataModel),
  generatedAt:new Date().toISOString(),
  note:'Build evidence only; this is not a signed SLSA provenance attestation.'
};
if(!/^[a-f0-9]{40}$/.test(evidence.commitSha)) throw new Error('GITHUB_SHA is required.');
writeFileSync(target,JSON.stringify(evidence,null,2)+'\n');
console.log('Build evidence written for',evidence.commitSha);
