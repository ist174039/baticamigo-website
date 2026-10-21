# Avaliação técnica de controlos — BaticAmigo

Revisão iniciada em 20/10/2026. Referência comparativa: Standards & Controls da Naraiana, adaptada à associação, aos alunos/encarregados e a Firebase. Os resultados da Naraiana não são evidências do BaticAmigo. Esta avaliação de código não é auditoria, certificação nem parecer jurídico; as edições e obrigações legais exigem validação atual das fontes oficiais.

| Tema / origem Naraiana | Aplicação no BaticAmigo | Evidência e estado |
| --- | --- | --- |
| RGPD; ISO 27018/27701 | Dados de menores, contactos, sessões, avaliações e sócios | Minimização de logs, isolamento de perfis, faixas etárias em vez de nascimento. Inventário de tratamento neste diretório; bases legais, titulares, fornecedores, DPIA e retenção por validar. Parcial. |
| OWASP ASVS 5.0 / API Top 10:2023 / Top 10 | API, tokens, BOLA, entradas e XSS | Verificação server-side de token/revogação, matriz por objeto, rejeição de campos desconhecidos, limites de payload; escaping em tabelas e previews do admin; headers comuns. Testes de domínio passam; pentest e regras remotas pendentes. Parcial. |
| WCAG 2.2 AA / EN 301 549 | Home, login, admin, área e relatórios | Skip links, labels, foco, navegação por teclado nos modais, mensagens de estado, alvos de toque, redução de movimento e cabeçalhos de tabela. Auditoria manual, contraste e leitores de ecrã pendentes. Parcial. |
| ISO 9241-110/210; tokens CSS | Tarefas de coordenação, alunos e famílias | Painel inicial, navegação coerente com admin, seleções explícitas, pesquisa/filtros e estados vazios. Pesquisa/testes de utilizadores não executados. Parcial. |
| Clean Architecture; C4/ADRs; ISO 25010 | Domínio pedagógico e UI | Módulos puros separados de Firebase, mapa e decisões em architecture/platform.md; lógica legada ainda acoplada. Parcial. |
| Logging OWASP; NIST 800-92; ISO 27001 A.8.15–17 | Auditoria e erros | Escritas de perfis, sessões e registos geram ator, ação, alvo e hora no servidor. Logs cliente deixam de emitir objetos de erro/nomes de ficheiro nesses fluxos. Centralização, alertas, retenção, acesso e relógios operacionais não verificados. Parcial. |
| NIST SSDF; OWASP SAMM; SLSA | Dependências e ciclo de entrega | Lockfile, auditoria npm, testes/lint/build e scanner de padrões de credenciais no Quality Gate; actions fixadas e permissões read-only. Sem atestação/proveniência da Vercel nem avaliação de maturidade SAMM/SLSA. Parcial. |
| OpenAPI 3.1 / RFC 9457 | Contrato da nova API | Contrato inicial em docs/architecture/platform-api.yaml. Erros legados permanecem JSON com `error`; não se afirma RFC 9457. Parcial. |
| NIST CSF; ISO 27001/27017 | Risco e responsabilidade partilhada | Fronteiras, controlos técnicos e lacunas documentados; sem SGSI, SoA ou perfil CSF aprovado. Aplicabilidade organizacional por avaliar. |
| ISO 22301/27035; backup e continuidade | Falhas de Auth, Firestore, Vercel e incidentes | Runbook preparado; não executa restauros, eliminações nem mudanças de infraestrutura. RPO/RTO, backups, contactos e exercício reais continuam lacunas. |
| ISO 15489 | Materiais, documentos, avaliações e histórico associativo | Autor, datas e versões nos registos; histórico de estado de sócio. Tabela de retenção, arquivo e custódia por aprovar. Parcial. |
| SemVer / Conventional Commits / DORA | Rastreabilidade de entregas | Manifesto package versionado e commits descritivos; registar versão, validações e deployment. Sem enforcement integral de SemVer/commits nem cálculo DORA. Por avaliar. |
| Supabase RLS | Não é a arquitetura deste projeto | Não copiar políticas SQL. Adaptar princípio de privilégio mínimo a Firebase Rules/IAM e API. |
| Segredo profissional da advocacia / eIDAS | Ausência de prática jurídica e serviços de assinatura no âmbito | Não transplantar deveres específicos da advocacia. eIDAS apenas se serviços de confiança vierem a ser adotados; fora desta implementação. |
| Pagamentos e quotas | Excluídos expressamente pelo responsável | Não implementados. Sócios têm perfil e situação associativa sem dados financeiros. |

## Controlos específicos do domínio educativo

- Relação encarregado–aluno verificada por objeto no servidor; proibir acesso a outros educandos.
- Explicador só escreve materiais/avaliações de alunos das suas sessões; aluno não atribui avaliações ou permissões.
- Justificações por encarregado não alteram automaticamente assiduidade; coordenação decide o registo.
- Origem, período e escala em resultados escolares; nenhum ranking automático ou conversão implícita.
- Síntese mostra evidências e ausência de dados, sem diagnóstico ou previsão.
- Histórico de sócio e número não implicam quotização ou pagamentos.
- Fotografias e publicações de menores requerem processo de autorização editorial; não foi inventada nem verificada autorização de imagem.
