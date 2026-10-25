# Firebase Functions legadas — estado e decisão pendente

Estado observado em 25/10/2026:

- a aplicação atual não referencia o callable `sendEmail`;
- o formulário de contacto usa `/api/contact` no Next.js;
- `firebase.json` não declara uma source de Functions;
- `functions/` não contém package.json nem lockfile, pelo que não constitui um deployment reproduzível a partir deste repositório;
- a cópia que existia em `public/firebase-functions/` foi removida para não publicar lógica server-side como asset estático;
- o código legado remanescente foi hardenizado para email verificado e revogação via `platform_accounts`.

## Decisão necessária antes de produção

Confirmar no projeto Firebase real se existem Functions implantadas com estes nomes e, para cada uma:
1. manter e migrar para deployment versionado/reproduzível;
2. migrar a função equivalente para o runtime Next.js;
3. retirar a Function implantada após confirmar ausência de consumidores.

Não apagar uma Function real apenas porque o código atual não a referencia.

## Critério de aceitação

Responsável, decisão, inventário das Functions implantadas, versão/SHA, configuração de segredos, evidência de teste e resultado de deployment/retirement.
