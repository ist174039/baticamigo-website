import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const map=readFileSync(new URL('../../docs/security/portugal-privacy-legal-map.md',import.meta.url),'utf8');

test('privacy legal map does not treat consent or age 13 as universal rules',()=>{
  assert.match(map,/Não assumir consentimento como base universal/);
  assert.match(map,/oferta direta de serviços da sociedade da informação/);
  assert.match(map,/não significa/i);
  assert.match(map,/todo o tratamento de menores dependa de consentimento/);
});

test('privacy legal map points to official EU, Portuguese and CNPD sources',()=>{
  assert.match(map,/eur-lex\.europa\.eu/);
  assert.match(map,/files\.dre\.pt/);
  assert.match(map,/cnpd\.pt/);
  assert.match(map,/AIPD \/ DPIA/);
});
