# Integração na main — 31 de outubro de 2026

## Decisão de integração

O pedido explícito do responsável pela operação autorizou a integração do conteúdo dos PRs #5 e #4 na `main`, apesar dos bloqueios de prontidão para produção. A autorização de integração de código **não valida por si só** conformidade, privacidade, segurança de produção, acessibilidade humana, restauro real ou uma decisão formal de GO operacional.

## Evidência do GitHub

- PR #5 — `feature/document-library-manual-playwright-panels-20261031` para `release/market-readiness-2026-10-25`: merge `f4953c0f40d0cd5802db29466255ec32127d0cfc`.
- PR #4 — `release/market-readiness-2026-10-25` para `main`: merge `59d358e58ab7efec6189822d88ccc7b2675f32bd`.
- O Quality Gate da release passou no commit `f4953c0f40d0cd5802db29466255ec32127d0cfc`: https://github.com/ist174039/baticamigo-website/actions/runs/41249343295
- Playwright E2E da release passou no mesmo commit, abrangendo Chromium, Firefox e WebKit: https://github.com/ist174039/baticamigo-website/actions/runs/41249343337
- O Quality Gate do primeiro commit de merge em `main` falhou **apenas na validação do título do commit de merge**, por não respeitar Conventional Commits: https://github.com/ist174039/baticamigo-website/actions/runs/41249639474. Este registo acompanha o novo commit de formato correto, sem reescrever o histórico nem desativar a política.

## Controlo de publicação

A Vercel associa os deployments de produção à branch `main`. A presença de código nesta branch não comprova que o novo commit tenha sido publicado, validado em staging ou promovido para o domínio institucional.

As evidências de readiness, incluindo revisão independente de ACL/privacidade, DPIA e retenção, testes manuais WCAG/UX, backup/restauro real, staging e decisão humana documentada, continuam pendentes nos documentos canónicos. Não marcar critérios como concluídos sem evidência. Não carregar dados reais de sócios, famílias ou menores em testes ou artefactos.

## Resultado

Integração de código realizada. Estado de produção **não deve ser declarado GO** com base apenas no merge e nos testes automáticos.

## Fecho dos PRs em 1 de novembro de 2026

- PR #2: integração de isolamento de presenças já incluída em `main`.
- PR #3: documentação residual e modelo de market-readiness reconciliados com a versão atual, evitando sobrescrever o código da aplicação; merge `421a22484c8118a4b4e35e6eb0cb28e4aa06df8c`.
- PRs #4 e #5: integrados anteriormente; no fim desta passagem o GitHub reportou 0 PRs abertos.
- O relatório `docs/operations/market-readiness-checkpoint.json` é **histórico** e não deve ser usado como avaliação de readiness atual.
- O Quality Gate do PR #3 passou no SHA `9ab9f2c6966b348c9268cfbbae6cc99ac6d9cc05`: https://github.com/ist174039/baticamigo-website/actions/runs/41256153150
- O primeiro Quality Gate do merge em `main` falhou na validação do título porque a mensagem do merge tinha várias linhas; este commit documental de seguimento usa Conventional Commits numa única linha e tem de ser verificado no próprio SHA.

O merge do código não altera os blockers do GO de produção: privacidade, Rules/IAM reais, continuidade e restauro, staging, domínio/hosting, revisão humana e aprovação competente continuam a exigir provas e decisões.
