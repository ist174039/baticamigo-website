# Política de proteção de main e merge

Estado: **política proposta e testável; configuração GitHub real por validar**.

Observação 25/10/2026:
- a API de repository rulesets devolveu lista vazia;
- a leitura de branch protection de `main` devolveu 403 à integração, portanto o estado de proteção nativa não pode ser confirmado;
- PR #4 permanece draft e não foi merged.

## Configuração mínima antes de GO

Para `main`:
- exigir pull request;
- bloquear push direto, exceto break-glass explicitamente aprovado;
- exigir pelo menos uma revisão humana competente;
- exigir resolução de conversas;
- exigir Quality Gate no SHA final;
- impedir merge com branch desatualizada quando isso comprometer evidência;
- preferir commits/merge strategy coerente com rastreabilidade;
- impedir force-push e delete de `main`;
- restringir bypass a contas/roles break-glass documentadas;
- manter proteção mesmo para administradores, salvo processo de emergência aprovado.

## Quality Gate requerido

O workflow versionado deve incluir:
- install reproduzível;
- secret scan;
- dependency audit;
- release/SBOM;
- unit tests + lint;
- Firebase integration/Rules;
- build;
- build evidence;
- production smoke;
- axe.

A configuração GitHub deve referenciar o **nome real do check** observado no PR, não um nome inventado.

## Critério de saída

Antes de merge:
1. responsável técnico confirma configuração real;
2. captura/evidência de branch/ruleset settings;
3. PR #4 tem review humano;
4. check requerido passa no SHA final;
5. bypasses e exceções são documentados;
6. evidência é ligada a BA-RC-001.

Este documento não prova que branch protection esteja configurada.
