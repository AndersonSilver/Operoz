# 01 — Tipos TypeScript & Store MobX

## Contexto

Antes de qualquer UI, precisamos de:

1. Atualizar os tipos para incluir relações Gantt-específicas (`start_before`, `finish_before`)
2. Adicionar estado de drag de dependência ao store base do timeline

---

## Passo 1.1 — Atualizar `TIssueRelationTypes`

**Ficheiro:** `packages/types/src/issues/issue_relation.ts`

O backend já suporta `start_before` e `finish_before` (visível em
`apps/api/operoz/app/views/issue/relation.py`), mas o tipo frontend ainda não
os declara.

```ts
// ANTES
export type TIssueRelationTypes = "blocking" | "blocked_by" | "duplicate" | "relates_to";

// DEPOIS
export type TIssueRelationTypes =
  | "blocking"
  | "blocked_by"
  | "duplicate"
  | "relates_to"
  | "start_before" // A deve terminar antes de B começar (Finish-to-Start)
  | "start_after" // B deve começar antes de A terminar  (Start-to-Start inverso)
  | "finish_before" // A deve terminar antes de B terminar (Finish-to-Finish)
  | "finish_after"; // B deve terminar antes de A terminar (Start-to-Finish)
```

> **Nota:** Para o Gantt de drag-to-link vamos usar apenas `blocked_by`
> (Finish-to-Start) que é o mais comum. Os outros tipos ficam declarados para
> uso futuro no painel de relações do issue detail.

---

## Passo 1.2 — Adicionar tipo de dependência Gantt ao `IGanttBlock`

**Ficheiro:** `packages/types/src/layout/gantt.ts`

```ts
// Adicionar ao IGanttBlock
export interface IGanttBlock {
  data: any;
  id: string;
  name: string;
  position?: { marginLeft: number; width: number };
  sort_order: number | undefined;
  start_date: string | undefined;
  target_date: string | undefined;
  meta?: Record<string, any>;

  // NOVO: IDs dos blocks que este bloco bloqueia (blocos que dependem deste)
  blocking_ids?: string[];
  // NOVO: IDs dos blocks que bloqueiam este bloco (predecessores)
  blocked_by_ids?: string[];
}
```

---

## Passo 1.3 — Adicionar tipo do estado de drag de dependência

**Ficheiro:** `packages/types/src/layout/gantt.ts`

```ts
// NOVO: estado do drag de dependência (em progresso)
export type TDependencyDragState = {
  sourceBlockId: string;
  sourceSide: "left" | "right"; // "right" = este bloco deve terminar antes do alvo
  currentX: number; // posição do cursor no container
  currentY: number;
  targetBlockId: string | null; // bloco alvo sob o cursor (se houver)
} | null;
```

---

## Passo 1.4 — Estender `IBaseTimelineStore`

**Ficheiro:** `apps/web/ce/store/timeline/base-timeline.store.ts`

### Interface — adicionar:

```ts
export interface IBaseTimelineStore {
  // ... campos existentes ...

  // NOVO: estado do drag de dependência
  dependencyDragState: TDependencyDragState;

  // NOVO: actions
  startDependencyDrag: (sourceBlockId: string, sourceSide: "left" | "right", x: number, y: number) => void;
  updateDependencyDrag: (x: number, y: number, targetBlockId: string | null) => void;
  endDependencyDrag: () => void;
}
```

### Classe `BaseTimeLineStore` — adicionar:

```ts
// Observable
dependencyDragState: TDependencyDragState = null;

// Em makeObservable:
dependencyDragState: observable,
startDependencyDrag: action.bound,
updateDependencyDrag: action.bound,
endDependencyDrag: action.bound,

// Implementação
startDependencyDrag = (
  sourceBlockId: string,
  sourceSide: "left" | "right",
  x: number,
  y: number
) => {
  this.dependencyDragState = { sourceBlockId, sourceSide, currentX: x, currentY: y, targetBlockId: null };
};

updateDependencyDrag = (x: number, y: number, targetBlockId: string | null) => {
  if (!this.dependencyDragState) return;
  this.dependencyDragState = { ...this.dependencyDragState, currentX: x, currentY: y, targetBlockId };
};

endDependencyDrag = () => {
  this.dependencyDragState = null;
};

// Override do dummy existente:
getIsCurrentDependencyDragging = computedFn(
  (blockId: string) =>
    this.dependencyDragState?.sourceBlockId === blockId
);
```

---

## Passo 1.5 — Atualizar `updateBlocks` para popular `blocking_ids` / `blocked_by_ids`

O método `updateBlocks` em `BaseTimeLineStore` deve aceitar (opcionalmente) um
mapa de dependências para popular os campos no `blocksMap`.

```ts
// Assinatura estendida — compatível com código existente (parâmetro opcional)
updateBlocks(
  getDataById: (id: string) => BlockData | undefined | null,
  type?: EGanttBlockType,
  index?: number,
  dependenciesMap?: Record<string, { blocking: string[]; blocked_by: string[] }>
)
```

No loop interno, se `dependenciesMap[blockId]` existir, popular
`block.blocking_ids` e `block.blocked_by_ids`.

---

## Checklist do Passo 1

- [ ] `TIssueRelationTypes` atualizado com 6 tipos
- [ ] `IGanttBlock` tem `blocking_ids?` e `blocked_by_ids?`
- [ ] `TDependencyDragState` declarado
- [ ] `IBaseTimelineStore` inclui os 3 novos actions e o observable
- [ ] `BaseTimeLineStore` implementa os actions
- [ ] `getIsCurrentDependencyDragging` deixou de ser dummy
- [ ] `pnpm check:types` verde
