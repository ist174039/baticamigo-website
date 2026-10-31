# Privacy decision pack — BaticAmigo

Estado: **pronto para revisão/aprovação; nenhuma decisão é pré-preenchida**.

Release candidate: usar o SHA final verde do PR #4.

## Evidência técnica já preparada

- `docs/data-model.json` — inventário físico/privado vs público;
- `docs/security/portugal-privacy-legal-map.md` — mapa RGPD/Lei 58/2019/CNPD;
- `docs/security/data-governance-draft.md`;
- `docs/security/privacy-impact-assessment.md`;
- `docs/security/data-subject-rights.md`;
- `docs/security/children-digital-safeguards.md`;
- `docs/security/cloud-responsibility-matrix.json`;
- `docs/security/vendor-inventory.md`;
- `docs/security/retention-approval-template.md`;
- `docs/security/privacy-approval-template.md`;
- autorização server-side, Rules fail-closed, audit minimization e tracking minimization testados no Quality Gate.

## Decisões obrigatórias

### 1. Accountability
- responsável pelo tratamento:
- contacto/canal institucional:
- DPO/encarregado de proteção de dados, se aplicável:
- responsável pela aprovação:
- data:
- próxima revisão:

### 2. Finalidades e bases

Para cada operação, preencher finalidade, dados mínimos, titulares, base aplicável, destinatários e necessidade:

| Operação | Finalidade aprovada | Base | Dados mínimos | Titulares | Destinatários |
| --- | --- | --- | --- | --- | --- |
| contas/autenticação |  |  |  |  |  |
| perfis aluno/encarregado |  |  |  |  |  |
| sessões/presenças |  |  |  |  |  |
| avaliações/resultados/síntese |  |  |  |  |  |
| mensagens/documentos |  |  |  |  |  |
| sócios/quotas/pagamentos |  |  |  |  |  |
| contacto website |  |  |  |  |  |
| conteúdo/media público |  |  |  |  |  |
| auditoria/segurança |  |  |  |  |  |

Não usar “consentimento” como resposta por omissão; justificar a base por finalidade.

### 3. Menores
- quando/como é validada representação/autoridade:
- informação adequada à idade:
- exercício de direitos pelo menor/representante:
- campos estritamente necessários:
- salvaguardas adicionais:
- imagens/media de menores — regra de publicação/autorização:

### 4. Retenção
Preencher e aprovar `docs/security/retention-approval-template.md`.
- versão da política:
- owner por categoria:
- legal hold:
- eliminação/expurgo:
- evidência de dry-run antes de apagar dados reais:

### 5. Fornecedores/cloud
Para Firebase/Vercel/GitHub e outros aplicáveis:
- papel:
- DPA:
- região/localização:
- transferências:
- subprocessadores:
- retenção:
- incidente/notificação:
- owner/revisão:

### 6. Direitos/transparência
- aviso(s) de privacidade aprovado(s):
- canais de acesso/retificação/apagamento/restrição/oposição/portabilidade quando aplicáveis:
- verificação de identidade/representação:
- SLA/processo interno:
- exceções/obrigações de conservação:

### 7. PIA/DPIA
- decisão sobre necessidade:
- âmbito:
- reviewer:
- riscos para titulares:
- medidas:
- risco residual:
- consulta prévia à autoridade, se aplicável:
- decisão final/data:

## Critério de saída

BA-PRIV-001 só fecha quando:
- campos aplicáveis acima estão preenchidos por responsável competente;
- retention decision está aprovada;
- PIA/DPIA tem decisão/reviewer;
- cloud/vendor evidence está revista;
- direitos/transparência estão aprovados;
- decisão está ligada ao release SHA e à evidência no Notion.

Este pack não é parecer jurídico e não pode ser autoaprovado pelo CI.
