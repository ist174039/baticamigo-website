# Release candidate review — main → market readiness

Estado: **candidato técnico; não aprovado para merge/produção**.

Base: `main` em `74053bc30d10c1d4fb1fbf88591e6ce5d0ec3bf4`.

Branch: `release/market-readiness-2026-10-25`.

O SHA exato varia enquanto o Quality Gate corrige documentação/gates. A decisão de release deve usar o SHA final verde, não este documento como substituto.

## Mudanças de compatibilidade que exigem atenção

### 1. Conteúdo público Firestore

Antes:
- website podia ler coleções editoriais diretamente pelo Firebase client.

Candidato:
- website lê `/api/public-content`;
- a API usa Admin SDK e devolve apenas campos allowlisted/sanitizados;
- Firestore Rules das coleções editoriais deixam de ser uma API pública de leitura para clientes arbitrários.

Impacto:
- clientes externos/legados que dependam de leitura Firestore direta deixam de ser compatíveis;
- o website incluído no mesmo release já está migrado.

Critério:
- confirmar que não existem consumidores externos autorizados não inventariados antes de implantar Rules.

### 2. Contacto público

Antes:
- formulário/cliente podia escrever diretamente em `contato`.

Candidato:
- submissão passa por `POST /api/contact`;
- Rules não permitem create público direto;
- payload tem allowlist, limites, honeypot e validação server-side.

Impacto:
- qualquer integração que escreva diretamente em Firestore precisa migrar para a API.

### 3. Administração

Antes:
- existia superfície/login admin legado.

Candidato:
- login canónico é `/platform/login`;
- caminhos admin antigos redirecionam;
- gestão de utilizadores migra para a Área e operações legadas incompatíveis devolvem 410 quando aplicável.

Impacto:
- bookmarks devem redirecionar;
- automações que chamem operações admin antigas precisam migrar.

### 4. Rules e acesso privado

Candidato:
- `platform_*` e `platform-files/*` são deny-direct no browser;
- operações privadas dependem da API server-side/Admin SDK;
- CMS write depende de admin verificado e conta persistida/claim legado apenas nas condições documentadas.

Impacto:
- qualquer cliente Firebase direto para `platform_*` é incompatível por design.

### 5. Runtime

Candidato:
- Node.js 24 é requisito explícito no package e no CI.

Impacto:
- ambientes de build/runtime fora desse intervalo não são suportados.

## Sequência de implantação proposta

Não executar sem GO:

1. selecionar SHA final verde;
2. confirmar consumidores externos/legados;
3. configurar runtime/secrets;
4. implantar código/API;
5. validar endpoints públicos no novo deployment;
6. implantar Firestore/Storage Rules correspondentes ao mesmo SHA;
7. smoke website/contact/admin/área;
8. confirmar domínio/TLS;
9. validar IAM e logs;
10. executar checklist de produção;
11. registar deployment SHA/evidence URL;
12. só depois decidir promoção/alias definitivo.

A ordem código/API antes de Rules evita quebrar o website antigo sem o endpoint mediado disponível, mas a janela e mecanismo exatos têm de ser aprovados pelo responsável de release.

## Rollback

Rollback de código:
- promover/reapontar para o último deployment verificado.

Rollback de Rules:
- requer versão anterior conhecida e aprovada; **não** reabrir publicamente `platform_*` para restaurar serviço.

Dados:
- rollback de código/Rules não desfaz escritas Firestore;
- alterações de dados precisam de procedimento próprio e backup/restauro aprovado.

Se a nova API foi usada para gravar dados compatíveis com o modelo anterior, validar compatibilidade antes de rollback. Se houver migração de schema futura, exigir plano específico.

## Gates antes de merge

- Quality Gate verde no SHA final;
- diff main→candidate revisto;
- OpenAPI/rotas sincronizados;
- modelo físico sincronizado;
- BA-GOV/REL/PRIV/BCP/A11Y/UX/HOST resolvidos;
- readiness ligado ao mesmo SHA;
- rollback/evidência revistos;
- decisão GO/merge por responsável competente.

## Versionamento

O projeto é aplicação privada (`private: true`). O package permanece 1.0.0 enquanto o trabalho está em `Unreleased`.

Não atribuir automaticamente 2.0.0/1.1.0 apenas porque existem alterações grandes. A versão de release deve ser decidida junto com a política de release, compatibilidade e âmbito aprovado.
