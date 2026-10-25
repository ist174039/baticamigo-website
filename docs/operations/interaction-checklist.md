# ISO 9241-110 — checklist de interação e tolerância a erro

## Princípios aplicados
- feedback de estado por `role=status` / `role=alert`;
- validação antes de mutações persistentes;
- optimistic concurrency para evitar sobrescrita silenciosa;
- confirmação/bloqueio para operações destrutivas com dependências;
- mensagens sem revelar existência de contas no reset de password;
- ações administrativas impedem remoção/suspensão do último admin;
- formulários limitam tamanho e rejeitam campos desconhecidos;
- recuperação de erro mantém mensagens em linguagem compreensível.

## Pontos a validar manualmente
- consistência da linguagem com alunos/encarregados;
- capacidade de desfazer/recuperar ações críticas;
- clareza dos estados vazios;
- compreensão das mensagens de conflito.

Não declarar conformidade ISO apenas com esta checklist.
