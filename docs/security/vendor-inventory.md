# Inventário técnico de fornecedores e fluxos externos

Estado: **inventário técnico observado — contratos e papéis por validar**.

## Runtime / hosting

| Fornecedor / serviço | Uso observado | Dados potencialmente envolvidos | Evidência / decisão pendente |
| --- | --- | --- | --- |
| Firebase Authentication | autenticação da plataforma | identificadores de conta, email, estado de autenticação | DPA, região, retenção e papéis por validar |
| Cloud Firestore | dados operacionais privados | perfis, sessões, presenças, registos, auditoria, finanças | Rules versionadas; IAM/deployment de produção por validar |
| Firebase Storage | ficheiros e imagens | conteúdos carregados e imagens | acesso privado mediado por API para plataforma; configuração real por validar |
| Vercel | hosting/runtime Next.js | pedidos HTTP, metadados técnicos, logs conforme configuração | contrato, retenção/logs e região por validar |
| cdnjs / Cloudflare | Font Awesome no website público | pedido de recurso pelo browser | avaliar self-hosting/minimização |

## Desenvolvimento / entrega

| Serviço | Uso | Dados |
| --- | --- | --- |
| GitHub / GitHub Actions | repositório e CI | código, metadados de commits, logs de CI; testes usam dados sintéticos |
| Notion | documentação e governação do projeto | requisitos, normas, evidências; não usar como datastore de produção |

## Regras

- Não introduzir novo fornecedor que processe dados pessoais sem atualização deste inventário.
- Não colocar segredos, dados reais de menores, famílias, contactos ou contratos em logs/artefactos de CI.
- Confirmar controlador/processador, DPA, subprocessadores, localização/transferências, retenção e processo de incidente antes de produção quando aplicável.
- Preferir self-hosting para recursos públicos externos quando o custo operacional for razoável. As fontes públicas Manrope/DM Sans são atualmente self-hosted pelo build Next.js.

Este documento não constitui validação contratual nem jurídica.
