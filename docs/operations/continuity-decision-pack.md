# Continuity decision & exercise pack — BaticAmigo

Estado: **pronto para decisão/exercício; sem RPO/RTO inventados**.

## Sistemas críticos
- Vercel / Next.js;
- Firebase Authentication;
- Cloud Firestore;
- Firebase Storage;
- DNS/domínio público;
- GitHub/repositório/CI como dependência de entrega.

## Decisões a aprovar
- serviço/funções críticas:
- owner de continuidade:
- owner técnico de recuperação:
- RPO por dado/serviço:
- RTO por serviço:
- frequência de backup:
- retenção de backup:
- localização/segregação:
- autorização para restauro:
- cadência de exercício:

## Inventário de backup real

Para cada fonte:
- serviço:
- mecanismo:
- identificador/configuração:
- última execução comprovada:
- cobertura:
- cifragem/controlo de acesso:
- retenção:
- owner:
- evidência:

Não contar `snapshotCollections` do Emulator como backup real.

## Exercício de restauro

Usar `docs/operations/continuity-exercise-template.md`.

Ordem:
1. selecionar backup real aprovado;
2. criar destino isolado;
3. registar início/ponto do backup;
4. restaurar;
5. validar integridade/contagens/relações;
6. validar autorização e amostras funcionais;
7. medir ponto recuperado (RPO observado);
8. medir duração (RTO observado);
9. comparar com metas aprovadas;
10. documentar falhas/ações e próxima data.

## Rollback de aplicação

- release SHA:
- deployment anterior elegível:
- compatibilidade de dados verificada:
- procedimento Vercel:
- Rules anteriores identificadas:
- smoke pós-rollback:
- evidência:

Rollback de código não desfaz escritas Firestore e não justifica abrir Rules privadas.

## Critério de saída

BA-BCP-001 só fecha quando:
- RPO/RTO estão aprovados;
- backup real está identificado;
- restauro real isolado foi executado;
- integridade e autorização foram validadas;
- RPO/RTO observados foram registados;
- rollback foi validado;
- owner/reviewer/evidence URL existem para o release.

O ensaio sintético do Emulator é evidência técnica complementar, não substituto.
