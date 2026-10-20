# Inventário de dados e decisões de privacidade — rascunho

| Classe | Uso observado | Acesso técnico | Retenção / base legal |
| --- | --- | --- | --- |
| Contactos do website | Responder a pedidos | Admin / regras legadas por verificar | Por decidir pelo responsável |
| Contas e perfis | Acesso, identificação e relações | API por papel; Firebase Auth | Por decidir |
| Alunos/encarregados | Apoio escolar e relação familiar | Próprio / educandos / explicadores atribuídos / gestão | Por decidir; validar representação e salvaguarda |
| Sessões/presenças/justificações | Agendamento e assiduidade | Apenas âmbito associado e gestão | Por decidir |
| Avaliações/lacunas/resultados escolares | Acompanhamento pedagógico | Apenas âmbito associado e gestão | Por decidir; sem previsão nem decisão automatizada |
| Materiais/documentos/mensagens | Comunicação e apoio | API por destinatário; links externos têm permissões próprias | Por decidir |
| Sócios e histórico | Situação associativa, sem pagamentos | Próprio sócio e gestão | Por decidir |
| Auditoria | Integridade e revisão de alterações | Admin SDK; Rules/IAM remoto por verificar | Por decidir; não há prazo universal para logs |
| Imagens/conteúdo público | Divulgação da associação | Leitura pública, publicação administrativa | Autorização, origem e direitos por verificar |

Não registar dados pessoais reais em testes, PRs, logs ou screenshots. Credenciais privadas apenas no servidor. Antes de decidir retenção, identificar responsável pelo tratamento, finalidades/bases, titulares, destinatários, contratos de subcontratação, localização/transferências e necessidade de avaliação de impacto. A política de retenção não é preenchida com prazos inventados. Pedidos de acesso/correção/eliminação devem ser validados pelo responsável; não criar eliminação automática sem política aprovada e bloqueios legais.
