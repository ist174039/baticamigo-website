# Fronteira entre conteúdo público e plataforma privada

## Coleções públicas editoriais

O website público pode ler diretamente apenas:
- `site_config`
- `membros`
- `parceiros`
- `eventos`
- `programas`
- `agenda`
- `noticias`

Estas coleções são conteúdo editorial destinado à publicação. Não devem receber perfis privados, dados pedagógicos, dados de famílias ou outros dados operacionais da plataforma.

## Contactos

O formulário público envia para `/api/contact`. A coleção `contato` não aceita acesso anónimo pelo SDK Firestore. O CMS administrativo pode consultar e gerir contactos apenas como administrador autenticado.

## Plataforma privada

Coleções com prefixo `platform_` são sempre mediadas pela API server-side/Admin SDK e não têm acesso direto pelo browser.

## CMS

O CMS legado continua a usar o SDK Firebase para conteúdo editorial e media, mas as Security Rules limitam mutações a administradores BaticAmigo verificados por claim ou conta persistida ativa.

## Gate

Qualquer nova coleção pública exige atualização explícita das Rules, deste inventário e dos testes. Nunca reutilizar uma coleção pública para dados privados.
