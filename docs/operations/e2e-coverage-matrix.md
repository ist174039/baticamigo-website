# BaticAmigo — matriz E2E por requisito (PR #5)

**Âmbito:** testes executáveis no GitHub Actions exclusivamente contra emuladores Firebase (Auth, Firestore, Storage) com contas, pessoas, documentos e transações sintéticas. O resultado da execução deve ser associado ao SHA exato do PR. Este relatório **não** promove estados no Notion, não prova conformidade legal e não autoriza produção.

## Cobertura funcional automatizada

| Requisito | Percurso E2E e casos negativos | Testes |
|---|---|---|
| FR-001 | Login, token inválido, sessão anónima, conta não verificada, origem e JSON inválidos | `security-users.spec.mjs`, `platform.spec.mjs` |
| FR-002 | RBAC por perfil, administração de contas, suspensão/restauro/eliminação, auto-proteção | `role-access.spec.mjs`, `security-users.spec.mjs` |
| FR-003 | Relação encarregado-aluno, visibilidade restrita, alteração/revogação e associação inválida | `profiles-recurrence.spec.mjs` |
| FR-004 | Tutor, disciplinas, disponibilidade, permissões e associação pedagógica | `profiles-recurrence.spec.mjs`, `sessions-attendance.spec.mjs` |
| FR-005 | CRUD de sessões, edição concorrente, cancelamento e recorrência atravessando mudança DST | `sessions-attendance.spec.mjs`, `profiles-recurrence.spec.mjs` |
| FR-006 | Tutor/aluno/sala, conflitos únicos e repetidos, atomicidade da série | `sessions-attendance.spec.mjs`, `profiles-recurrence.spec.mjs` |
| FR-007 | Presença, versão/conflito, edição não autorizada e justificação | `sessions-attendance.spec.mjs`, `education-records.spec.mjs` |
| FR-008 | Agenda e leitura restrita de presenças/sessões | `sessions-attendance.spec.mjs`, `platform.spec.mjs` |
| FR-009 | Visibilidade apenas do educando, ausência de fuga entre famílias e sócios | `sessions-attendance.spec.mjs`, `education-records.spec.mjs` |
| FR-010 | Trabalhos, materiais e documentos, CRUD, pastas/partilha, MIME, 4 MB, download e versões | `education-records.spec.mjs`, `platform.spec.mjs`, `document-boundaries.spec.mjs`, `browser-journeys.spec.mjs` |
| FR-011 | Mensagens e avisos in-app derivados; não presume entrega de email/push | `education-records.spec.mjs`, `platform.spec.mjs` |
| FR-012 | Estado e histórico de sócio, isolamento de perfis | `profiles-recurrence.spec.mjs` |
| FR-013 | Quotas, pagamentos, limites, privacidade do membro e doador anónimo | `finance.spec.mjs` |
| FR-014 | Superfície pública do CMS, campos allowlist, bloqueio de coleções privadas, entrada administrativa | `cms-reporting.spec.mjs` e regras Firestore no Quality Gate |
| FR-015 | Métricas do dashboard, filtros e exportação CSV agregada | `cms-reporting.spec.mjs`, `platform.spec.mjs` |
| FR-016 | Avaliações quantitativas, qualitativas, por disciplina e período | `education-records.spec.mjs`, `progress-audit.spec.mjs` |
| FR-017 | Evolução longitudinal, comparação entre avaliações e filtro por pessoa | `progress-audit.spec.mjs` |
| FR-018 | Relatório agregador, supressão de grupos com menos de cinco e não divulgação de identificadores no CSV | `cms-reporting.spec.mjs` |
| FR-019 | Escalas e origem preservadas em histórico e API; nota inválida rejeitada | `education-records.spec.mjs`, `progress-audit.spec.mjs` |
| FR-020 | Síntese determinística, evolução comparável e evidências individuais rastreáveis; sem prognóstico | `progress-audit.spec.mjs` |

Todos os ficheiros encontram-se em `e2e/tests/`.

## Cobertura não funcional e limites

| Requisito | Evidência automatizada | Controlo que exige aceitação externa |
|---|---|---|
| NFR-001 | RBAC, acesso anónimo, ACL, Storage sem acesso SDK, leitura/versão e operações negativas; `public-rules-test.mjs` | Revisão independente de Rules/IAM e matriz de risco |
| NFR-002 | Não exibir dados de alunos/familiares, autorizações, canários de CMS, minimização de audit e relatório | Base legal, finalidades, retenção, direitos, eventual DPIA |
| NFR-003 | Formulários e painéis a 320/375/768/1440 px, fuga horizontal e interação; Chromium/Firefox/WebKit | Revisão de zoom 200/400%, tecnologias assistivas e dispositivos reais |
| NFR-004 | Formulários, navegação, manual, pesquisas, Escape e tarefas críticas | Testes presenciais com representantes dos perfis |
| NFR-005 | Registo de audit com ator, alvo e timestamp após transação real; ausência de nomes/emails sensíveis | Política de retenção, classificação e revisão de acessos aos logs |
| NFR-006 | Quality Gate com regras de arquitetura, contrato API, separação de camadas e build | Revisão humana de design e dependências |
| NFR-007 | Testes de integridade e scripts de preparação no Quality Gate | Backup real, política/RPO/RTO aprovados e ensaio de restauro documentado |

## Aceitação e bloqueios

- **Técnico:** Quality Gate e Playwright devem passar no **mesmo HEAD**; sem flaky tests ocultos, sem testes `skip` injustificados.
- **Segurança:** todos os testes em `firebase emulators:exec`; nenhum cliente, menor ou documento real; nunca desligar a validação de origem em produção.
- **Operação:** ambiente staging segregado, versionamento, migração de documentação histórica, paginação além de 500 elementos e retenção definitiva ainda exigem decisão/evidência.
- **Gestão:** responsável, prazo confirmado, critério de aceitação e evidência a reconciliar na base canónica Tasks & Deliverables; não marcar requisitos como Verificado sem comprovação de todos os critérios.
- **Produção:** PR #5 Draft e release **NO-GO** até cumprimento dos gates e decisão competente.

**Nota de integridade:** uma coluna com teste associado indica cobertura de um subconjunto do requisito; não demonstra exaustividade de todas as combinações de dados/roles/estados, nem substitui avaliação jurídica ou humana.
