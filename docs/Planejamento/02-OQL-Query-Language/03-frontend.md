# 03 — Frontend · OQL

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Componentes

```text
core/components/oql/
├── oql-editor.tsx          # CodeMirror 6 com linguagem OQL + autocomplete
├── oql-language.ts         # definição de tokens/highlight + completion source
├── oql-results.tsx         # tabela de resultados (TanStack Table + Virtual)
├── oql-error-banner.tsx    # erro de sintaxe com posição
└── advanced-search-page.tsx
```

- **CodeMirror 6** (já no projeto via editor) com:
  - syntax highlight de campos/operadores/funções/strings;
  - `autocompletion` cuja `completion source` chama `search/oql/meta/` e
    `search/oql/values/` (cacheados no store);
  - linter que chama `search/oql/validate/` com debounce e sublinha o erro na
    `position` devolvida.

## Store

```text
core/store/oql/oql.store.ts → OqlStore
```

```ts
export class OqlStore implements IOqlStore {
  meta?: TOqlMeta;
  resultsByQuery: Record<string, TIssueLite[]> = {};
  validationByQuery: Record<string, TOqlValidation> = {};

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      meta: observable, resultsByQuery: observable,
      loadMeta: action, runQuery: action, validate: action,
    });
  }
}
```

- `loadMeta` cacheia o registry público; `validate` (debounced) alimenta o
  linter; `runQuery` pagina resultados.

## Service

`packages/services/src/oql/oql.service.ts`: `run`, `validate`, `meta`,
`values`, `fromText`, `history`.

## Tipos (`@operis/types`)

```ts
export type TOqlMeta = {
  fields: { key: string; type: string; operators: string[] }[];
  functions: { name: string; args: number; example: string }[];
};
export type TOqlValidation =
  | { ok: true }
  | { ok: false; error: string; message: string; position?: number;
      suggestions?: string[] };
```

## Rotas

```text
:workspaceSlug/search/advanced   → advanced-search-page.tsx
```

Também integrar OQL como modo alternativo no painel de rich-filters existente
(toggle "Filtros | OQL"), partilhando o mesmo `View` para guardar.

## NL→OQL (F3)

- Caixa "Pergunte em linguagem natural" → `search/oql/from-text/` → preenche o
  editor com a OQL gerada (que o utilizador pode rever antes de correr).

## i18n (pt-BR)

`oql.editor.placeholder`, `oql.error.syntax`, `oql.error.unknown_field`,
`oql.nl.prompt`, etc.

## UX

- Erros mostrados inline (sublinhado + banner com posição e sugestões).
- Histórico e queries guardadas acessíveis a partir do editor.
- Resultados virtualizados para queries grandes.
