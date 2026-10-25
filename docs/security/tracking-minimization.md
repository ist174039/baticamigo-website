# Tracking e cookies — minimização técnica

Estado observado em 25/10/2026:

- não existe Google Analytics/GTM no código da aplicação;
- não existe Meta/Facebook Pixel;
- não existe escrita/leitura direta de `document.cookie`;
- Firebase é utilizado para autenticação/dados funcionais, não como publicidade comportamental;
- armazenamento local eventualmente usado para preferências funcionais não deve ser reutilizado para tracking cross-site.

## Gate

A introdução de analytics, pixels, cookies não essenciais ou identificadores de tracking requer:
1. finalidade e aplicabilidade legal aprovadas;
2. atualização do inventário de fornecedores/dados;
3. mecanismo de consentimento quando aplicável;
4. retenção definida;
5. atualização das CSP e normas/controlos.

O CI bloqueia trackers publicitários/analytics comuns e uso direto de `document.cookie` até existir uma decisão explícita.
