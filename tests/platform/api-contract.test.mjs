import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {dirname,join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const spec=JSON.parse(readFileSync(join(root,'docs/api/openapi.json'),'utf8'));
const server=readFileSync(join(root,'lib/platform/server.js'),'utf8');

function routeFiles(dir){
  const result=[];
  for(const name of readdirSync(dir)){
    const path=join(dir,name);
    if(statSync(path).isDirectory()) result.push(...routeFiles(path));
    else if(name==='route.js') result.push(path);
  }
  return result;
}
function apiPath(file){
  const value=relative(join(root,'app/api'),dirname(file)).split(/[/\\]/).filter(Boolean).join('/');
  return '/api/'+value;
}

test('OpenAPI 3.1 documents every application API route and bearer auth defaults',()=>{
  assert.equal(spec.openapi,'3.1.0');
  assert.equal(spec.info.version,'1.0.0');
  const codePaths=new Set(routeFiles(join(root,'app/api')).map(apiPath));
  const documented=new Set(Object.keys(spec.paths));
  assert.deepEqual(documented,codePaths,'OpenAPI paths must exactly match app/api route files');
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme,'bearer');
  assert.deepEqual(spec.paths['/api/contact'].post.security,[],'public contact endpoint must explicitly opt out of bearer auth');
  assert.deepEqual(spec.paths['/api/public-content'].get.security,[],'public content endpoint must explicitly opt out of bearer auth');
});

test('problem responses follow RFC 9457 while preserving compatibility fields',()=>{
  const problem=spec.components.schemas.Problem;
  assert.deepEqual(new Set(problem.required),new Set(['type','title','status','detail']));
  assert.match(server,/application\/problem\+json/);
  assert.match(server,/type:'about:blank'/);
  assert.match(server,/detail/);
});
