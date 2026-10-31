# ISO/IEC 29100:2024 + ISO/IEC 29151:2026 — controlos PII

## Princípios operacionais

- recolher apenas dados necessários à finalidade aprovada;
- separar dados pedagógicos, associativos e financeiros por finalidade e permissão;
- autorizar por papel, relação e objeto no servidor;
- negar acesso direto do browser às coleções privadas;
- minimizar logs e artefactos de QA;
- usar dados sintéticos em testes;
- limitar downloads e URLs assinadas ao mínimo necessário;
- definir retenção e eliminação por categoria antes de produção;
- manter direitos e processos de correção/eliminação dependentes de validação jurídica e operacional.

## Evidência técnica atual

`lib/platform/server.js`, `lib/platform/access.mjs`, `firestore.rules`, `storage.rules`, testes de isolamento e `docs/security/data-governance-draft.md`.

## Lacunas

Finalidades e bases legais aprovadas, retenção, contratos/DPA, transferências, direitos, PIA/DPIA e revisão formal de controlos PII.
