# 02 — Padrões de Frontend (React Router + MobX)

Referência única para `apps/web/` e `packages/`.

## 1. Split CE / core / app

```text
apps/web/
├── core/   → implementação base (componentes, stores, hooks, services)
├── ce/     → extensões; ficheiros aqui sobrepõem os de core via resolução
└── app/    → rotas file-based + layout + providers
```

- Toda feature nova vive em `core/` com a estrutura espelhada; cria-se um
  **stub** em `ce/` quando se quer poder ativar/desativar ou customizar.
- Rotas compostas por `mergeRoutes(coreRoutes, extendedRoutes)`
  (`app/routes/helper.ts`): dedup por caminho, `extended` ganha de `core`,
  merge recursivo de filhos.

## 2. Estado — MobX

```ts
export class WorklogStore implements IWorklogStore {
  worklogsMap: Record<string, TWorklog> = {};

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      worklogsMap: observable,
      addWorklog: action,
      updateWorklog: action,
      removeWorklog: action,
    });
  }

  getWorklogsByIssue = computedFn((issueId: string) =>
    Object.values(this.worklogsMap).filter((w) => w.issue === issueId)
  );

  fetchByIssue = async (slug: string, projectId: string, issueId: string) => {
    const res = await this.worklogService.list(slug, projectId, issueId);
    runInAction(() => {
      res.forEach((w) => (this.worklogsMap[w.id] = w));
    });
    return res;
  };
}
```

- Padrão: **observable map** + **actions** para mutação + **`computedFn`** para
  queries derivadas.
- O store é instanciado e agregado no `CoreRootStore`
  (`core/store/root.store.ts`); features estendidas entram via
  `ce/store/root.store.ts`.
- `resetOnSignOut()` deve limpar o novo store.

## 3. Services (`packages/services/`)

```ts
export class WorklogService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(slug: string, projectId: string, issueId: string) {
    return this.get(`/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/worklogs/`)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response;
      });
  }

  async create(slug: string, projectId: string, issueId: string, data: Partial<TWorklog>) {
    return this.post(`/api/workspaces/${slug}/projects/${projectId}/issues/${issueId}/worklogs/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response;
      });
  }
}
```

- Um service por domínio, estende `APIService` (`get/post/patch/delete` já
  prontos com axios + auth). Erros propagados via `e?.response`.

## 4. Tipos partilhados (`packages/types/`)

- Domínio tipado em `@operoz/types` (ex.: `TWorklog`, `TWorkflow`,
  `TAutomationGraph`). Os mesmos tipos descrevem payloads da API.
- Para grafos (Workflow/Rule Builder) reutilizar `TAutomationGraph`,
  `TAutomationGraphNode`, `TAutomationGraphEdge`.

## 5. React Flow — editor de grafo (reuso crítico)

Localização base: `core/components/settings/board/automation/`

- `board-automation-canvas.tsx` — canvas com `ReactFlowProvider`, `Background`,
  `Controls`, `MiniMap`, `nodeTypes`.
- `automation-utils.ts` — `flowToGraph()`/`graphToFlow()` (conversão UI ↔
  backend), `extractGraphClip()`/`pasteGraphClip()` (copy-paste),
  `removeNodeFromGraph()`/`removeEdgeFromGraph()`.

> **Workflow Designer** (feature 01) e **No-Code Rule Builder** (feature 03)
> devem extrair um canvas genérico a partir deste, parametrizando `nodeTypes` e
> o catálogo de nós — **não** criar um editor do zero.

## 6. UI e i18n

- Componentes de base em `@operoz/ui` (Button, Card, Dropdown, Table, Tabs,
  form fields). Não recriar primitivos.
- Toda string visível via `TranslationStore` (`@operoz/i18n`), chave em
  `locales/pt-BR`. Sem texto hard-coded.

## 7. Rotas

- Declarar em `app/routes/core.ts` no estilo:
  `route(":workspaceSlug/.../worklog", "./(all)/.../page.tsx")`.
- Layouts partilhados via `layout(...)`. Manter agrupamento por secção.

## 8. Gráficos e grids

- Gráficos: **Recharts** (já dependência) — burndown, velocity, pie, etc.
- Dashboards: **react-grid-layout** para drag-and-drop de gadgets.
- Tabelas densas: **TanStack React Table** + **React Virtual** para listas
  grandes.

## Anti-padrões a evitar

- ❌ Fetch direto com axios fora de um service.
- ❌ Estado de servidor em `useState` quando devia estar num store MobX.
- ❌ Reimplementar editor de grafo em vez de reusar o canvas da automação.
- ❌ Strings hard-coded sem i18n.
- ❌ Componente novo em `app/` que devia estar em `core/components`.
