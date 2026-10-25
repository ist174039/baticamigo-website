# Threat model — plataforma BaticAmigo

Estado: rascunho técnico, revisto por código; requer revisão do responsável de segurança.

## Ativos
- contas e autenticação;
- perfis de alunos, encarregados, explicadores, sócios e administradores;
- sessões, presenças e avaliações;
- documentos e ficheiros;
- dados financeiros associativos;
- configuração de acessos;
- trilho de auditoria.

## Fronteiras de confiança
1. browser público ↔ Next.js;
2. browser autenticado ↔ API Next.js com Firebase ID token;
3. API ↔ Firebase Admin SDK;
4. Firebase Admin SDK ↔ Firestore/Storage/Auth;
5. CI ↔ código/dependências, apenas com dados sintéticos.

## Ameaças prioritárias
| Ameaça | Exemplo | Controlo atual | Lacuna |
| --- | --- | --- | --- |
| Broken object authorization | família vê presença de outro aluno | autorização server-side + testes negativos | revisão sistemática de todas as rotas |
| Escalada de privilégio | conta altera papel/acesso | guards admin, última conta admin protegida | rever fallback admin legado |
| Exposição direta Firestore/Storage | SDK client lê dados privados | Rules deny-all | provar deployment/IAM produção |
| Upload malicioso | MIME/extensão falsa, PDF ativo, Office com VBA/ActiveX | allowlist + assinatura/tamanho + rejeição de conteúdo ativo + Storage privado + download attachment | antivírus/sandbox continua por avaliar conforme risco/volume |
| Log com PII | snapshots/dados financeiros em audit | allowlist + minimização | retenção/alertas |
| Supply-chain | dependência/action comprometida | lockfile, SHA de actions, npm audit, SBOM | provenance/attestation de artefacto |
| Perda/corrupção de dados | eliminação acidental | readiness + ensaio sintético | backup real/restauro/RPO/RTO |
| Retenção excessiva | dados históricos indefinidos | modelo fail-closed | política aprovada e execução |

## Gate
Nenhuma ameaça crítica é aceite por omissão. Risco residual precisa de owner, decisão, prazo e evidência.
