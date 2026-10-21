# Revisão de interface e usabilidade

Âmbito: home, admin e área privada. Inspeção de código, CSS e markup; não confundir com teste visual em browser, auditoria WCAG ou pesquisa com utilizadores.

## Problemas corrigidos

- Home mobile: seletores de cartões destacados e posteriores mantinham spans de desktop por maior especificidade, incluindo Programas e Agenda. A regra final mobile define uma única coluna real e prevalece também sobre os destaques, evitando cartões estreitos e texto partido.

- Parceiros e colaboradores no admin estavam aninhados dentro de Contacto, que ficava oculto ao navegar. Corrigido o fecho da secção e acrescentada uma regressão para garantir painéis independentes.

- Área misturava apresentação pública com operação: passou para navegação lateral e cartões segundo o admin, com visão geral e atalhos.
- Formulários de sessão/pessoa ficavam abaixo das listas: editores aparecem antes da lista, com foco no primeiro campo, ação de fechar e cancelamento.
- Seleções múltiplas exigiam teclas Ctrl/Command: substituídas por caixas de seleção com rótulos e áreas de toque.
- Agenda acumulava sessões antigas sem distinção: filtros de próximas/histórico/canceladas/todas, pesquisa e filtro por aluno.
- Pessoas: filtros por tipo, pesquisa também por número de sócio/disciplinas e campos específicos do perfil.
- Avaliações: data pedagógica separada da data de registo; escala/origem explícitas, opção qualitativa e mensagem quando faltam comparáveis.
- Erro de carregamento da conta confundia-se com acesso pendente: estado e ação de tentar novamente agora distinguem falha de serviço e perfil pendente.
- Admin: nomes acessíveis nos botões, foco inicial/retorno e Escape/ciclo de teclado nos modais, escaping em tabelas/previews.
- Home: campos com limites e descrições de erro, prevenção de submissão duplicada, aviso para evitar informação sensível e movimento reduzido.
- Mobile: navegação horizontal, campos empilhados, cartões e botões adaptáveis; tabelas com scroll e cabeçalhos sem reduzir texto a tamanhos ilegíveis.

## Validação que permanece necessária

Testar em browser real a 320/375/768/1440 px, zoom 200–400%, teclado, leitor de ecrã, contraste e foco; testar com aluno, encarregado, explicador, coordenação, sócio e admin. Confirmar tarefas sem assistência e rever linguagem com representantes dos perfis. Nenhum resultado destes testes foi inventado. Os testes HTTP e em emulador verificam renderização, headers, API e autorização, não aparência final ou experiência humana.

## Navegação mobile da área — 21/10/2026

Substituída a faixa horizontal de módulos por cabeçalho compacto fixo e menu expansível. O módulo atual fica identificado; as opções aparecem em duas colunas, ou uma em ecrãs muito estreitos. A escolha fecha o menu, leva o conteúdo para o início e coloca o foco no main; Escape fecha o menu e devolve o foco ao botão. Os links para o website/admin ficam dentro do menu. A navegação mantém as permissões por perfil e regressa à visão geral quando a conta muda.

Verificação: lint sem cache e compilação de produção. Os estados de abertura/fecho e a adaptação mobile foram revistos no código; não foi realizado teste visual/interativo em browser nesta execução.
