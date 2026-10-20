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

Não foram criados, migrados nem consultados documentos Firebase reais. Não foi executada publicação nem atualização de regras remotas. O produto Firestore existente e a estratégia de backup/restauro continuam por confirmar.

## Rastreabilidade e critérios ainda por decidir

Abrange inicialmente FR-001–009, com implementação parcial por fluxo, e NFR-001, NFR-003, NFR-004, NFR-005 e NFR-006. Esta correspondência é uma interpretação técnica da primeira entrega; não aprova critérios de aceitação da base Requirements. A aprovação do âmbito MVP foi dada pelo responsável, mas papéis, consentimento, retenção, métricas, backup/RPO/RTO e critérios operacionais continuam por validar.

Os requisitos FR-010–020 e NFR-002/NFR-007 não são cobertos integralmente por esta entrega. Comunicação avançada, trabalhos/materiais, website CMS, reporting, avaliações, síntese inteligente, pagamentos, política de backup e eliminação permanecem fora desta fatia inicial.

## Verificação local

- `node --test tests/platform/domain.test.mjs` — 9 casos passaram; cobre validação, âmbito de acesso, conflitos, papéis múltiplos, timestamps e versão de presenças.
- `npm run lint` — passou; mantém um aviso preexistente de fontes em `app/layout.js`.
- `npm run build` — passou; o ambiente não conseguiu obter a folha de estilos remota do Google Fonts e usou o fallback local.
- `git diff --check` — passou.
- Firebase Emulator, regras remotas, integração com tokens reais, acessibilidade manual e fluxos reais de utilizador não foram executados.
