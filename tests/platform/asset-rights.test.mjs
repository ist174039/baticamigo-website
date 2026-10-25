import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join,relative,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateAssetRights} from '../../lib/platform/asset-rights.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const manifest=JSON.parse(readFileSync(join(root,'docs/asset-rights.json'),'utf8'));

function mediaFiles(dir){
  const out=[];
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    const stat=statSync(path);
    if(stat.isDirectory()) out.push(...mediaFiles(path));
    else if(/\.(png|jpe?g|webp|gif|svg|mp4|webm)$/i.test(name)) out.push(relative(root,path).replaceAll('\\','/'));
  }
  return out;
}
test('every repository public media asset is present in the rights manifest',()=>{
  const actual=mediaFiles(join(root,'public')).sort();
  const listed=manifest.assets.map(item=>item.path).filter(path=>path.startsWith('public/')).sort();
  assert.deepEqual(listed,actual);
});
test('asset rights remain fail-closed until provenance/ownership evidence is approved',()=>{
  const result=validateAssetRights(manifest);
  assert.equal(result.ready,false);
  assert.deepEqual(new Set(result.pending),new Set(['public/images/african-pattern.png','public/images/logo.png']));
  assert.throws(()=>validateAssetRights({schemaVersion:1,assets:[{path:'x.png',rightsStatus:'approved'}]}),/source/);
});
