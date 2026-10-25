# Protocolo de validação de usabilidade — perfis BaticAmigo

Estado: **pronto para execução; não executado**.

Este protocolo operacionaliza BA-UX-001 e BA-STD-021 (ISO 9241-210). Não substitui utilizadores representativos por heurística da equipa.

## Perfis a representar

Sem registar dados pessoais no repositório:
- aluno;
- encarregado de educação;
- explicador/voluntário;
- sócio;
- coordenação/admin.

Participantes menores só podem ser envolvidos depois de procedimento/representação e salvaguardas aprovados.

## Tarefas críticas

### Conta e navegação
1. iniciar sessão;
2. identificar área/perfil disponível;
3. encontrar agenda/sessões;
4. terminar sessão.

### Aluno
1. consultar próxima sessão;
2. consultar assiduidade;
3. encontrar trabalho/material;
4. compreender avaliação/progresso sem interpretação enganosa.

### Encarregado
1. selecionar educando correto;
2. consultar agenda/assiduidade;
3. encontrar/submeter justificação;
4. confirmar que não vê outra família.

### Explicador/voluntário
1. localizar sessão atribuída;
2. consultar apenas alunos associados;
3. registar/corrigir presença conforme permissão;
4. criar material/avaliação permitida.

### Sócio
1. consultar dados associativos próprios;
2. localizar situação de quotas/pagamentos quando aplicável;
3. identificar canal para correção/ajuda.

### Coordenação/admin
1. criar/editar sessão;
2. associar perfis;
3. gerir acesso sem ampliar permissões por engano;
4. publicar conteúdo;
5. consultar reporting;
6. identificar ação irreversível/conflito antes de confirmar.

## Métricas por tarefa

Registar apenas dados de teste/sintéticos e resultados agregados:
- sucesso: completo / completo com ajuda / falhou;
- erros críticos;
- número de hesitações/retrocessos;
- ajuda necessária;
- tempo aproximado quando útil;
- confiança percebida 1–5;
- compreensão do estado/feedback 1–5;
- comentário qualitativo sem PII.

Não usar uma média isolada para ocultar bloqueadores de um perfil.

## Critérios de aceitação propostos para execução

Estes critérios são operacionais e devem ser confirmados pelo Product Owner antes do estudo:
- 100% das tarefas de segurança/privacidade sem erro que exponha ou altere dados indevidos;
- nenhum participante deve confundir dados de outro perfil/família como próprios;
- zero bloqueadores de navegação/autenticação nos fluxos críticos;
- qualquer ação destrutiva deve ser compreendida antes da confirmação;
- findings de severidade crítica/alta devem ser corrigidos e retestados antes de GO.

## Severidade

- **Crítica:** risco de dados/segurança, ação irreversível indevida ou tarefa essencial impossível;
- **Alta:** tarefa crítica falha ou exige ajuda substancial;
- **Média:** fricção relevante com workaround claro;
- **Baixa:** melhoria cosmética/microcopy sem bloqueio.

## Evidência obrigatória

Para cada sessão:
- ID sintético do participante;
- perfil representado;
- SHA/ambiente;
- executor/moderador;
- data;
- tarefas;
- resultados;
- findings e severidade;
- artefacto seguro (notas/redacted screenshots quando permitido).

Para fechar BA-UX-001:
- owner/reviewer;
- resumo por perfil;
- lista de findings;
- commits/fixes;
- retestes;
- decisão de aceite;
- limitações e perfis não cobertos.

Não carregar gravações, nomes, emails ou imagens identificáveis de menores no GitHub/CI.
