// BaticAmigo manual: descriptions are based on actual navigation and routes,
// not copied from any other association's member, family or operational records.
export const manualGuides=[
{ id:"acesso",group:"Começar",title:"Iniciar sessão e escolher o espaço",roles:[],module:"overview",location:"/platform/login",
  prerequisites:["Conta ativa atribuída pela associação","Email confirmado e palavra-passe pessoal"],
  steps:[
    ["Abrir a plataforma","Aceda ao website e escolha Área reservada ou abra /platform/login.","O ecrã de autenticação apresenta Email e Palavra-passe.","Se a página não carregar, não tente introduzir credenciais em ligações alternativas."],
    ["Autenticar","Escreva o seu email e palavra-passe e escolha Entrar.","A conta é validada no Firebase e a plataforma apresenta apenas espaços autorizados.","Se falhar, use Recuperar acesso; não partilhe a palavra-passe."],
    ["Escolher o destino","Escolha Plataforma BaticAmigo para as suas tarefas; a Gestão do site só aparece para administradores autorizados.","A área é aberta com os menus permitidos para o perfil.","Se aparecer um destino estranho ao seu perfil, contacte a coordenação."],
    ["Navegar","Na barra lateral abra o grupo pretendido e selecione uma funcionalidade.","A área principal muda sem expor funcionalidades não autorizadas.","Se faltar um menu, peça confirmação das permissões, não tente contornar a navegação."],
    ["Terminar sessão","No menu da conta escolha Terminar sessão ao concluir o trabalho.","A sessão é terminada, sobretudo importante em computadores partilhados.","Se a sessão não terminar, feche o separador e comunique o problema."]
  ],decision:["O espaço pretendido está disponível?","Abra o módulo autorizado.","Confirme os perfis e permissões com a administração."],tip:"Cada pessoa deve utilizar a sua própria conta.",warning:"Nunca envie palavras-passe, códigos de acesso ou dados pessoais por mensagem."},
{ id:"perfis",group:"Pessoas e permissões",title:"Criar e gerir pessoas e perfis",roles:["admin","coordinator"],module:"profiles",location:"/area?tab=profiles",
  prerequisites:["Conta com permissão de gestão de pessoas","Identificação mínima e relação familiar autorizada, se aplicável"],
  steps:[
    ["Abrir Pessoas","Na área reservada selecione Pessoas e perfis.","Aparece a lista de registos disponíveis.","Se faltar o menu, confirme permissões."],
    ["Pesquisar duplicados","Filtre por tipo de perfil e procure o nome antes de criar.","Evita-se duplicar alunos, encarregados ou explicadores.","Não crie um segundo registo para corrigir um primeiro."],
    ["Adicionar pessoa","Escolha Adicionar pessoa e preencha o tipo, nome e campos relevantes.","Os campos apresentados correspondem ao tipo de registo.","Se faltarem campos obrigatórios, não guarde um registo incompleto."],
    ["Relacionar pessoas","Para alunos, associe encarregados; para explicadores, indique as competências e disponibilidade.","As relações e atributos ficam coerentes com o perfil.","Não associe um menor a um encarregado sem legitimidade verificada."],
    ["Guardar e verificar","Guarde, regresse à lista e abra os detalhes.","O novo registo aparece com o estado esperado.","Se falhar, reveja as mensagens e não repita a operação cegamente."]
  ],decision:["O registo já existe?","Edite o existente.","Crie um novo apenas após verificar os dados."],tip:"Dados de contacto devem ser reduzidos ao mínimo necessário.",warning:"Os dados de menores exigem validação reforçada e acesso limitado."},
{ id:"contas",group:"Pessoas e permissões",title:"Contas, perfis de acesso e permissões",roles:["admin"],module:"access",location:"/area?tab=access",
 prerequisites:["Papel de administração","Autorização para criar ou alterar acessos"],
 steps:[
  ["Abrir gestão de acessos","Na área reservada selecione Perfis e permissões.","São apresentados os perfis e os módulos autorizados.","Se não tiver o módulo, não use ligações diretas."],
  ["Criar conta","Na gestão de utilizadores escolha criar conta, indique email e perfil ou perfis.","As permissões são calculadas a partir dos perfis e das configurações centrais.","Não conceda Administração por conveniência."],
  ["Associar pessoa","Associe registos existentes ou crie os estritamente necessários.","A conta fica ligada a pessoas compatíveis com os seus papéis.","Verifique relações antes de ativar."],
  ["Rever o resumo","Confirme os menus, permissões e formas de envio do convite.","A revisão evita atribuições indevidas.","Se o resumo mostrar acessos excessivos, volte atrás."],
  ["Testar acesso","Peça ao utilizador que entre e confirme os menus devidos.","A experiência corresponde ao perfil aprovado.","Revogue imediatamente acessos inesperados."]
 ],decision:["A conta precisa mesmo da permissão pedida?","Conceda apenas o âmbito necessário.","Mantenha acesso restrito ou peça aprovação."],tip:"Atribua o menor privilégio possível.",warning:"A visibilidade de um menu não substitui verificação de autorização no servidor."},
{ id:"sessoes",group:"Acompanhamento educativo",title:"Agendar, editar e repetir sessões",roles:["admin","coordinator"],module:"sessions",location:"/area?tab=sessions",
 prerequisites:["Alunos e explicador ativos","Sala e horário definidos"],
 steps:[
  ["Abrir Agenda","Selecione Sessões e presenças.","É apresentado o calendário comum.","As presenças privadas devem continuar restritas."],
  ["Iniciar agendamento","Selecione Agendar sessão e preencha título, data, início, fim e sala.","O formulário explica os campos da sessão.","Se a data/hora forem inválidas, corrija antes de guardar."],
  ["Escolher participantes","Escolha explicador e alunos atribuídos.","Os nomes selecionados correspondem à sessão.","Não associe participantes sem autorização."],
  ["Definir recorrência","Quando necessário, escolha repetir e a periodicidade permitida.","As ocorrências previstas surgem para revisão.","Verifique conflitos de sala, aluno e explicador."],
  ["Rever e guardar","Confirme o resumo final e guarde.","A sessão aparece no calendário com as informações corretas.","Se houver conflito, altere o horário em vez de criar duplicados."],
  ["Editar ou cancelar","Abra os detalhes de uma sessão e use as ações permitidas.","O estado é atualizado e fica rastreável.","Não elimine o histórico de presença para corrigir horários."]
 ],decision:["Existe conflito no horário?","Se não existir, confirme o agendamento.","Se existir, reagende antes de guardar."],tip:"Confirme fusos horários e ocorrências repetidas.",warning:"Um calendário partilhado não autoriza divulgar participantes de sessões alheias."},
{ id:"presencas",group:"Acompanhamento educativo",title:"Registar presenças, faltas e justificações",roles:["admin","coordinator","tutor","volunteer","guardian"],module:"sessions",location:"/area?tab=sessions",
 prerequisites:["Sessão atribuída e autorizada","Participantes previamente associados quando necessário"],
 steps:[
  ["Encontrar sessão","Abra Sessões e presenças e localize a data.","O calendário mostra as sessões disponíveis.","Se a sessão não aparecer, confirme os filtros."],
  ["Abrir detalhes","Selecione a sessão para consultar dados e participantes autorizados.","Os participantes visíveis respeitam o seu papel.","Não tente obter informação de outra turma/educando."],
  ["Registar presença","Quando autorizado, marque Presente, Falta ou Falta justificada.","O estado fica associado à sessão e ao aluno.","Se a sessão não tiver começado ou o acesso for negado, não force o registo."],
  ["Justificar ausência","No módulo Justificações, indique a sessão, o motivo e eventual comprovativo.","A justificação fica ligada à falta correta.","Evite documentos e detalhes pessoais desnecessários."],
  ["Verificar","Reabra o histórico e confirme o estado atualizado.","O resultado é visível apenas aos perfis autorizados.","Se existirem divergências, peça correção à coordenação."]
 ],decision:["O utilizador está autorizado a alterar presenças?","Registe a alteração e confirme.","Consulte apenas a informação permitida."],tip:"Ajuste o registo assim que houver evidência.",warning:"Não partilhe dados de presenças de outros alunos."},
{ id:"trabalhos",group:"Acompanhamento educativo",title:"Publicar trabalhos e materiais",roles:["admin","coordinator","tutor","volunteer","student","guardian"],module:"assignment",location:"/area?tab=assignment",
 prerequisites:["Aluno e relação autorizada","Documento ou URL HTTPS autorizado, se aplicável"],
 steps:[
  ["Abrir Trabalhos","Selecione Trabalhos na área reservada.","Os registos que pode consultar são apresentados.","Se não existir acesso, confirme a relação com o aluno."],
  ["Criar registo","Se tiver permissão, selecione Adicionar trabalho e escolha o aluno.","É aberto o painel lateral de registo.","Se não puder criar, não será apresentada a ação."],
  ["Preencher conteúdo","Indique título, descrição, prazo e anexo ou URL permitido.","Os campos têm validação de obrigatoriedade e limites.","Não envie dados de alunos errados."],
  ["Definir partilha","Escolha perfis e/ou pessoas autorizadas a ver o trabalho.","A partilha limita o público destinatário.","Não selecione todos os perfis por defeito."],
  ["Guardar e rever","Guarde e abra novamente o registo.","O trabalho e o prazo são visíveis aos destinatários esperados.","Se o anexo falhar, confirme tamanho/formato antes de repetir."]
 ],decision:["O conteúdo deve ser acessível a todos os perfis?","Escolha apenas quem necessita dele.","Restrinja a partilha e confirme."],tip:"Use prazos explícitos e instruções concisas.",warning:"Ficheiros externos devem ter permissões compatíveis com a plataforma."},
{ id:"avaliacoes",group:"Acompanhamento educativo",title:"Avaliações e evolução do aluno",roles:["admin","coordinator","tutor","volunteer","student","guardian"],module:"assessment",location:"/area?tab=assessment",
 prerequisites:["Relação com o aluno e autorização aplicável","Disciplina, período e origem conhecidos"],
 steps:[
  ["Abrir Avaliações","Selecione Avaliações e escolha o aluno autorizado.","Aparecem as avaliações com data, origem e período.","Se surgir um aluno alheio, reporte incidente."],
  ["Adicionar avaliação","Utilizador autorizado escolhe Nova avaliação.","É aberto o painel de registo.","Se não possuir permissão, consulte apenas."],
  ["Preencher escala","Introduza disciplina, período, origem e data; utilize resultado qualitativo ou numérico com escala.","A avaliação preserva a escala original.","Não converta escalas implicitamente."],
  ["Indicar próximos passos","Registe lacunas e observações de melhoria sustentadas.","O histórico fica descritivo e rastreável.","Evite rótulos pessoais ou dados sensíveis."],
  ["Consultar evolução","Na área Evolução do aluno, compare avaliações e informação associada.","São mostradas tendências e evidências, sem conclusões automáticas indevidas.","Na falta de amostras, não infira progressos."],
  ["Confirmar o histórico","Reabra a avaliação e reveja data, escala e origem.","A informação permanece íntegra.","Se houver erro, solicite correção com rastreabilidade."]
 ],decision:["Há evidência suficiente para conclusão?","Registe apenas o que a evidência sustenta.","Indique cobertura insuficiente e recolha dados adequados."],tip:"Uma síntese é apoio à revisão humana, não uma decisão automática.",warning:"Avaliações de menores não devem aparecer fora das suas relações autorizadas."},
{ id:"mensagens",group:"Comunicação",title:"Mensagens, avisos e documentos pedagógicos",roles:[],module:"message",location:"/area?tab=message",
 prerequisites:["Conta ativa","Destinatários determinados por relação e permissão"],
 steps:[
  ["Abrir mensagens","Selecione Mensagens no menu Comunicação.","Aparecem os registos disponíveis.","Se houver informações de terceiros, interrompa a sessão."],
  ["Criar mensagem","Quando permitido, escolha Adicionar mensagem e indique destinatário e texto.","O envio fica registado na plataforma.","Não inclua palavras-passe nem dados de saúde."],
  ["Consultar avisos","Abra Avisos para rever sessões e eventos relevantes.","Os avisos refletem a informação disponível.","Os avisos da plataforma não equivalem a notificações email/push."],
  ["Abrir documentos pedagógicos","Em Documentos, expanda Documentos de acompanhamento anteriores se precisar de anexos legados.","Os registos anteriores continuam acessíveis sem migração silenciosa.","Não confunda estes registos com a biblioteca documental versionada."],
  ["Confirmar receção","Reabra a informação e confirme que ficou guardada.","O registo disponível mantém a informação esperada.","Se não surgir, reporte antes de repetir."]
 ],decision:["A mensagem contém dados de terceiros?","Partilhe apenas com o público legitimamente autorizado.","Reduza conteúdo e destinatários."],tip:"Escreva títulos explícitos e indique a ação pretendida.",warning:"A existência de um aviso não confirma a sua leitura."},
{ id:"biblioteca",group:"Biblioteca de documentos",title:"Pastas, documentos, partilha e versões",roles:[],module:"document",location:"/area?tab=document",
 prerequisites:["Conta autenticada com acesso a Documentos","Para criação: permissão de administração ou coordenação, ou delegação apropriada","Ficheiro de formato permitido e até 4 MB"],
 steps:[
  ["Entrar no arquivo","Abra Documentos e encontre Biblioteca documental.","São mostradas apenas pastas e documentos autorizados.","Se não vir documentos esperados, confirme a partilha."],
  ["Criar pasta","Se autorizado, escolha Nova pasta, indique nome e localização superior.","A pasta surge na hierarquia escolhida.","Evite criar duplicados com nomes diferentes."],
  ["Configurar partilha","Na pasta ou no documento selecione perfis e contas com permissão Ver ou Editar.","Os acessos aplicam-se a perfis, pessoas e herança de pastas segundo as regras.","Nunca disponibilize documentos de menores a perfis genéricos por conveniência."],
  ["Adicionar documento","Selecione Adicionar documento, escolha pasta, categoria, título, descrição e ficheiro.","O documento é guardado como versão 1 e aparece na lista.","Se o ficheiro falhar a validação, confirme formato e tamanho."],
  ["Pesquisar e consultar","Pesquise por título/descrição, filtre categoria e abra o documento.","O painel mostra os metadados e o histórico de versões.","Se não tiver acesso, o servidor deve recusar a leitura."],
  ["Editar","No detalhe escolha Editar documento, altere título, categoria, pasta ou permissões permitidas.","Os metadados atualizam-se sem substituir as versões antigas.","Uma alteração concorrente exige atualizar os detalhes."],
  ["Nova versão","Escolha Adicionar nova versão e carregue outro ficheiro.","O histórico preserva a versão anterior e incrementa o número.","Não substitua diretamente ficheiros no Storage."],
  ["Ver ou descarregar","Escolha uma versão e use Ver ou Descarregar.","Obtém apenas o ficheiro correspondente a essa versão.","Se for negado o acesso, peça revisão de permissões."],
  ["Remover documento","Selecione Remover e confirme no painel lateral.","O documento deixa de ser apresentado aos utilizadores; o ficheiro continua retido até decisão de conservação.","Não use a remoção para contornar obrigações de retenção."]
 ],decision:["A pessoa deve ver ou editar este documento?","Atribua a permissão estritamente necessária.","Mantenha privado e não partilhe."],tip:"Use categorias, nomes e descrições pesquisáveis.",warning:"A biblioteca não é uma cópia do Microsoft Teams; é uma implementação específica com controlo de acesso próprio."},
{ id:"financas",group:"Associação",title:"Gestão financeira e histórico associativo",roles:["admin","coordinator","member"],module:"finance",location:"/area?tab=finance",
 prerequisites:["Conta com permissão de consultar finanças","Registos financeiros preparados pela associação"],
 steps:[
  ["Abrir finanças","Selecione Área financeira na área reservada.","O módulo mostra a informação permitida para o perfil.","Se o módulo não existir, não use API diretamente."],
  ["Consultar registos","Use filtros por período e situação, quando disponíveis.","A lista mostra apenas movimentos autorizados.","Não interprete ausência de dados como saldo zero."],
  ["Registar movimento","Utilizadores autorizados escolhem o tipo de movimento e preenchem valor e contexto.","O registo fica associado ao histórico.","Evite entradas duplicadas."],
  ["Rever e confirmar","Abra detalhes, valide valor, situação e a associação correta.","Os movimentos ficam rastreáveis.","Se houver divergência, peça reconciliação."],
  ["Exportar relatório","Quando permitido, use as ações de impressão/exportação.","O relatório reflete os filtros ativos.","Evite descarregar relatórios em equipamentos partilhados."]
 ],decision:["O valor foi reconciliado?","Confirme o histórico.","Não registe pagamento duplicado; peça revisão."],tip:"Separe obrigações, recebimentos e registos associativos.",warning:"Nenhuma operação financeira deve ser tratada como pagamento confirmado sem prova."},
{ id:"relatorios",group:"Análise",title:"Relatórios, filtros e exportação",roles:["admin","coordinator"],module:"reports",location:"/area?tab=reports",
 prerequisites:["Permissão para relatórios","Dados suficientes e filtros definidos"],
 steps:[
  ["Abrir relatórios","Selecione Relatórios.","São apresentados filtros e indicadores agregados.","Se os dados não carregarem, não use valores antigos."],
  ["Definir âmbito","Escolha período, aluno/grupo autorizado e indicadores.","A seleção delimita o conjunto analisado.","Evite grupos pequenos que permitam identificação indevida."],
  ["Consultar evolução","Compare assiduidade, avaliações e cobertura segundo o contexto.","Os denominadores e janelas temporais são explícitos.","Não conclua causalidade sem evidência."],
  ["Exportar","Escolha impressão/guardar PDF ou CSV conforme o módulo.","O ficheiro contém apenas os dados autorizados.","Guarde em local protegido."],
  ["Validar resultados","Compare com a origem e registe divergências.","O relatório suporta análise humana.","Se divergir, não publique até reconciliação."]
 ],decision:["Os dados são suficientes e autorizados?","Utilize o relatório com ressalvas adequadas.","Restrinja o resultado ou não exporte."],tip:"Identifique sempre os filtros aplicados.",warning:"Relatórios agregados podem revelar pessoas em grupos muito pequenos."},
{ id:"site",group:"Gestão do website",title:"Gerir eventos, programas, notícias e contactos",roles:["admin"],module:"overview",location:"/admin/dashboard",
 prerequisites:["Conta administrativa ativa","Direitos de publicação e dos materiais confirmados"],
 steps:[
  ["Abrir a gestão","No seletor da plataforma escolha Gestão do site.","Aparece o painel administrativo.","Se o destino não surgir, confirme a autorização."],
  ["Escolher secção","Abra Eventos, Programas, Agenda, Notícias, Membros, Parceiros ou Contacto.","A gestão mostra o contexto da secção.","Não introduza dados privados de membros em conteúdos públicos."],
  ["Criar ou editar","Escolha adicionar/editar e preencha o painel lateral com campos e media adequados.","O formulário valida os campos e guarda o registo.","Se um ficheiro falhar, confirme direitos e limites."],
  ["Rever publicação","Volte à listagem e confirme o estado e o conteúdo exibido.","A informação pública é coerente com o que foi aprovado.","Se conteúdo não estiver aprovado, mantenha-o não publicado."],
  ["Verificar no site","Abra Ver site e confira a apresentação em desktop e telemóvel.","A informação publicada aparece corretamente.","Se não aparecer, verifique o estado de publicação e o ambiente."]
 ],decision:["O conteúdo pode ser público?","Publique após revisão.","Mantenha privado ou não publique."],tip:"Use imagens com titularidade/autorização verificada.",warning:"Nunca publique dados pessoais ou imagens de menores sem base e autorização adequadas."},
{ id:"painel",group:"Navegação e apoio",title:"Utilizar painéis laterais longos",roles:[],module:"overview",location:"/area",
 prerequisites:["Área disponível e uma ação para abrir detalhes ou edição"],
 steps:[
  ["Abrir detalhes","Selecione Ver detalhes, Editar, Adicionar ou Configurar no módulo.","Abre um painel lateral contextual.","Se não surgir, confirme se há erros e as permissões."],
  ["Identificar a ação","Leia título, descrição e informação do cabeçalho.","Sabe se está a consultar ou alterar informação.","Se a ação não for clara, feche sem guardar."],
  ["Percorrer formulário","Use a região de conteúdo com scroll; a barra de ações permanece visível no novo componente.","Campos longos ficam dentro da área do painel.","Se um elemento sair dos limites, registe viewport e módulo."],
  ["Guardar ou cancelar","Na barra inferior escolha Guardar ou Cancelar.","A ação é compreensível e os botões permanecem dentro do ecrã.","Se houver erro, corrija sem perder os dados já introduzidos."],
  ["Fechar e voltar","Use Fechar ou Escape; verifique o retorno ao contexto anterior.","O foco regressa ao elemento anterior quando suportado.","Se o foco se perder, comunique a anomalia."]
 ],decision:["Precisa apenas de consultar?","Abra Detalhes sem alterações.","Use o painel de edição apenas se autorizado."],tip:"Em telemóvel o painel ocupa toda a largura para evitar colunas comprimidas.",warning:"Os painéis antigos estão a ser migrados; reporte os casos que ainda apresentem overflow."}
];

manualGuides.push(
{id:"materiais",group:"Acompanhamento educativo",title:"Adicionar e partilhar materiais de apoio",roles:["admin","coordinator","tutor","volunteer","student","guardian"],module:"material",location:"/area?tab=material",
 prerequisites:["Aluno ou grupo autorizado","Material e respetivos direitos de utilização confirmados"],
 steps:[
 ["Abrir materiais","Selecione Materiais na navegação da plataforma.","A listagem apresenta os materiais partilhados consigo.","Se não encontrar um material, confirme os filtros e permissões."],
 ["Preparar conteúdo","Tenha um título descritivo, uma explicação breve e um ficheiro ou URL HTTPS permitido.","O material está pronto para publicação limitada.","Não envie dados identificativos de alunos para serviços externos."],
 ["Criar ou editar","Quando autorizado, escolha Adicionar material ou Editar e selecione o destinatário.","Abre o formulário de registo com os campos próprios.","Não copie material com direitos não confirmados."],
 ["Definir destinatários","Escolha os perfis e pessoas que podem consultar o conteúdo.","O destinatário e a regra de partilha ficam explícitos.","Não exponha o conteúdo a todos por defeito."],
 ["Validar e guardar","Confirme o anexo, título e partilha, guarde e reabra os detalhes.","O material aparece na área do público autorizado.","Se falhar o upload, confirme formato e limite antes de repetir."]
 ],decision:["O destinatário tem direito ao material?","Partilhe e confirme.","Restrinja o conteúdo até obter autorização."],tip:"Um título claro e uma descrição breve reduzem erros de seleção.",warning:"O acesso a materiais ligados a alunos continua limitado por relações autorizadas."},
{id:"justificacoes",group:"Acompanhamento educativo",title:"Submeter e consultar justificações de faltas",roles:["admin","coordinator","tutor","volunteer","student","guardian"],module:"justification",location:"/area?tab=justification",
 prerequisites:["Sessão e aluno associados","Razão da justificação conhecida e permitida"],
 steps:[
 ["Abrir justificações","Selecione Justificações no grupo Acompanhamento.","São mostrados os registos a que tem acesso.","Se faltar o módulo, confirme o perfil."],
 ["Localizar ausência","Filtre os registos e confirme o aluno e a sessão aplicáveis.","Não se misturam ausências de pessoas diferentes.","Não utilize dados de outros alunos."],
 ["Adicionar justificação","Quando autorizado, indique título e motivo suficiente.","O formulário associa a justificação à pessoa certa.","Evite recolher informação clínica desnecessária."],
 ["Anexar prova","Se indispensável, selecione ficheiro com formato e tamanho permitidos.","O anexo fica protegido pela mesma regra de partilha.","Se existir informação sensível, procure alternativa menos intrusiva."],
 ["Guardar e acompanhar","Confirme os campos e guarde. Volte ao histórico para verificar o resultado.","O estado do registo mantém-se consultável.","Se persistirem dúvidas, peça revisão à coordenação."]
 ],decision:["A justificação exige comprovativo?","Anexe apenas o mínimo necessário.","Não recolha documentação extra."],tip:"Descreva o motivo com a precisão suficiente e sem detalhes excessivos.",warning:"Não assuma que submeter uma justificação altera automaticamente o estado de presença."},
{id:"avisos",group:"Comunicação",title:"Consultar avisos e notificações da plataforma",roles:[],module:"notifications",location:"/area?tab=notifications",
 prerequisites:["Conta ativa","Permissão de acesso à área de comunicação"],
 steps:[
 ["Abrir avisos","Selecione Avisos na navegação.","Aparece o resumo de sessões, mensagens e trabalhos relevantes.","Se não houver avisos, não conclua que não há tarefas pendentes."],
 ["Rever sessões","Abra a contagem de sessões futuras e selecione Abrir agenda.","O calendário mostra os próximos horários autorizados.","Se o horário estiver incorreto, confirme com a coordenação."],
 ["Consultar mensagens","Abra as mensagens disponíveis e identifique eventuais pedidos de resposta.","Os avisos estão ligados à funcionalidade de origem.","Não responda através de canais externos sem autorização."],
 ["Ver trabalhos","Consulte as tarefas com prazo em curso e abra Trabalhos.","Os prazos são comparáveis com os registos de origem.","Se o prazo divergir, confirme o registo e comunique o erro."],
 ["Confirmar resultado","Regresse ao módulo de origem para verificar informação atualizada.","A consulta reflete os registos disponíveis.","Um aviso não garante envio de email ou confirmação de leitura."]
 ],decision:["Um aviso exige ação?","Abra o módulo de origem e conclua a ação permitida.","Mantenha-o apenas como informação contextual."],tip:"Use sempre o módulo de origem para operações reais.",warning:"A funcionalidade de email/push não deve ser considerada concluída sem evidência."},
{id:"evolucao",group:"Acompanhamento educativo",title:"Interpretar a evolução e os indicadores do aluno",roles:["admin","coordinator","tutor","volunteer","student","guardian"],module:"progress",location:"/area?tab=progress",
 prerequisites:["Avaliações registadas com período e origem","Permissão para consultar o aluno ou educando"],
 steps:[
 ["Abrir Evolução","No menu Acompanhamento selecione Evolução.","Aparecem os indicadores de aprendizagem disponíveis para a pessoa autorizada.","Se surgirem alunos não associados, interrompa e comunique."],
 ["Selecionar período","Escolha, quando disponível, a janela e a disciplina.","A série de dados corresponde ao período escolhido.","Comparações com intervalos diferentes podem induzir erro."],
 ["Consultar evidência","Reveja valores, escalas, avaliações e datas de origem.","Cada resultado permanece relacionado com a sua fonte.","Não compare escalas incompatíveis sem revisão humana."],
 ["Interpretar lacunas","Se houver amostra insuficiente, assinale a limitação em vez de inferir progresso.","As conclusões são proporcionais aos dados disponíveis.","Não apresente estimativas como resultados confirmados."],
 ["Encaminhar ações","Identifique reforço pedagógico ou revisão por um profissional autorizado.","O apoio utiliza indicadores de forma adequada.","Não tome decisões automatizadas de impacto sobre menores."]
 ],decision:["Existem dados suficientes e homogéneos?","Compare com contexto e revisão humana.","Mantenha a conclusão como provisória."],tip:"Observe progresso no tempo, não apenas o último valor.",warning:"Indicadores individuais e comparações entre alunos exigem controlos rigorosos de privacidade."}
);

export const manualGroups=[...new Set(manualGuides.map(g=>g.group))];
