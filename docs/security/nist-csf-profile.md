# NIST CSF 2.0 — Current / Target Profile

Estado: draft técnico; prioridades e risk appetite requerem aprovação.

| Função | Current Profile observado | Target Profile |
| --- | --- | --- |
| GOVERN | requisitos/normas rastreados; readiness fail-closed | owners, risk appetite, políticas aprovadas, revisão periódica |
| IDENTIFY | ativos principais, fornecedores e threat model documentados | inventário operacional validado e classificação de dados |
| PROTECT | Auth, autorização server-side, deny-all direct data, CSP, validação de inputs | IAM produção revisto, retenção aprovada, controlos PII completos |
| DETECT | audit trail e CI detectam regressões | alertas operacionais e monitorização de eventos definida |
| RESPOND | runbook de incidentes | contactos, severidades, exercício tabletop e notificações aprovadas |
| RECOVER | ensaio sintético de snapshot/restore | backup real, restore real, RPO/RTO aprovados e medidos |

## Critério de fecho
Perfil Target só pode ser marcado atingido com evidência do ambiente alvo e aprovação dos owners.
