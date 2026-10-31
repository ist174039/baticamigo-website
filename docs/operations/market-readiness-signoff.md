# Market readiness — GO / NO-GO sign-off

Estado atual: **NO-GO / Amber**.

Este documento organiza a decisão final. Não substitui aprovação do órgão competente e não autoriza merge ou deployment.

## Release candidate

- PR: #4 `release/market-readiness-2026-10-25 -> main`
- main baseline inicial desta campanha: `74053bc30d10c1d4fb1fbf88591e6ce5d0ec3bf4`
- SHA final: **obter do HEAD atual do PR #4 no momento da decisão**
- Quality Gate: **tem de estar verde no mesmo SHA final**
- evidence run: **obter da base canónica Executions & Evidence para esse SHA**

O documento não fixa o próprio HEAD porque qualquer edição deste ficheiro criaria um novo SHA. A decisão usa sempre o PR head e a execução verde correspondente no momento do sign-off.

## Gates obrigatórios

### Governação / produto
- BA-GOV-001 — decisor, owners, MVP/escopo e métricas;
- BA-CRIT-001 — critérios de aceite aprovados;
- BA-COMP-001 — aplicabilidade/SoA aprovada.

### Código / repositório / release
- BA-RC-001 — revisão humana do PR e rollback;
- BA-MAIN-001 — proteção de main;
- BA-REPO-001 — visibilidade/licença/ownership;
- BA-ASSET-001 — direitos/proveniência de assets;
- BA-LIC-001 — licenças runtime aprovadas;
- BA-TRACE-001 — responsável/data confirmados, além do PASS técnico já obtido;
- BA-SEC-001 — hardening de calendário integrado/validado na versão final.

### Ambiente / produção
- BA-ENV-001 — staging isolado no SHA final;
- BA-HOST-001 — deployment production + domínio + TLS + smoke;
- BA-REL-001 — Rules/IAM/deployment correspondentes ao SHA final;
- BA-OBS-001 — sinais/canais/alertas live testados;
- BA-IR-001 — tabletop executado.

### Privacidade / compliance
- BA-PRIV-001 roll-up:
  - BA-PIA-001;
  - BA-RET-001;
  - BA-VENDOR-001;
  - BA-RIGHTS-001.

### Continuidade / validação humana
- BA-BCP-001 — backup/restauro real + RPO/RTO + rollback;
- BA-A11Y-001 — acessibilidade manual;
- BA-UX-001 — usabilidade por perfis representativos.

## Regra de decisão

**GO** só é admissível quando:
1. cada gate acima está fechado com owner, data acordada/decisão, evidência e critério cumprido;
2. o SHA final do PR tem Quality Gate verde;
3. o deployment candidate corresponde ao mesmo SHA;
4. production-readiness passa com evidências reais;
5. não há risco crítico/alto aberto sem decisão explícita;
6. a revisão humana do release candidate está concluída;
7. o decisor competente regista GO.

Se qualquer condição falhar: **NO-GO**.

## Estado atual

O código candidato está tecnicamente consistente, mas existem gates externos/humanos abertos. Portanto a recomendação atual é **Blocked / Requires Decision**, não Ready for Main.
