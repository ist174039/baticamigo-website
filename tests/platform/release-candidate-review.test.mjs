import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const review=readFileSync(new URL('../../docs/operations/release-candidate-review.md',import.meta.url),'utf8');

test('release review documents breaking boundaries and safe deployment order',()=>{
  for(const phrase of [
    '/api/public-content','/api/contact','platform_*','Node.js 24',
    'implantar código/API','implantar Firestore/Storage Rules','Rollback de Rules'
  ]) assert.ok(review.includes(phrase),phrase);
});

test('release review does not authorize merge or invent a semantic version',()=>{
  assert.match(review,/não aprovado para merge\/produção/i);
  assert.match(review,/Não atribuir automaticamente 2\.0\.0\/1\.1\.0/);
  assert.match(review,/decisão GO\/merge por responsável competente/i);
});
