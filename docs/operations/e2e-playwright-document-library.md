# BaticAmigo — Playwright E2E, biblioteca documental e painéis laterais

Estado: **implementação em revisão no PR #5; não equivale a aceite de produção**.

## Fontes e precedência
- Requirements, Tasks & Deliverables e Executions & Evidence locais do BaticAmigo no Notion são as fontes canónicas de aceite.
- PR #4 é a release candidata, ainda sem GO.
- PR #5 é um incremento dependente do PR #4. Não fazer merge para main ou deploy a partir deste documento.
- O manual é servido em \`/platform/manual\`, ligado pelo login, pela área reservada e pelo painel administrativo. A origem editável dos passos é \`lib/platform/manual-data.mjs\`.

## Testes e cobertura no PR #5

A matriz ativa está em `docs/operations/e2e-coverage-matrix.md`, com rastreabilidade explícita dos **20 requisitos funcionais** e **7 não funcionais**. Os cenários executáveis encontram-se em `e2e/tests/*.spec.mjs`; os testes unitários/de regras continuam no Quality Gate. O workflow `.github/workflows/playwright-e2e.yml` executa todo o conjunto em Chromium e os percursos críticos do browser em Firefox e WebKit.

Os testes usam somente emuladores locais Firebase e dados sintéticos. A execução completa exige `npm ci`, o Playwright instalado e Java 21. A porta local é 3106 (HTTP) e emuladores Auth 9099, Firestore 8080 e Storage 9199.

**Não declarar 100% de aceite** só porque todos os testes E2E passaram. FR-011 mantém decisão de notificações externas/consentimento; FR-014 necessita de testes completos de operações editoriais de publicação; NFR-002 (RGPD/DPIA), NFR-003/004 (validação humana) e NFR-007 (backup/restauro real) requerem evidência e aprovação externa.

## Execução local
\`\`\`bash
npm ci
npm install --no-save --ignore-scripts @playwright/test@1.56.1
npx playwright install chromium firefox webkit
npx --yes firebase-tools@14.22.0 emulators:exec --project baticamigo-c0384 --config firebase.json --only auth,firestore,storage 'npx playwright test'
\`\`\`
São indispensáveis Java 21 e Node 24. Nunca usar contas, chaves, ficheiros ou tokens de produção nos testes. Os ficheiros de rastreio podem conter conteúdo sintético e estão retidos apenas sete dias.

## Biblioteca documental
- API autenticada: \`GET/POST /api/platform/document-library\`.
- Metadados: \`platform_document_folders\` e \`platform_document_items\`; versões imutáveis em \`platform_document_versions\`; bytes privados em Storage \`platform-documents/*\`.
- Operações: criar/renomear/mover/remover pasta vazia; criar/editar/pesquisar/consultar/remover/restaurar documento; carregar nova versão, ver e descarregar versões anteriores; permissões Ver/Editar por papel/conta, com herança de pasta.
- O servidor valida tokens, contas, perfis, pertença, formatos e limite de 4 MB. Não existem ficheiros públicos. A listagem nunca devolve caminhos de Storage.
- A eliminação de documentos é lógica (retention hold): a remoção física definitiva requer política de retenção e decisão autorizada, não está ativa.
- Documentos pedagógicos anteriores continuam acessíveis e não foram migrados automaticamente.

## Padrão de painel lateral
- \`WorkspacePanel\` reutilizável com cabeçalho fixo, scroll apenas no conteúdo e barra inferior de ações fora do scroll.
- Compatível com detalhes, criação, edição e configuração. Desktop até 680/890 px; telemóvel largura total; controlos com largura mínima, wrapping de botões e 44 px de área de toque.
- CSS de contenção também cobre os painéis antigos da área reservada e do CMS, que exigem revisão visual e migração gradual.
- Não declarar acessibilidade WCAG apenas por um teste automático. Requer inspeção com teclado, 200/400% zoom, leitor de ecrã e validação humana.

## Riscos e decisões
- Revisão de ACL e herança de pastas por segurança antes de dados reais.
- Limite inicial de 500 registos nas listagens; paginação/indexação a aprovar para crescimento.
- A pesquisa atual é filtragem dos metadados carregados, não pesquisa full-text do conteúdo dos ficheiros.
- A estrutura é inspirada em bibliotecas documentais com pastas e versões, **não é uma integração com Microsoft Teams/SharePoint**.
- O PR permanece Draft e o lançamento público em NO-GO até fechar os gates canónicos.
