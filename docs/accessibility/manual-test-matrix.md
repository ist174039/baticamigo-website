# Matriz manual de acessibilidade — WCAG 2.2 / EN 301 549

Estado: **por executar**. O axe no CI cobre apenas uma parte dos critérios.

## Superfícies
- website público;
- login;
- área privada por cada papel autorizado;
- administração.

## Browsers / viewports
Registar pelo menos:
- Chromium desktop;
- Firefox desktop;
- Safari desktop/mobile quando disponível;
- viewport móvel estreito;
- viewport tablet;
- viewport desktop;
- zoom 200% e 400% sem perda de conteúdo/funcionalidade.

## Teclado
- percurso completo sem rato;
- ordem de foco lógica;
- foco sempre visível;
- menu, tabs, modais e dropdowns operáveis;
- Escape fecha sobreposições quando aplicável;
- sem keyboard traps.

## Leitor de ecrã
- landmarks e headings;
- nomes acessíveis de botões/inputs;
- mensagens de erro associadas;
- estados aria-expanded, aria-current, aria-live e alerts;
- tabelas/listas compreensíveis;
- conteúdo dinâmico anunciado sem ruído excessivo.

## Visual / conteúdo
- contraste normal e large text;
- conteúdo não depende só de cor;
- reflow;
- target size;
- labels/instruções;
- mensagens em português claro;
- focus not obscured;
- reduced motion quando solicitado.

## Evidência
Cada execução deve usar `docs/accessibility/manual-evidence-template.json` e passar `validateAccessibilityExecution`; o registo geral pode depois ser ligado a `docs/operations/evidence-record-template.json`. Deve conter:
- SHA/versão;
- ambiente;
- browser/AT/viewport;
- executor e revisor;
- resultado;
- issues encontradas;
- artefacto (capturas/log);
- critério de aceitação.

Sem esse registo, BA-STD-005/031 permanecem em análise/lacuna manual.
