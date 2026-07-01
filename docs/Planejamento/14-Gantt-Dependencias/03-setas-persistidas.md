# 03 — Setas SVG Persistidas

## Contexto

O `GanttChartMainContent` já renderiza `<TimelineDependencyPaths isEpic={isEpic} />`
(linha 231). Este componente precisa mostrar todas as setas das relações ativas,
calculando as posições a partir do `blocksMap` do store.

---

## Passo 3.1 — Carregar dependências junto com o Gantt

**Ficheiro:** `apps/web/core/components/issues/issue-layouts/gantt/base-gantt-root.tsx`

Ao montar o Gantt de issues, fazer fetch das relações de todos os issues do
projeto (ou usando o endpoint de lista de relações já existente).

O endpoint já existe:

```
GET /api/workspaces/{slug}/projects/{pid}/issues/{issue_id}/relations/
```

**Estratégia mais eficiente:** carregar as relações numa só query usando a store
de relações de issues que já existe (verificar `issueRelationStore` ou
equivalente no store raiz).

### Lookup no store:

```ts
// base-gantt-root.tsx
useEffect(() => {
  // Carrega relações para todos os blockIds visíveis no Gantt
  fetchIssueRelationsForBlocks(blockIds, workspaceSlug, projectId);
}, [blockIds]);
```

Se a store de relações já tiver os dados (veio do issue detail, por ex.),
não é necessário novo fetch.

---

## Passo 3.2 — Propagar `dependenciesMap` para o store do timeline

Após ter as relações, construir o mapa e passar ao `updateBlocks`:

```ts
// base-gantt-root.tsx ou hook de gantt
const dependenciesMap = buildDependenciesMap(issueRelations);
// { [blockId]: { blocking: string[], blocked_by: string[] } }
ganttStore.updateBlocks(getDataById, blockType, index, dependenciesMap);
```

---

## Passo 3.3 — `TimelineDependencyPaths`

**Ficheiro:** `apps/web/ce/components/gantt-chart/dependency/dependency-paths.tsx`

### Dados necessários:

- `blocksMap` do store (via `useTimeLineChartStore()`)
- `blockIds` ordenados (para calcular Y de cada bloco = índice × BLOCK_HEIGHT)
- `BLOCK_HEIGHT` (constante já existente = 40px)
- `HEADER_HEIGHT` (já existente)

### Algoritmo por seta:

Para cada bloco A com `blocking_ids = [B1, B2, ...]`:

```
origem  = (A.position.marginLeft + A.position.width,  indexA × BLOCK_HEIGHT + BLOCK_HEIGHT/2)
destino = (B.position.marginLeft,                     indexB × BLOCK_HEIGHT + BLOCK_HEIGHT/2)
```

### Path SVG (Bezier cúbico ortogonal — estilo Linear/Jira):

```ts
function buildArrowPath(ox: number, oy: number, dx: number, dy: number): string {
  const cpOffset = Math.abs(dx - ox) * 0.5;
  const cx1 = ox + cpOffset;
  const cx2 = dx - cpOffset;
  return `M ${ox} ${oy} C ${cx1} ${oy}, ${cx2} ${dy}, ${dx} ${dy}`;
}
```

### Ponta da seta (arrowhead via SVG marker):

```tsx
<defs>
  <marker id="dep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="var(--color-accent-primary)" />
  </marker>
  <marker id="dep-arrow-conflict" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L0,6 L8,3 z" fill="var(--color-danger-primary)" />
  </marker>
</defs>
```

### Estrutura do componente:

```tsx
export function TimelineDependencyPaths({ isEpic }: Props) {
  const store = useTimeLineChartStore();
  const blockIds = store.blockIds ?? [];

  // Índice Y por bloco
  const blockIndexMap = useMemo(() => Object.fromEntries(blockIds.map((id, i) => [id, i])), [blockIds]);

  const arrows = useMemo(() => {
    const result: ArrowData[] = [];
    for (const blockId of blockIds) {
      const block = store.getBlockById(blockId);
      if (!block?.position || !block.blocking_ids?.length) continue;

      for (const targetId of block.blocking_ids) {
        const target = store.getBlockById(targetId);
        if (!target?.position) continue;

        const isConflict = hasDateConflict(block, target);
        const ox = block.position.marginLeft + block.position.width;
        const oy = (blockIndexMap[blockId] ?? 0) * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
        const dx = target.position.marginLeft;
        const dy = (blockIndexMap[targetId] ?? 0) * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

        result.push({ from: blockId, to: targetId, ox, oy, dx, dy, isConflict });
      }
    }
    return result;
  }, [blockIds, store.blocksMap, blockIndexMap]);

  if (!arrows.length) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-[15]"
      style={{ width: itemsContainerWidth, height: totalHeight }}
    >
      {/* defs com markers */}
      {arrows.map((a) => (
        <DependencyArrow key={`${a.from}-${a.to}`} arrow={a} />
      ))}
    </svg>
  );
}
```

### Detecção de conflito de datas:

```ts
function hasDateConflict(predecessor: IGanttBlock, successor: IGanttBlock): boolean {
  if (!predecessor.target_date || !successor.start_date) return false;
  return new Date(successor.start_date) < new Date(predecessor.target_date);
}
```

---

## Passo 3.4 — `DependencyArrow` (sub-componente)

```tsx
function DependencyArrow({ arrow }: { arrow: ArrowData }) {
  const [isHovered, setIsHovered] = useState(false);
  const color = arrow.isConflict ? "var(--color-danger-primary)" : "var(--color-accent-primary)";
  const markerId = arrow.isConflict ? "dep-arrow-conflict" : "dep-arrow";
  const d = buildArrowPath(arrow.ox, arrow.oy, arrow.dx, arrow.dy);

  return (
    <g>
      {/* Área de hover invisível (mais larga para facilitar click) */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        pointerEvents="stroke"
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {/* Seta visível */}
      <path
        d={d}
        stroke={color}
        strokeWidth={isHovered ? 2.5 : 1.5}
        fill="none"
        markerEnd={`url(#${markerId})`}
        opacity={isHovered ? 1 : 0.7}
      />
    </g>
  );
}
```

> O tooltip "Desvincular" é tratado no Passo 5.

---

## Checklist do Passo 3

- [ ] `blocksMap` atualizado com `blocking_ids` / `blocked_by_ids` vindos das relações
- [ ] `TimelineDependencyPaths` renderiza setas para todos os pares de blocos
- [ ] Seta normal: cor accent; seta conflito: cor danger
- [ ] Setas reactivas (re-renderizam ao mover barras no drag)
- [ ] SVG `pointer-events: none` nas setas (não interfere com drag das barras)
- [ ] Área hover invisível nas setas (12px) para facilitar interação
- [ ] Performance: `useMemo` nos arrows para não recalcular desnecessariamente
