# ISO/IEC 27002:2022 — mapa de controlos

Este documento é um mapa de implementação, não uma declaração de conformidade ou certificação.

## Âmbito técnico atual

| Domínio | Evidência atual | Estado técnico | Falta para fecho |
| --- | --- | --- | --- |
| Identidade e autenticação | Firebase Auth, verificação de token revogado no servidor | Parcial | revisão de contas privilegiadas e ciclo de vida |
| Autorização | `lib/platform/access.mjs`, guards server-side, testes negativos | Parcial | matriz completa rota × ação × objeto |
| Acesso direto a dados | `firestore.rules` e `storage.rules` deny-all | Implementado em repo | provar deployment e IAM de produção |
| Logging e auditoria | auditoria de mutações críticas | Parcial | retenção, acesso, alertas e revisão operacional |
| Desenvolvimento seguro | Quality Gate, audit, secret scan, testes, actions por SHA | Parcial | processo formal de vulnerabilidades e revisão periódica |
| Fornecedores/cloud | fronteiras Firebase/Vercel documentadas | Parcial | contratos, regiões, subprocessadores e responsabilidades aprovadas |
| Incidentes | runbook de recuperação/incidentes | Parcial | contactos, severidades, exercício e aprovação |
| Continuidade | readiness fail-closed | Lacuna operacional | RPO/RTO, backup real e restauro testado |

## Critério de aceitação

Cada controlo aplicável deve ter: owner, evidência atual, periodicidade, exceção justificada quando aplicável e revisão. Controlos organizacionais não podem ser marcados como implementados apenas por existir código.
