# Public endpoint abuse protection

Estado: **defesa aplicacional implementada; rate limiting distribuído/WAF de produção por validar**.

## /api/contact

Controlos existentes no release candidate:
- apenas POST JSON;
- same-origin quando o browser envia Origin;
- body máximo de 8 KiB;
- allowlist estrita de campos;
- limites por campo;
- validação de email;
- honeypot website, que devolve 202 sem persistir;
- erro genérico;
- escrita Firestore mediada pelo servidor;
- cliente não recebe acesso direto à coleção contato.

## /api/public-content

- apenas GET;
- coleção em enum/allowlist;
- site_config só aceita id=contact;
- campos de saída sanitizados por schema;
- arrays/strings limitados;
- cache pública controlada;
- nenhuma coleção platform_* é aceite.

## Rate limiting / WAF

O repositório não deve inventar um rate limit “global” em memória: Vercel pode executar múltiplas instâncias e um contador local não é uma proteção distribuída.

Antes de produção, selecionar uma proteção apropriada no edge/WAF ou armazenamento distribuído, definindo:
- endpoint;
- janela/limite;
- tratamento de bursts;
- resposta 429/Retry-After;
- exceções operacionais;
- logging sem PII excessiva;
- impacto sobre utilizadores legítimos;
- owner;
- teste/evidência.

Se a solução usar IP/endereço de rede ou outro identificador, a necessidade, retenção e transparência devem ser revistas em BA-PRIV-001.

## Critério de saída

A ausência de rate limiting distribuído não é ocultada pelo honeypot. Para fechar o risco de abuso:
- hosting/edge target definido;
- regra de rate-limit/WAF configurada;
- teste controlado prova allow/deny/429 sem afetar dados reais;
- observabilidade/alerta para abuso está operacional;
- decisão de privacidade sobre identificadores está documentada.
