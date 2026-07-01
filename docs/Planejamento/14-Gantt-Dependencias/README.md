# 14 — Gantt: Dependências entre Cards (Drag-to-Link)

> Pré-requisito: [`00-VISAO-GERAL`](../00-VISAO-GERAL/).
> Relacionado com: [`10-Advanced-Roadmaps-Plans`](../10-Advanced-Roadmaps-Plans/) (F1 reutiliza esta feature).

## Visão

Implementar as **bolinhas de dependência** nas barras do Gantt — os handles
circulares que aparecem em hover nas extremidades de cada barra e permitem
arrastar uma linha de ligação até outro card, criando uma relação
**"blocks / is blocked by"** (como o Jira). A seta visual fica persistida no
Gantt até ser removida.

## Estado atual do código (scaffolding existente)

O scaffolding já está montado — todos os componentes são **stubs vazios**:

| Ficheiro                                                                               | Estado              |
| -------------------------------------------------------------------------------------- | ------------------- |
| `apps/web/ce/components/gantt-chart/dependency/blockDraggables/left-draggable.tsx`     | Stub `<>`           |
| `apps/web/ce/components/gantt-chart/dependency/blockDraggables/right-draggable.tsx`    | Stub `<>`           |
| `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`                   | Stub `<>`           |
| `apps/web/ce/components/gantt-chart/dependency/draggable-dependency-path.tsx`          | Stub `<>`           |
| `apps/web/ce/store/timeline/base-timeline.store.ts` → `getIsCurrentDependencyDragging` | Dummy `() => false` |

O `ChartDraggable` (core) **já chama** os stubs quando `enableDependency={true}`.
O `GanttChartMainContent` já renderiza `<TimelineDependencyPaths>` e `<TimelineDraggablePath>`.
A API de relações `IssueRelationViewSet` já suporta `blocking` / `blocked_by`.

## Decisões-chave

| #   | Decisão                                                         | Alternativa rejeitada            |
| --- | --------------------------------------------------------------- | -------------------------------- |
| 1   | Usar `IssueRelation(relation_type="blocked_by")` já existente   | Novo modelo de dependência Gantt |
| 2   | SVG absoluto overlay dentro do container `relative` do Gantt    | Canvas separado                  |
| 3   | Drag iniciado por `mousedown` + `mousemove` global durante drag | Drag-and-drop library            |
| 4   | Estado de drag no MobX store (observable)                       | State local React                |
| 5   | Setas Bezier cúbicas (suaves)                                   | Linhas retas ou cotovelos        |

## Escopo desta feature

**Inclui:**

- Handles circulares (bolinhas) em hover nas extremidades das barras
- Linha/seta "in-progress" enquanto o utilizador arrasta
- Setas persistidas mostrando todas as dependências ativas
- Tooltip na seta com nomes dos cards e botão "Desvincular"
- Indicador visual de conflito (seta vermelha quando datas se sobrepõem)
- Criar e remover relações via API

**Exclui (P3):**

- Bloqueio automático de transição de estado no backend
- Critical path highlighting
- Propagação automática de datas ao criar dependência

## Ficheiros a criar/modificar

```text
# MODIFICAR (stubs → implementação real)
apps/web/ce/components/gantt-chart/dependency/
├── blockDraggables/left-draggable.tsx       ← bolinha esquerda
├── blockDraggables/right-draggable.tsx      ← bolinha direita
├── dependency-paths.tsx                     ← setas SVG persistidas
└── draggable-dependency-path.tsx            ← seta in-progress durante drag

# MODIFICAR (adicionar estado de drag de dependência)
apps/web/ce/store/timeline/base-timeline.store.ts

# CRIAR (service para criar/remover relações)
packages/services/src/issue-relation.service.ts   (ou reutilizar existente)

# MODIFICAR (tipos — adicionar gantt-specific relation types)
packages/types/src/issues/issue_relation.ts

# MODIFICAR (passar callbacks de create/delete relation ao Gantt)
apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx
apps/web/core/components/issues/issue-layouts/gantt/roots/board-root.tsx
```

## Fases

- **F1** — Handles visuais + drag in-progress (sem persistir ainda)
- **F2** — Criar relação via API ao soltar + setas persistidas
- **F3** — Remover relação (tooltip "Desvincular") + indicador de conflito

## Documentos desta pasta

- [01-tipos-e-store.md](./01-tipos-e-store.md) — Passo 1: tipos TS + estado MobX
- [02-handles-drag-ui.md](./02-handles-drag-ui.md) — Passo 2: bolinhas + linha in-progress
- [03-setas-persistidas.md](./03-setas-persistidas.md) — Passo 3: SVG das setas permanentes
- [04-api-integracao.md](./04-api-integracao.md) — Passo 4: service + create/delete relation
- [05-conflitos-tooltip.md](./05-conflitos-tooltip.md) — Passo 5: conflitos + tooltip + desvincular
- [06-testes.md](./06-testes.md) — Testes unitários e de contrato
