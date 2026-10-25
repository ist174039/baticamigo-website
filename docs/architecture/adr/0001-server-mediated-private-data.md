# ADR 0001 — Dados privados mediados pelo servidor

## Estado
Aceite tecnicamente no PR de conclusão; aprovação de produção depende do readiness.

## Contexto
A plataforma contém dados pessoais e dados de menores. Autorizar apenas no cliente permitiria bypass.

## Decisão
Todas as operações privadas passam por APIs Next.js autenticadas com Firebase ID tokens. Firestore e Storage negam acesso direto do browser por Rules; Admin SDK é controlado por IAM.

## Consequências
- autorização centralizada por papel/relação/objeto;
- Rules simples e fail-closed;
- maior responsabilidade da API e IAM;
- testes de integração obrigatórios.
