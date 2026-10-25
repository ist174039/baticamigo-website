# BaticAmigo — matriz de implementação dos requisitos

Fonte canónica: Notion Requirements (27 requisitos: FR-001..FR-020 e NFR-001..NFR-007).
Release candidate atual: `release/market-readiness-2026-10-25`, PR #4 diretamente contra `main`. O SHA exato deve ser o HEAD verde do PR; não usar esta linha como prova de um SHA específico.

Esta matriz não substitui o aceite no Notion. "Observado" significa que existe implementação no repositório; "validar" significa que os critérios de aceitação ainda precisam de evidência específica antes de declarar Verificado.

| ID | Estado técnico observado | Implementação / evidência a fechar |
|---|---|---|
| FR-001 | Implementado observado | Login canónico, sessão e redirects; manter E2E autenticado como gate final. |
| FR-002 | Implementado observado | Multi-role e destinos por perfil; validar matriz completa por papel. |
| FR-003 | Implementado observado; validar | Perfis student/guardian e relações `guardianIds`; completar testes de ciclo de vida/revogação. |
| FR-004 | Implementado observado; validar | Perfis tutor/volunteer, disciplinas e disponibilidade; completar aceite de campos/estados. |
| FR-005 | Implementado observado; validar | Criar/editar/cancelar/recorrência de sessões; completar E2E de reagendamento. |
| FR-006 | Implementado observado; validar | Associação aluno/tutor e conflitos de aluno, tutor e sala. |
| FR-007 | Implementado observado; validar | Presença/falta/justificação/cancelamento e auditoria; fechar fluxos de correção. |
| FR-008 | Implementado observado; validar | Consulta de agenda e assiduidade do próprio aluno. |
| FR-009 | Implementado observado; validar | Encarregado limitado aos educandos associados; há teste de isolamento. |
| FR-010 | Implementado observado; validar | Trabalhos, materiais, documentos, URL HTTPS e uploads; validar retenção/partilha. |
| FR-011 | Parcial observado | Mensagens existem; fechar notificações, preferências/estados e política de retenção. |
| FR-012 | Implementado observado; validar | Sócios, estados e histórico associativo. |
| FR-013 | Implementado observado; validar | Quotas, pagamentos, estados, histórico, concorrência e auditoria no módulo financeiro. |
| FR-014 | Implementação existente a reconciliar | CMS/admin do website existe; mapear tipos de conteúdo, rascunho/publicação e regressões. |
| FR-015 | Implementação existente a reconciliar | Dashboards/indicadores e exportação existem na área; fechar catálogo de métricas/filtros. |
| FR-016 | Implementado observado; validar | Avaliações por aluno/disciplina/período, qualitativas ou quantitativas. |
| FR-017 | Implementado observado; validar | `progressSummary`, evolução temporal/lacunas; fechar critérios de cobertura. |
| FR-018 | Implementação existente a reconciliar | Reporting agregado existe; validar grupos pequenos, denominadores e privacidade. |
| FR-019 | Implementado observado; validar | Nota, escala, origem, período e data preservados; sem conversão implícita. |
| FR-020 | Implementado observado; validar | Síntese determinística e explicável, com IDs de evidência e revisão humana; validar cobertura insuficiente. |
| NFR-001 | Implementado observado | Autorização server-side e least privilege; manter testes negativos e revisão de Rules/IAM. |
| NFR-002 | Parcial / decisão externa | Minimização e ACL técnicas existem; base legal, finalidades, retenção, direitos e DPIA dependem de decisão competente. |
| NFR-003 | Parcial | CSS responsivo existe; falta validação documentada em browsers/viewport/zoom. |
| NFR-004 | Parcial | Melhorias de UX existem; falta validação com tarefas críticas e representantes dos perfis. |
| NFR-005 | Implementado observado; validar | `platform_audit` regista ator, ação, alvo e timestamp; fechar catálogo, retenção e acesso. |
| NFR-006 | Implementado observado; validar | Domínio/API/UI separados em módulos; adicionar gate de arquitetura/acoplamento. |
| NFR-007 | Bloqueado por decisão/operação | Runbook existe; falta política aprovada, RPO/RTO, backup configurado e teste de restauro. |

## Estado da documentação estruturada — 25/10/2026

Os 27 requisitos no Notion têm critérios de aceitação preenchidos, arquitetura/tarefa/teste/evidência relacionados. Este documento descreve implementação observada e não promove automaticamente o estado canónico dos requisitos.

## Gates de conclusão

Um requisito só pode ser promovido para Verificado quando:
1. o critério de aceitação do Notion estiver explícito e não for apenas hipótese;
2. a implementação estiver ligada a ficheiros/commit/PR;
3. existir teste reproduzível apropriado;
4. a execução estiver ligada ao SHA avaliado;
5. controlos/normas aplicáveis não tiverem lacuna impeditiva;
6. decisões humanas/legais necessárias estiverem confirmadas.

## Ordem de execução

1. Segurança e privacidade: NFR-001/NFR-002 + FR-005/006/007/008/009.
2. Perfis e identidade: FR-001/002/003/004/012.
3. Aprendizagem: FR-010/016/017/019/020.
4. Comunicação: FR-011.
5. Financeiro: FR-013.
6. CMS e reporting: FR-014/015/018.
7. Qualidade transversal: NFR-003/004/005/006.
8. Operação e dados: NFR-007.
