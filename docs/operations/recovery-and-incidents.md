# Continuidade e incidentes — procedimento para validação

Estado: preparado, não exercitado. Responsável, contactos, RPO/RTO, retenção e backups efetivos por confirmar.

1. Identificar serviço afetado (Vercel, Firebase Auth, API, Firestore, Storage), ambiente, versão e impacto. Não copiar tokens, dados de alunos ou credenciais para tickets/logs.
2. Se autorização ou integridade falhar, manter acesso fechado; não contornar Rules ou conceder papéis gerais para restaurar serviço. Registar hora, resultado e evidências minimizadas.
3. Conter segundo orientação do responsável: desativar o acesso afetado/revogar sessão, preservar provas restritas e avaliar incidente/violação de dados. O responsável competente determina notificações e prazos aplicáveis.
4. Para falha de interface/API, regressar à última versão verificada na Vercel, após confirmar compatibilidade de dados. Rollback de código não desfaz escritas Firestore.
5. Antes de restauro, confirmar backup existente, instante, integridade, destino isolado e autoridade. Restaurar primeiro isoladamente, validar contagens/relações/permissões e registar tempo. Não substituir produção durante esta execução.
6. Após recuperação, validar home/admin/área e matriz de acesso por papel, reconciliar agendamentos/presenças alterados e registar versão, responsável, resultado e pendências.
7. Definir e ensaiar backup, recuperação, deteção/alertas, períodos de retenção e pedidos de eliminação. Medir tempos reais antes de declarar RPO/RTO cumpridos.

## Métricas de entrega propostas

DORA: frequência apenas de produção; lead time de alteração até produção; percentagem de entregas com incidente; tempo de recuperação de incidentes. Faltam ledger fiável de produção, classificação de falhas e responsável. Não contabilizar preview/build como produção nem inventar valores.
