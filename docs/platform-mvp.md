# BaticAmigo — área de apoio escolar (MVP)

Implementação inicial da evolução digital descrita no Notion. Website público mantido. Referências: [Project Initialization](https://app.notion.com/p/19cbe9392b6082dc8697014c91500d20), [Requirements](https://app.notion.com/p/87bbe9392b608284864101b73aa81931), [07 — Normas e Boas Práticas](https://app.notion.com/p/a9fbe9392b6083b19aab814ba048739a).

## O que esta entrega implementa

- Nova área em `/area`, com autenticação Firebase, recuperação de palavra-passe e persistência da sessão apenas no browser atual.
- Contas com múltiplos perfis e papéis; atribuição inicial de acesso por administrador a contas que já existam no Firebase Authentication.
- Perfis de aluno, encarregado e explicador/voluntário; ligações entre alunos e encarregados.
- Criação, alteração, cancelamento e consulta de sessões; conflitos de explicador, aluno e sala são recusados.
- Registo de presença pelo explicador atribuído após o início da sessão; coordenação e administração podem registar/corrigir. Atualizações concorrentes de sessão e presença são recusadas se usarem uma versão antiga.
- Registo de auditoria de operações de escrita.
- Proteção da API por token Firebase validado no servidor, incluindo revogação. A autorização e a seleção de dados ocorrem no servidor.

A interface não cria contas Firebase. Um administrador deve criar ou convidar a conta no processo administrativo existente e depois associar o UID a perfis/papéis na área. Não há aplicação cliente que possa atribuir os próprios papéis.

## Contrato de dados proposto

As novas coleções Firestore têm prefixo `platform_` e são acedidas pelo Admin SDK no servidor:

- `platform_accounts/{authUid}`: `roles[]`, `profileIds[]`, `active` (com `role` e `profileId` de compatibilidade para contas antigas).
- `platform_profiles/{profileId}`: `kind` (`student`, `guardian` ou `tutor`), nome, email opcional, encarregados associados e estado ativo.
- `platform_sessions/{sessionId}`: título/disciplina, explicador, alunos, sala, intervalo ISO-8601, estado e versão.
- `platform_attendance/{sessionId:studentId}`: sessão, aluno, estado e versão.
- `platform_audit/{eventId}`: ator, operação, alvo e hora de servidor.
- `platform_locks/{schedule|accounts}`: serialização de alterações concorrentes de horário e associação de perfis.

Papéis operacionais `student`, `guardian`, `tutor` e `volunteer` exigem perfis correspondentes. Um perfil de explicador pode ser ligado ao papel `volunteer`. `member`, `coordinator` e `admin` não requerem perfil pedagógico. Apenas `admin` atribui papéis; `admin` e `coordinator` gerem perfis e sessões. Encarregados consultam alunos explicitamente associados. Explicadores e voluntários consultam apenas as suas sessões e alunos nessas sessões. Alunos consultam os próprios horários e presenças.

## Configuração e rollout

1. Configurar `FIREBASE_SERVICE_ACCOUNT_JSON` no ambiente de servidor com uma conta de serviço do projeto `baticamigo-c0384`. A rota falha fechada sem credencial válida. Nunca usar essa chave no browser.
2. Confirmar a conta administrativa e o papel Firebase já usados pelo painel existente. O bootstrap legado requer agora email verificado.
3. Rever as regras Firestore atualmente publicadas na consola. Este repositório não contém `firebase.json`, `.firebaserc`, `firestore.rules` nem `storage.rules`; as regras remotas não foram lidas. O Admin SDK ignora regras Firestore, por isso elas não substituem a autorização implementada na API. As novas coleções não devem ser acessíveis por clientes Firebase diretos.
4. Fazer primeiro uma validação de staging com contas de cada papel, incluindo tentativas negativas para alunos não associados, encarregados não associados, explicadores de outras sessões, conta inativa, versão antiga e conflitos de horário.
5. Confirmar privacidade e retenção de dados de menores com o responsável antes de carregar dados reais. Começar com dados de teste sem informação pessoal.

Não foram criados, migrados nem consultados documentos Firebase reais. O produto Firestore existente e a estratégia de backup/restauro continuam por confirmar.

## Rastreabilidade e critérios ainda por decidir

Abrange inicialmente FR-001–009, com implementação parcial por fluxo, e NFR-001, NFR-003, NFR-004, NFR-005 e NFR-006. Esta correspondência é uma interpretação técnica da primeira entrega; não aprova critérios de aceitação da base Requirements. A aprovação do âmbito MVP foi dada pelo responsável, mas papéis, consentimento, retenção, métricas, backup/RPO/RTO e critérios operacionais continuam por validar.

Os requisitos FR-010–020 e NFR-002/NFR-007 não são cobertos integralmente por esta entrega. Comunicação avançada, trabalhos/materiais, website CMS, reporting, avaliações, síntese inteligente, pagamentos, política de backup e eliminação permanecem fora desta fatia inicial.

## Verificação local

- `node --test tests/platform/domain.test.mjs` — 9 casos passaram; cobre validação, âmbito de acesso, conflitos, papéis múltiplos, timestamps e versão de presenças.
- `npm run lint` — passou; mantém um aviso preexistente de fontes em `app/layout.js`.
- `npm run build` — passou; o ambiente não conseguiu obter a folha de estilos remota do Google Fonts e usou o fallback local.
- `git diff --check` — passou.
- Firebase Emulator, regras remotas, integração com tokens reais, acessibilidade manual e fluxos reais de utilizador não foram executados.

## Melhorias da área e validação temporal

- A área privada reutiliza a paleta verde-floresta/verde-lima, fundo neutro e tipografia do website público; mantém estados de foco visíveis e adapta os formulários a ecrãs pequenos.
- Horários introduzidos e editados usam explicitamente `Europe/Lisbon`, mesmo quando o dispositivo está configurado noutro fuso. Uma hora local inexistente na mudança de primavera é recusada; uma hora repetida na mudança de outono escolhe a primeira ocorrência de forma determinística.
- A associação de perfis a contas é mantida na mesma transação que altera permissões. Perfis removidos perdem o vínculo correspondente e a edição normal de perfil preserva o vínculo; `save-profile` não aceita atribuir `accountUid` diretamente.
- Os testes `tests/platform/time.test.mjs` cobrem inverno, verão e mudanças de hora. A cobertura de handlers Firebase, Rules e fluxos por papel permanece pendente.

## Publicação

A versão base `5a9b233` foi publicada na Vercel como produção em 20/10/2026 e verificada com HTTP 200 no website e em `/area`. Esta publicação não altera nem comprova regras Firestore/Storage, políticas de retenção ou backup. As melhorias descritas acima só se consideram publicadas depois do respetivo commit e da confirmação de estado `READY` na Vercel.

## Remodelação e extensão não financeira — 20/10/2026

Pedido: usar a área admin como referência de composição, cartões, cores e tipografia e ampliar os requisitos sem pagamentos/quotas.

Implementado no código: dashboard e navegação por papel; filtros e pesquisa; pessoas, alunos/encarregados/explicadores e sócios; situação/histórico associativo; competências e disponibilidade; trabalhos, materiais/documentos por aluno; mensagens e avisos in-app; submissão de justificação pelo encarregado; avaliações numéricas ou qualitativas com disciplina, periodicidade, data, origem e escala; evolução descritiva com evidências e lacunas; relatório de cobertura por ano, faixa etária, explicador e associação, filtros e CSV. O resumo é determinístico, sem LLM, previsão ou diagnóstico. Upload binário e chat em tempo real não são implementados; materiais podem ser texto/ligação HTTPS, com controlo de acesso externo próprio. Avisos apresentam a situação atual; não incluem email/push ou contagem de não lidas.

Pagamentos, quotas e dados financeiros excluídos pelo responsável. Requisitos locais continuam sem declaração de aceitação integral: os critérios de política/operação não foram inventados. Backup/restore, retenção, base legal e Rules/IAM remotos requerem validação.

Validação técnica: testes de domínio/permissões/escalas/tempo/XSS; lint e build; auditoria de dependências de produção sem vulnerabilidades conhecidas após atualização para Next 15.5.28, Firebase 13.0.0 e Admin SDK 13.10.0 (fixado para compatibilidade CommonJS na Vercel), com overrides revistos de PostCSS e gRPC. Os loaders do home/admin passaram de Firebase 8.10 para a API compat 13.0.0; a auditoria npm não é auditoria da distribuição CDN nem substitui validação funcional em browser.

Para reproduzir a integração local: usar Java 21, Node 22+ e executar `npx firebase-tools@14.22.0 emulators:exec --project baticamigo-c0384 --config tests/emulators/firebase.json --only auth,firestore 'node scripts/integration-test.mjs'`. O harness recusa hosts não locais, gera credencial sintética efémera e cria apenas dados de teste nos emuladores. Não usar credenciais reais nem exportar dados para produção. A política de teste nega acessos de clientes; não é uma substituição das regras remotas do website/admin.

Revisão de UI/UX e limites em docs/operations/ui-ux-review.md. Avaliação de normas em docs/security/controls-assessment.md; a base local Standards & Controls no Notion contém aplicação, evidência e lacunas por controlo. Não há declaração de certificação nem validação humana de experiência visual.

A verificação de produção encontrou incompatibilidade de carregamento ESM no Admin SDK 14.5.0, ausente em dev local. Corrigida fixando 13.10.0 e acrescentando teste de importação com require(ESM) experimental desativado. A publicação só se considera validada após smoke HTTP na versão corrigida.
