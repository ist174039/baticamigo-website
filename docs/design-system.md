# Design system — controlos mínimos

## Tokens semânticos da área privada
A área privada deve usar tokens CSS para cores funcionais e estados, em vez de repetir valores arbitrários nos componentes.

Tokens-base atuais:
- `--platform-ink`
- `--platform-forest`
- `--platform-deep`
- `--platform-orange`
- `--platform-muted`
- `--platform-line`

## Estados obrigatórios
- foco visível;
- disabled;
- erro;
- sucesso;
- estado ativo;
- hover apenas como complemento, nunca como único sinal;
- redução de movimento quando o sistema pede `prefers-reduced-motion`.

## Responsividade
A área privada define mudanças estruturais em 950/760/560/480/350 px. A conformidade visual continua dependente de execução real em browser.

## Gate
Alterações a componentes partilhados devem preservar foco, contraste suficiente, tamanhos de alvo e comportamento de mobile. Este documento não substitui auditoria WCAG.
