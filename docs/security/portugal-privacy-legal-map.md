# Mapa jurídico de privacidade — Portugal/UE

Estado: **mapa de trabalho técnico-jurídico; não é parecer jurídico nem aprovação de conformidade**.

Revisão de fontes oficiais: 25/10/2026.

## Fontes oficiais

- RGPD — Regulamento (UE) 2016/679, texto oficial/consolidado:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj/por
- Lei n.º 58/2019, de 8 de agosto — execução do RGPD em Portugal:
  https://files.dre.pt/gratuitos/1s/2019/08/15100.pdf
- CNPD — Consentimento:
  https://www.cnpd.pt/organizacoes/areas-tematicas/consentimento/
- CNPD — Direitos dos titulares:
  https://www.cnpd.pt/cidadaos/direitos/
- CNPD — Avaliação de Impacto sobre a Proteção de Dados:
  https://www.cnpd.pt/organizacoes/outras-obrigacoes/avaliacao-de-impacto/

## Regras que o projeto deve respeitar

### Finalidade, minimização e licitude

O artigo 5.º do RGPD exige finalidade determinada, minimização, exatidão, limitação da conservação, integridade/confidencialidade e accountability. Cada operação do BaticAmigo deve ter finalidade e base de licitude próprias aprovadas.

O consentimento é apenas uma das bases possíveis do artigo 6.º do RGPD. **Não assumir consentimento como base universal**. A base correta depende da finalidade e do contexto; a CNPD salienta expressamente que consentimento não é aplicável a todos os tratamentos.

### Crianças e menores

O artigo 16.º da Lei n.º 58/2019 prevê, no contexto específico do consentimento relativo à oferta direta de serviços da sociedade da informação, que crianças com 13 ou mais anos podem prestar esse consentimento; abaixo de 13 anos, quando essa for a base aplicável, o consentimento deve ser dado pelos representantes legais, preferencialmente com autenticação segura.

Esta regra **não significa**:
- que todo o tratamento de menores dependa de consentimento;
- que a plataforma possa inferir representação legal apenas da relação técnica guardianIds;
- que 13 anos seja uma regra universal para todas as operações da associação.

A CNPD indica também que direitos relativos a dados de crianças são exercidos pelos representantes legais, sem prejuízo de exercício direto pelos próprios em função da idade, maturidade e situações previstas na lei.

### Transparência e direitos

Antes/relação com a recolha, a informação aos titulares deve cobrir, conforme aplicável, finalidade, base, destinatários, conservação/critérios, direitos, reclamação à autoridade e outros elementos previstos nos artigos 13.º/14.º do RGPD.

A CNPD indica que o exercício de direitos é dirigido ao responsável pelo tratamento e que, em regra, o titular deve obter resposta no prazo de um mês, admitindo a extensão legalmente prevista quando necessária e comunicada. O processo interno deve preservar prova do pedido/resposta sem recolher dados adicionais desnecessários.

O processo técnico em docs/security/data-subject-rights.md deve ser usado apenas depois de verificar a identidade/representação e a decisão aplicável.

### Retenção

O projeto não define prazos por omissão. Os prazos/critérios têm de ser aprovados por finalidade/categoria, com fundamentação, owner e legal hold. A implementação permanece fail-closed enquanto isso não existir.

### AIPD / DPIA

A CNPD recorda que a AIPD é obrigatória nos casos do artigo 35.º do RGPD que apresentem elevado risco, incluindo exemplos como certos tratamentos em larga escala ou profiling/decisão automatizada significativa. O BaticAmigo deve documentar a decisão sobre necessidade/âmbito; **não assumir automaticamente que é obrigatória nem dispensável**.

O draft docs/security/privacy-impact-assessment.md e o validator privacyAssessmentStatus estruturam a avaliação, mas a decisão/revisão pertence ao responsável competente.

Quando a AIPD conclua que permanece elevado risco apesar das medidas mitigadoras, o mapa deve encaminhar para a consulta prévia à CNPD antes do início do tratamento, nos termos do artigo 36.º do RGPD.

## Mapeamento para o sistema

| Área | Dados/risco | Controlo técnico existente | Decisão ainda necessária |
| --- | --- | --- | --- |
| Autenticação/contas | email, UID, roles | token server-side, email verificado, conta ativa, sessão de browser | finalidade/base, transparência, conservação |
| Perfis/menores | aluno, encarregado, relações | autorização por relação, isolamento entre famílias | representação/autoridade, finalidade/base, campos necessários |
| Sessões/presenças | horários, assiduidade | ACL por perfil/relação, audit, privacidade de calendário | retenção, transparência |
| Avaliações/resultados | dados pedagógicos | escala/origem preservadas, síntese determinística e revisão humana | finalidade/base, necessidade/proporcionalidade, DPIA |
| Mensagens/documentos | conteúdo privado | API server-side, Storage privado, validação de ficheiros | retenção, direitos e política de conteúdo |
| Sócios/finanças | dados associativos/financeiros | autorização, audit, concorrência | finalidade/base, retenção, obrigações legais aplicáveis |
| Contacto website | nome/email/mensagem | API server-side, allowlist, honeypot | aviso de privacidade, base, retenção |
| Conteúdo público/media | imagens/textos | CMS admin, allowlists, media paths | direitos de imagem/autorização/origem e política de publicação |

## Gate de saída

Este mapa permite sair de “sem enquadramento” para “em análise”. **Não permite declarar conformidade**.

Para aprovação:
1. identificar responsável pelo tratamento e, se aplicável, subcontratantes/corresponsáveis;
2. aprovar finalidade e base por operação;
3. aprovar campos mínimos e transparência;
4. aprovar representação/salvaguardas para menores;
5. aprovar retenção/eliminação;
6. decidir e rever AIPD/DPIA;
7. rever fornecedores, DPA, localização/transferências;
8. registar responsável, data, evidência e próxima revisão.
