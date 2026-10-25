# Gestão de records e classificação

Os metadados de governação são derivados no servidor e não são aceites do cliente.

| Tipo | Classificação | Categoria de retenção |
| --- | --- | --- |
| assignment | restricted | records |
| material | restricted | records |
| document | restricted | documents |
| message | restricted | messages |
| assessment | highly-restricted | records |
| justification | highly-restricted | records |

A categoria indica **qual política** deve ser aplicada, não o número de dias. Os períodos continuam vazios até existir política de retenção aprovada.

Registos mantêm autor, versão, criação e atualização. Alterações usam optimistic concurrency e deixam audit trail separado.
