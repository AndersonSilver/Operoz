# 04 — Integração com a API (Criar e Remover Relações)

## Contexto

O endpoint de relações **já existe e está funcional**:

```
# Criar relação
POST /api/workspaces/{slug}/projects/{pid}/issues/{issue_id}/relations/
Body: { "relation_type": "blocked_by", "issues": ["<target_issue_id>"] }

# Remover relação
DELETE /api/workspaces/{slug}/projects/{pid}/issues/{issue_id}/relations/
Body: { "related_issue": "<target_issue_id>" }
```

A lógica backend em `IssueRelationViewSet.create()` já trata a inversão correta
de `blocked_by` (se A bloqueia B, a relação armazenada é `blocked_by` com
`issue=A, related_issue=B`).

---

## Passo 4.1 — Verificar/Criar service de relações

**Verificar se já existe:** `packages/services/src/` — procurar por
`issue-relation` ou `relation.service`.

Se **não existir**, criar:

**Ficheiro:** `packages/services/src/issue/issue-relation.service.ts`

```ts
import { APIService } from "../api.service";
import type { TIssueRelationTypes } from "@operoz/types";

export class IssueRelationService extends APIService {
  constructor() {
    super();
  }

  async createRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    targetIssueId: string,
    relationType: TIssueRelationTypes
  ): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/`, {
      relation_type: relationType,
      issues: [targetIssueId],
    });
  }

  async deleteRelation(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relatedIssueId: string
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/relations/`, {
      data: { related_issue: relatedIssueId },
    });
  }
}

export const issueRelationService = new IssueRelationService();
```

---

## Passo 4.2 — Callback `onCreateDependency` no Gantt

Os componentes de Gantt precisam receber um callback para criar a relação ao
largar o drag. Este callback flui de cima para baixo.

### Caminho da prop:

```
base-gantt-root.tsx          ← recebe workspaceSlug, projectId
  → GanttChartMainContent    ← passa onCreateDependency
    → GanttChartBlocksList   ← passa onCreateDependency
      → GanttChartBlock      ← passa onCreateDependency
        → ChartDraggable     ← passa onCreateDependency
          → RightDependencyDraggable  ← usa onCreateDependency no mouseup
```

### Assinatura do callback:

```ts
type OnCreateDependencyFn = (sourceBlockId: string, targetBlockId: string) => Promise<void>;
```

### Implementação em `base-gantt-root.tsx`:

```ts
const handleCreateDependency = useCallback(
  async (sourceBlockId: string, targetBlockId: string) => {
    try {
      // Criamos "sourceBlock is blocked by targetBlock" → target bloqueia source
      // Ou seja: "source só pode começar depois de target terminar"
      // API: source issue fica como issue_id, target como related_issue com blocked_by
      await issueRelationService.createRelation(
        workspaceSlug,
        projectId,
        sourceBlockId, // issue que fica bloqueado
        targetBlockId, // predecessor (que bloqueia)
        "blocked_by"
      );

      // Atualizar store local para reflectir imediatamente sem re-fetch
      ganttStore.addDependency(sourceBlockId, targetBlockId);
    } catch (err) {
      // Mostrar toast de erro
      setToastAlert({ type: "error", title: "Erro ao criar dependência" });
    }
  },
  [workspaceSlug, projectId, ganttStore]
);
```

> **Convenção de direção:** ao arrastar da bolinha **direita** de A para B,
> estamos a dizer que A deve terminar antes de B poder começar.
> Logo B é `blocked_by` A → chamamos `createRelation(B, A, "blocked_by")`.

---

## Passo 4.3 — Callback `onDeleteDependency` (para o Passo 5)

Preparar desde já (será usado no tooltip):

```ts
const handleDeleteDependency = useCallback(
  async (sourceBlockId: string, targetBlockId: string) => {
    try {
      await issueRelationService.deleteRelation(workspaceSlug, projectId, sourceBlockId, targetBlockId);
      ganttStore.removeDependency(sourceBlockId, targetBlockId);
    } catch (err) {
      setToastAlert({ type: "error", title: "Erro ao remover dependência" });
    }
  },
  [workspaceSlug, projectId, ganttStore]
);
```

---

## Passo 4.4 — Actions no store: `addDependency` / `removeDependency`

**Ficheiro:** `apps/web/ce/store/timeline/base-timeline.store.ts`

Para actualização optimista sem re-fetch do Gantt completo:

```ts
addDependency = action((sourceId: string, predecessorId: string) => {
  runInAction(() => {
    // sourceId fica bloqueado pelo predecessorId
    const sourceBlock = this.blocksMap[sourceId];
    if (sourceBlock) {
      sourceBlock.blocked_by_ids = [...(sourceBlock.blocked_by_ids ?? []), predecessorId].filter(Boolean);
    }
    // predecessorId passa a bloquear sourceId
    const predBlock = this.blocksMap[predecessorId];
    if (predBlock) {
      predBlock.blocking_ids = [...(predBlock.blocking_ids ?? []), sourceId].filter(Boolean);
    }
  });
});

removeDependency = action((sourceId: string, predecessorId: string) => {
  runInAction(() => {
    const sourceBlock = this.blocksMap[sourceId];
    if (sourceBlock) {
      sourceBlock.blocked_by_ids = sourceBlock.blocked_by_ids?.filter((id) => id !== predecessorId);
    }
    const predBlock = this.blocksMap[predecessorId];
    if (predBlock) {
      predBlock.blocking_ids = predBlock.blocking_ids?.filter((id) => id !== sourceId);
    }
  });
});
```

---

## Passo 4.5 — Guardar `projectId` por bloco (necessário para a API)

O `IGanttBlock.meta.project_id` já existe (populado em `updateBlocks`).
Ao chamar a API, usar `block.meta?.project_id ?? projectId` como fallback.

Isto é importante para o futuro cross-project (feature 10), onde blocos de
projetos diferentes co-existem no mesmo Gantt.

---

## Passo 4.6 — Validações antes de criar relação

No handler de `mouseup` do drag, antes de chamar a API:

```ts
// 1. Source e target são o mesmo bloco → ignorar
if (sourceBlockId === targetBlockId) return;

// 2. Relação já existe → ignorar (evitar duplicação)
const sourceBlock = store.getBlockById(sourceBlockId);
if (sourceBlock.blocked_by_ids?.includes(targetBlockId)) return;

// 3. Criaria ciclo: targetBlock já é blocked_by sourceBlock → aviso
// (verificação simples; detecção de ciclos completa é P3)
const targetBlock = store.getBlockById(targetBlockId);
if (targetBlock.blocked_by_ids?.includes(sourceBlockId)) {
  setToastAlert({ type: "warning", title: "Dependência circular — não permitida" });
  return;
}
```

---

## Checklist do Passo 4

- [ ] Service `issueRelationService.createRelation` funcional
- [ ] Service `issueRelationService.deleteRelation` funcional
- [ ] `handleCreateDependency` implementado em `base-gantt-root.tsx`
- [ ] `handleDeleteDependency` implementado (para Passo 5)
- [ ] Callback flui até `RightDependencyDraggable`
- [ ] `addDependency` / `removeDependency` no store (update optimista)
- [ ] Validações de auto-referência e ciclo simples
- [ ] Toast de erro em caso de falha API
- [ ] `project_id` correto por bloco (via `meta.project_id`)
