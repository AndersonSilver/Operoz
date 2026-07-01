---
name: api-design
description: Projeta ou revisa contratos de API REST/GraphQL — recursos, versionamento, paginação, erros, autenticação. Use quando o usuário pedir para "desenhar uma API", "criar endpoints para", "revisar esse contrato de API", ou estiver definindo como frontend e backend (ou dois serviços) vão se comunicar.
---

# Design de API

## Antes de desenhar endpoints

Identifique os recursos (substantivos) do domínio, não as ações. "Criar pedido",
"cancelar pedido", "listar pedidos do usuário" são todas operações sobre o recurso
`order` — não três coisas desconexas.

## REST

- Recursos no plural: `/orders`, `/orders/:id`, `/orders/:id/items`.
- Verbo HTTP carrega a semântica: `GET` (leitura, sem efeito colateral), `POST`
  (criação/ação), `PUT` (substituição completa), `PATCH` (atualização parcial),
  `DELETE` (remoção). Não crie `/orders/cancel` — use `POST /orders/:id/cancel`
  quando a ação não mapeia limpo para CRUD, mas mantenha o recurso no path.
- Filtros, ordenação e paginação via query string: `GET /orders?status=paid&page=2`.
- Um endpoint retorna um formato de recurso consistente — não varie a forma da
  resposta dependendo de query params (isso quebra consumidores).

## Contrato de resposta

```json
// sucesso
{ "data": { ... } }

// lista
{ "data": [...], "pagination": { "page": 1, "per_page": 20, "total": 134 } }

// erro
{ "error": { "code": "ORDER_NOT_FOUND", "message": "Pedido não encontrado" } }
```

- `code` é uma string estável que o cliente pode usar programaticamente; `message`
  é para humano/log, pode mudar de texto sem quebrar integração.
- Status HTTP sempre condizente: não retorne 200 com `{ error: ... }` no corpo.

## Versionamento

- Prefixo de versão no path (`/v1/...`) para contratos públicos, ou header
  (`Accept: application/vnd.api+json;version=1`) se o time preferir esse estilo —
  escolha um e seja consistente no projeto todo.
- Mudança breaking (remover campo, mudar tipo, mudar semântica) sempre em nova
  versão. Adicionar campo opcional novo não é breaking e não precisa de nova versão.
- Depreciar com aviso e prazo antes de remover — nunca quebre um consumidor sem
  aviso prévio quando você não controla quem consome.

## Autenticação e autorização

- Autenticação via header (`Authorization: Bearer <token>`), nunca token sensível em
  query string (fica em logs de acesso e histórico do browser).
- Documente explicitamente, por endpoint, quem pode chamar (papel/permissão) — não
  deixe implícito.

## GraphQL (quando aplicável)

- Schema modela o domínio, não a tela específica de um cliente — evite campos
  criados só para uma UI específica.
- Pagination via cursor (`Relay-style connections`) para listas que podem crescer,
  não offset simples.
- Cuidado com N+1 em resolvers — use dataloader/batching por padrão em campos que
  resolvem relação.
- Erros parciais: decida e documente como o schema representa erro de campo
  individual vs erro da query inteira.

## Documentação do contrato

Todo endpoint novo/alterado documentado (OpenAPI/Swagger para REST, schema+
descrições para GraphQL) como parte da mesma mudança — não como tarefa separada
"depois". Contrato sem documentação é contrato que ninguém confia.

## Checklist final

- [ ] Nomes de recursos são substantivos, verbos HTTP corretos
- [ ] Paginação em toda listagem que pode crescer
- [ ] Formato de erro consistente com o resto da API
- [ ] Mudança é backward-compatible, ou está numa nova versão com deprecação avisada
- [ ] Autenticação/autorização explícita por endpoint
- [ ] Contrato documentado
