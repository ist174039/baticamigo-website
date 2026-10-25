import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const roots=['app','public/js','public/admin/js'].map(path=>join(root,path));
function files(dir){
  const result=[];
  for(const name of readdirSync(dir)){
    const path=join(dir,name),stat=statSync(path);
    if(stat.isDirectory()) result.push(...files(path));
    else if(/\.(js|mjs|jsx|ts|tsx)$/.test(name)) result.push(path);
  }
  return result;
}
test('application code contains no undeclared advertising/analytics trackers or document cookies',()=>{
  const source=roots.flatMap(files).map(path=>readFileSync(path,'utf8')).join('\n');
  for(const pattern of [
    /googletagmanager\.com/i,/google-analytics\.com/i,/\bgtag\s*\(/i,
    /facebook\.com\/tr/i,/connect\.facebook\.net/i,/\bfbq\s*\(/i,
    /document\.cookie/i
  ]) assert.doesNotMatch(source,pattern);
});
