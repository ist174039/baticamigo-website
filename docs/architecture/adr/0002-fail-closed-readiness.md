# ADR 0002 — Production readiness fail-closed

## Estado
Aceite tecnicamente.

## Contexto
CI verde não prova decisões jurídicas, backup real, acessibilidade manual ou IAM de produção.

## Decisão
O comando `npm run check:production-readiness` falha enquanto evidências obrigatórias não forem explicitamente fornecidas.

## Consequências
- ausência de evidência bloqueia GO;
- aprovações humanas não são inferidas;
- release precisa de rastreabilidade além do código.
