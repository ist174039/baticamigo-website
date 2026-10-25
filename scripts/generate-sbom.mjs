import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function productionComponents(lock) {
  const seen=new Map();
  for(const [path,value] of Object.entries(lock.packages||{})) {
    if(!path.startsWith('node_modules/')||value.dev===true||!value.version) continue;
    const name=path.split('node_modules/').pop();
    if(!name) continue;
    const key=`${name}@${value.version}`;
    if(!seen.has(key)) seen.set(key,{
      type:'library',
      name,
      version:value.version,
      purl:`pkg:npm/${encodeURIComponent(name)}@${encodeURIComponent(value.version)}`,
      ...(value.license?{licenses:[{license:{name:String(value.license)}}]}:{}),
      ...(value.integrity?{hashes:[{alg:'SHA-512',content:String(value.integrity).replace(/^sha512-/,'')}]}:{}),
    });
  }
  return [...seen.values()].sort((a,b)=>a.name.localeCompare(b.name)||a.version.localeCompare(b.version));
}

export function cyclonedxFromLock(lock) {
  const root=lock.packages?.['']||{};
  return {
    bomFormat:'CycloneDX',
    specVersion:'1.6',
    version:1,
    metadata:{component:{type:'application',name:lock.name||root.name||'baticamigo-website',version:lock.version||root.version||'0.0.0'}},
    components:productionComponents(lock),
  };
}

if(import.meta.url===pathToFileURL(process.argv[1]).href) {
  const target=process.argv[2];
  if(!target) throw new Error('SBOM output path required.');
  const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url),'utf8'));
  const bom=cyclonedxFromLock(lock);
  if(!bom.components.length) throw new Error('No production components found.');
  writeFileSync(target,JSON.stringify(bom,null,2)+'\n');
  console.log(`CycloneDX SBOM generated with ${bom.components.length} runtime components.`);
}
