# Plano de staging/preview seguro

Estado: **pronto para configuração; ambiente não criado**.

Objetivo: validar a release candidate num ambiente hospedado sem usar dados pessoais reais nem reutilizar credenciais privilegiadas de produção.

## Princípios

- nunca copiar `FIREBASE_SERVICE_ACCOUNT_JSON` de production para preview;
- preferir projeto Firebase não-produção dedicado ou identidade/service account separada com mínimo privilégio;
- usar apenas dados sintéticos e contas de teste;
- admins de preview devem ser uma allowlist própria e mínima;
- não colocar emails, tokens, service-account JSON ou dados pessoais neste repositório/Notion/CI;
- preview deve permanecer protegido e não indexável.

## Configuração Vercel alvo

Branch: `release/market-readiness-2026-10-25`.

Variáveis necessárias no target preview:
- `FIREBASE_SERVICE_ACCOUNT_JSON` — valor **não-produção**, sensitive;
- `FIREBASE_ADMIN_EMAILS` — allowlist de teste separada, sem reutilizar contactos desnecessários de produção.

Não adicionar valores de production por conveniência.

## Firebase não-produção

Antes de criar credenciais:
1. confirmar owner técnico;
2. escolher projeto não-produção/isolado;
3. aplicar Firestore/Storage Rules do SHA candidato;
4. criar service account apenas com permissões necessárias;
5. criar contas/perfis sintéticos;
6. registar identificador do ambiente e data de expiração/rotação.

## Validação

No preview do SHA candidato:
- homepage e conteúdo público;
- contacto com dados sintéticos;
- login e seleção de perfil;
- matriz de acesso por papel/relação;
- sessões/presenças;
- ficheiros;
- sócios/finanças com dados sintéticos;
- CMS;
- headers/CSP/no-store/noindex;
- logs/runtime errors;
- axe + matriz manual aplicável.

## Limpeza

Após o ciclo:
- remover/expirar contas sintéticas;
- remover dados sintéticos;
- revogar/rodar credencial de staging conforme política;
- remover env vars branch-scoped quando a branch deixar de existir;
- preservar apenas evidência sem PII.

## Critério de saída

BA-ENV-001 só pode fechar quando:
- preview existe para o SHA avaliado;
- configuração é isolada de production;
- dados são sintéticos;
- runtime smoke e fluxos autenticados passam;
- owner/reviewer/evidence URL existem;
- mecanismo de cleanup/rotação está registado.
