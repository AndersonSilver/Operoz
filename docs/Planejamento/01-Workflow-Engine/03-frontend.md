# 03 — Frontend · Workflow Engine

Padrões em [`00-VISAO-GERAL/02-padroes-frontend.md`](../00-VISAO-GERAL/02-padroes-frontend.md).

## Reuso do canvas React Flow (decisão central)

O editor de workflow **não** é construído do zero. Extrai-se um canvas genérico
a partir de `core/components/settings/board/automation/board-automation-canvas.tsx`:

```text
core/components/workflow/
├── canvas/
│   ├── workflow-canvas.tsx        # wrapper sobre ReactFlowProvider
│   ├── nodes/
│   │   └── state-node.tsx         # nó = State (cor por grupo)
│   ├── edges/
│   │   └── transition-edge.tsx    # aresta = transição (label = nome)
│   └── workflow-flow-utils.ts     # flowToWorkflowGraph / workflowGraphToFlow
├── transition-inspector.tsx       # painel lateral: condições/validadores/PF
└── workflow-publish-bar.tsx       # draft badge + botão publicar
```

- `flowToWorkflowGraph`/`workflowGraphToFlow` espelham `flowToGraph`/`graphToFlow`
  da automação. Nós = estados; arestas = transições com `data.conditions`,
  `data.validators`, `data.postFunctions`.
- `nodeTypes = { state: StateNode }`; cor do nó deriva do `group` do estado
  (backlog/started/done) usando o tema do `@operis/ui`.

## Store MobX

```text
core/store/workflow/workflow.store.ts   → WorkflowStore
ce/store/root.store.ts                   → regista WorkflowStore
```

```ts
export class WorkflowStore implements IWorkflowStore {
  workflowsMap: Record<string, TWorkflow> = {};
  graphByWorkflow: Record<string, TWorkflowGraph> = {};

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      workflowsMap: observable, graphByWorkflow: observable,
      fetchWorkflows: action, saveGraph: action, publish: action,
    });
  }

  saveGraph = async (slug: string, id: string, graph: TWorkflowGraph) => {
    const saved = await this.service.putGraph(slug, id, graph);
    runInAction(() => { this.graphByWorkflow[id] = saved; });
  };
}
```

## Service

`packages/services/src/workflow/workflow.service.ts` estende `APIService`:
`list`, `retrieve`, `create`, `update`, `getGraph`, `putGraph`, `publish`,
`listSchemes`, `saveScheme`.

## Tipos (`@operis/types`)

Reutilizar a forma de `TAutomationGraph`:

```ts
export type TWorkflowGraph = {
  nodes: { id: string; data: { state_id: string } }[];
  edges: { id: string; source: string; target: string;
           data: { name: string; is_global: boolean;
                   conditions: TTransitionRule[];
                   validators: TTransitionRule[];
                   post_functions: TTransitionRule[] } }[];
};
export type TTransitionRule = { type: string; config: Record<string, unknown> };
```

## Rotas (`app/routes/core.ts`)

```text
:workspaceSlug/settings/workflows                 → lista
:workspaceSlug/settings/workflows/:workflowId     → designer
:workspaceSlug/settings/workflow-schemes          → schemes
```

Adicionar entrada nas settings do workspace (perto de `settings/boards`).

## Issue detail — botão de transição

No detalhe da issue, o seletor de estado passa a mostrar **transições válidas**
(via `GET .../transitions/`). Ao escolher uma transição com `screen`, abre modal
com os campos pedidos antes de chamar `.../execute/`.

## i18n (pt-BR)

Chaves em `locales/pt-BR`: `workflow.designer.title`, `workflow.publish`,
`workflow.transition.condition.assignee_only`, `workflow.validator.required`,
`workflow.execute.error.condition`, etc. Sem texto hard-coded.

## UX

- Designer com `MiniMap` + `Controls` + `Background` (já no canvas base).
- Draft badge visível; publicar pede confirmação e mostra erros de validação do
  grafo (estado órfão, sem inicial).
- Inspector lateral só aparece com transição selecionada (segue padrão do
  inspector da automação).
