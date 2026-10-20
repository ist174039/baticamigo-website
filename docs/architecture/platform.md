# Arquitetura e decisões da plataforma

Âmbito observado: home público, administração de conteúdos e área privada. Next.js App Router em Vercel; Firebase Authentication e Firestore; conteúdos/media legados via Firebase compat 13.0.0 no website/admin. A área usa o SDK Firebase modular e API autenticada. Não confundir gestão de conteúdos públicos `membros` com perfis associativos privados `platform_profiles`.

## Fronteiras e componentes (C4, nível de componentes)

Pessoa → interface React da área → token Firebase → `/api/platform` → contexto de autenticação/autorização → domínio puro → adaptador Firestore/Admin SDK. `domain.mjs` e `modules.mjs` contêm validação e políticas sem importar Firebase/Next. `modules-server.js` gere persistência e auditoria. Home/admin legados ainda têm acesso direto ao Firebase: as regras remotas não foram inspecionadas nesta entrega.

O servidor valida tokens, revogação, conta ativa, papéis e perfis ativos. Autorizações por aluno são verificadas independentemente da interface. Aluno: apenas próprio perfil; encarregado: educandos associados; explicador/voluntário: alunos das próprias sessões; sócio: próprios documentos/mensagens; coordenação/admin: gestão pedagógica; apenas admin atribui acessos. Não publicar documentos pessoais com links públicos: os links externos dependem também das permissões do fornecedor.

## ADR: manter a infraestrutura Firebase existente

Evitar migração de fornecedor e dados neste incremento. Novas coleções usam `platform_`. SDK Admin ignora Security Rules, pelo que a API verifica cada autorização; isso não garante segurança de acessos diretos. A revisão remota de IAM/Rules continua pendente.

## ADR: conservar notas e escalas

Avaliações numéricas preservam mínimo, máximo e origem. Avaliações qualitativas não recebem nota artificial. Evolução compara apenas mesma disciplina, fonte e escala. Síntese descritiva determinística liga às evidências e assinala cobertura insuficiente; não existe geração por LLM nem previsão pedagógica. Revisão pelo explicador/coordenação é necessária. Relatórios agregados suprimem resultados de grupos com menos de cinco alunos; o limiar é uma decisão técnica conservadora a validar, não garantia de anonimização.

## ADR: interação coerente

A área adota a composição do admin: navegação lateral escura, cartões claros, paleta roxa/laranja, títulos serifados, formulários com rótulos e foco visível. Seleções múltiplas usam caixas de seleção. Estados de carregamento, vazio, erro e sucesso são explícitos. Sessões usam Europe/Lisbon, com testes das mudanças de hora. O CSS usa variáveis semânticas na área; tokens do home/admin legados ainda não estão completamente consolidados.

## Qualidade e limites

Usar ISO/IEC 25010:2023 como vocabulário de revisão, sem alegar conformidade. Evidência local: testes de domínio, permissões negativas, escalas, XSS e tempo, lint, build e auditoria de dependências. Faltam testes com contas reais por papel, Rules/IAM remotos, teclado/leitor de ecrã/contraste e ensaio com utilizadores. Não foram medidos tempos de tarefa, Core Web Vitals, disponibilidade nem DORA. Não inferir desempenho de um build bem-sucedido.
