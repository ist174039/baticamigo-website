# BaticAmigo — Playwright E2E, biblioteca documental e painéis laterais

Estado: **implementação em revisão no PR #5; não equivale a aceite de produção**.

## Fontes e precedência
- Requirements, Tasks & Deliverables e Executions & Evidence locais do BaticAmigo no Notion são as fontes canónicas de aceite.
- PR #4 é a release candidata, ainda sem GO.
- PR #5 é um incremento dependente do PR #4. Não fazer merge para main ou deploy a partir deste documento.
- O manual é servido em \`/platform/manual\`, ligado pelo login, pela área reservada e pelo painel administrativo. A origem editável dos passos é \`lib/platform/manual-data.mjs\`.

## Testes atuais
- Unitários: \`tests/platform/document-library.test.mjs\` e \`manual-data.test.mjs\`.
- Browser/E2E: \`e2e/tests/platform.spec.mjs\`. Verificações de acesso anónimo, autenticação e navegação, manual por perfil, pesquisa de módulos, CRUD documental via API, versionamento, herança de leitura, proibição de alterações de leitor, remoção/restauro e contenção do painel lateral em 320 px.
- Workflow: \`.github/workflows/playwright-e2e.yml\`, disparado para pull requests e manualmente. A execução é em \`firebase emulators:exec\` para Auth, Firestore e Storage.
- Os testes usam **somente utilizadores e ficheiros sintéticos**; recusam arrancar se os três emuladores não estiverem configurados nos endereços locais esperados.
- \`NEXT_PUBLIC_E2E_FIREBASE_AUTH_EMULATOR=1\` só é aplicado pelo servidor local de testes e só é aceite na aplicação no browser em modo de desenvolvimento no localhost.

## Critérios de cobertura ainda não satisfeitos
A suite E2E inicial não representa 100% dos 27 requisitos. Antes de usar Playwright como gate final devem ser escritos e executados cenários positivos, negativos e de concorrência para:
1. FR-001–004: recuperação de conta, acesso por perfis, associações familiares, revogação.
2. FR-005–009: criação/reagendamento/recorrência, conflitos e isolamento de presenças.
3. FR-010–011: trabalhos, anexos, mensagens, avisos e estados de notificação.
4. FR-012–015: sócios/finanças, CMS, métricas e exportações.
5. FR-016–020: avaliações, escalas, progressos, síntese, lacunas e revisão humana.
6. NFR-001–007: matriz RBAC/ABAC, privacidade, responsividade, UX, auditoria, arquitetura e restauro.
7. Novos módulos: biblioteca de pastas, subpastas, ACL por conta e perfil, CRUD, histórico, recuperação, acessibilidade, tipos/tamanhos, autorização concorrente.

**Gate de aceitação**: cada cenário deve estar ligado a requisito, caso de teste, execução, SHA final, evidência, responsável e decisão. E2E verde apenas comprova os cenários efetivamente exercitados; não comprova análise jurídica, DPIA, acessibilidade assistiva ou recuperação real.

## Execução local
\`\`\`bash
npm ci
npm install --no-save --ignore-scripts @playwright/test@1.56.1
npx playwright install chromium
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
