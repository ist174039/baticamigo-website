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
