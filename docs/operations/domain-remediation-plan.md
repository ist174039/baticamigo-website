# Domain and hosting remediation plan — baticamigo.pt

Estado: **diagnóstico concluído; nenhuma alteração DNS/produção executada**.

## Evidência observada — 25/10/2026

Vercel project:
- project: `baticamigo-website`;
- project ID: `prj_TAhiadbgXBc5eSe4BdAUgVXHeOsd`;
- `live=false`;
- projeto tem apenas o domínio `baticamigo-website.vercel.app` associado;
- nenhum alias `baticamigo.pt` foi encontrado no team/projeto.

Domínio `baticamigo.pt`:
- não está registado como domain no team Vercel consultado;
- DNS é externo (`serviceType=external`);
- nameservers observados: `ns1.webhs.org`, `ns2.webhs.org`, `ns3.webhs.org`, `ns4.webhs.org`;
- apex observado: A `62.233.41.47`;
- Vercel reporta `misconfigured=true` para uso com este projeto;
- Vercel recomenda, no diagnóstico atual, A `216.198.79.1` / `64.29.17.1` (ou fallback `76.76.21.21`) e CNAME específico fornecido pela plataforma para subdomínios;
- verificação HTTP externa do domínio devolveu 502 no momento do diagnóstico.

A recomendação DNS pode mudar; deve ser relida da Vercel no momento da alteração. Não copiar estes valores cegamente depois.

## Sequência de correção

Não executar antes de BA-RC/GO:

1. confirmar proprietário/administrador autorizado do domínio e DNS;
2. confirmar qual hostname será canónico: apex, `www` ou ambos;
3. selecionar o deployment de produção do **release SHA aprovado**;
4. adicionar `baticamigo.pt` ao projeto Vercel e concluir challenge de ownership, se exigido;
5. obter a configuração DNS recomendada **naquele momento**;
6. alterar apenas os records necessários no fornecedor DNS atual ou decidir migração de nameservers separadamente;
7. aguardar propagação e verificar `verified=true`;
8. validar TLS/HTTPS, redirect apex/www, HSTS e CSP;
9. smoke homepage, public-content, contact, login e rotas públicas;
10. validar que `BATIC_PRODUCTION_DEPLOYED_SHA` corresponde a `BATIC_RELEASE_SHA`;
11. registar evidência, rollback e owner;
12. só depois considerar BA-HOST-001 concluída.

## Rollback DNS

Antes da alteração:
- exportar/anotar records relevantes atuais;
- confirmar TTL;
- identificar valor anterior e responsável.

Se falhar:
- restaurar records anteriores;
- não alterar MX/TXT/email não relacionados;
- validar novamente resolução/serviços;
- registar incidente e tempo de recuperação.

## Restrições

- não promover preview/produção apenas para “testar DNS” sem SHA aprovado;
- não remover records de email;
- não assumir que o 502 é causado pelo código da release candidate: o domínio atual não aponta para o projeto Vercel diagnosticado;
- não declarar domínio pronto até Vercel verification + HTTPS + smoke do SHA final.
