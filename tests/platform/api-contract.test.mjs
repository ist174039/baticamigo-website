import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const spec=JSON.parse(readFileSync(new URL('../../docs/api/openapi.json',import.meta.url),'utf8'));
const server=readFileSync(new URL('../../lib/platform/server.js',import.meta.url),'utf8');

test('OpenAPI 3.1 documents the private platform endpoints and bearer auth',()=>{
  assert.equal(spec.openapi,'3.1.0');
  assert.equal(spec.info.version,'1.0.0');
  for(const path of ['/api/platform','/api/platform/finance']) assert.ok(spec.paths[path],`missing ${path}`);
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme,'bearer');
});

test('error responses implement RFC 9457 while preserving compatibility detail',()=>{
  const problem=spec.components.schemas.Problem;
  assert.deepEqual(new Set(problem.required),new Set(['type','title','status','detail']));
  assert.match(server,/application\/problem\+json/);
  assert.match(server,/type:'about:blank'/);
  assert.match(server,/detail/);
});
