import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const protocol=readFileSync(new URL('../../docs/operations/usability-validation-protocol.md',import.meta.url),'utf8');

test('usability protocol covers every operational profile and critical privacy flows',()=>{
  for(const profile of ['aluno','encarregado','explicador/voluntário','sócio','coordenação/admin']) assert.ok(protocol.toLowerCase().includes(profile));
  for(const phrase of ['outra família','segurança/privacidade','ação destrutiva','retestados']) assert.ok(protocol.toLowerCase().includes(phrase.toLowerCase()));
});

test('usability protocol never treats heuristic review as representative-user evidence',()=>{
  assert.match(protocol,/não substitui utilizadores representativos/i);
  assert.match(protocol,/não executado/i);
  assert.match(protocol,/Não carregar gravações, nomes, emails ou imagens identificáveis de menores/i);
});
