# Production validation checklist

Estado: template operacional. **Não é prova de validação até estar preenchido com evidência verificável.**

## Identificação
- versão/SHA:
- ambiente:
- executor:
- revisor:
- data:

## Segurança / cloud
- [ ] Firestore Rules implantadas correspondem ao SHA aprovado.
- [ ] Storage Rules implantadas correspondem ao SHA aprovado.
- [ ] IAM/service accounts revistos; mínimo privilégio confirmado.
- [ ] Segredos apenas em mecanismos aprovados; nenhum segredo no cliente/CI.
- [ ] security.txt acessível por HTTPS e canal operacional.
- Evidência:
- Critério de aceitação:

## Privacidade
- [ ] finalidades e base(s) legal(is) aprovadas;
- [ ] papéis controlador/processador confirmados;
- [ ] representação/fluxos de menores confirmados;
- [ ] PIA/DPIA avaliada e decisão registada;
- [ ] fornecedores/DPA/região/subprocessadores revistos;
- [ ] processo de direitos dos titulares revisto.
- Evidência:
- Critério de aceitação:

## Retenção
- [ ] política aprovada, versionada e datada;
- [ ] owner por categoria;
- [ ] legal hold definido;
- [ ] dry-run do planner revisto antes de qualquer eliminação;
- [ ] processo de eliminação/expurgo aprovado.
- Evidência:
- Critério de aceitação:

## Continuidade
- [ ] RPO aprovado:
- [ ] RTO aprovado:
- [ ] backup real confirmado:
- [ ] restauro real executado em ambiente isolado:
- [ ] integridade e completude verificadas:
- [ ] data do próximo exercício definida:
- Evidência:
- Critério de aceitação:

## Acessibilidade / UX
- [ ] axe automático verde no SHA alvo;
- [ ] teclado completo;
- [ ] zoom/reflow;
- [ ] contraste/estados/foco;
- [ ] leitor de ecrã em fluxos críticos;
- [ ] browser/mobile matrix;
- [ ] teste com representantes dos perfis quando aplicável.
- Evidência:
- Critério de aceitação:

## Decisão
- resultado: GO / NO-GO
- responsável da decisão:
- data:
- riscos aceites:
- ações pendentes:
