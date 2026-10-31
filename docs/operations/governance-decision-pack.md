# Governance & release decision pack — BaticAmigo

Estado: **pronto para decisão; nenhum owner, prazo ou GO é inferido**.

## 1. Accountability

Preencher:
- Product Owner / decisor de produto:
- responsável técnico:
- responsável segurança:
- responsável privacidade:
- responsável operação/continuidade:
- responsável UX/acessibilidade:
- responsável tesouraria/financeiro, se aplicável:
- decisor final GO/NO-GO:
- data de revisão:
- próxima revisão:

## 2. Âmbito de lançamento

### In scope aprovado
- funcionalidades:
- perfis:
- conteúdo público/CMS:
- financeiro:
- reporting:
- integrações:

### Explicitamente fora de scope
- funcionalidades:
- integrações:
- automações:
- migrações:
- outros:

Não inferir MVP pelo que existe no código. A decisão de âmbito deve referenciar os requisitos canónicos.

## 3. Critérios de aceitação

Os 27 requisitos possuem critérios técnicos observáveis no Notion.

Aprovação requerida:
- critérios funcionais revistos por Product Owner;
- NFR-002 por privacidade/responsável competente;
- NFR-003 por acessibilidade/responsive reviewer;
- NFR-004 por Product Owner/UX após teste representativo;
- NFR-007 por operação/continuidade;
- critérios alterados após aprovação exigem decisão rastreada.

## 4. Métricas e baselines

Definir sem confundir cobertura documental com sucesso do produto:
- disponibilidade alvo:
- performance alvo e fonte de medição:
- taxa de sucesso das tarefas críticas:
- erro/abandono aceitável:
- incidentes/severidade:
- RPO:
- RTO:
- frequência/cadência de revisão:
- baseline:
- meta:
- owner de cada métrica:

DORA só usa deployments/incidentes reais de produção.

## 5. Normas e controlos

Rever os 42 controlos:
- aplicabilidade;
- owner;
- evidência;
- lacuna;
- exceção/risco aceite;
- data de revisão.

A matriz técnica não constitui certificação ISO, conformidade RGPD ou parecer jurídico.

## 6. Release candidate

- PR:
- release SHA:
- Quality Gate run:
- reviewer técnico:
- diff revisto:
- release review revisto:
- rollback revisto:
- blockers restantes:

## 7. Gate GO/NO-GO

Só considerar GO se:
- critérios/owners/prazos aplicáveis estão aprovados;
- Rules/IAM production correspondem ao release SHA;
- privacy decision pack aprovado;
- continuity pack executado;
- A11Y manual executada;
- usability representativa executada;
- staging/preview evidence quando aplicável;
- hosting/domínio production validado;
- observabilidade e incident response operacionais;
- readiness command passa com evidência do mesmo SHA;
- riscos residuais têm owner/decisão explícita.

## Decisão

- resultado: GO / NO-GO
- release SHA:
- responsável:
- data:
- evidência:
- riscos aceites:
- ações pós-release:
- próxima revisão:

O CI, o orquestrador e a existência deste template não podem preencher ou aprovar esta secção por inferência.
