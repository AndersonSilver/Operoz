# 02 — Handles (Bolinhas) e Linha In-Progress

## Contexto

O `ChartDraggable` já chama `<LeftDependencyDraggable>` e
`<RightDependencyDraggable>` quando `enableDependency={true}`.
Estes dois componentes precisam de mostrar os handles circulares em hover e
iniciar o drag de dependência.

O `GanttChartMainContent` já renderiza `<TimelineDraggablePath>` — precisa de
mostrar a seta in-progress enquanto o utilizador arrasta.

---

## Passo 2.1 — `RightDependencyDraggable`

**Ficheiro:** `apps/web/ce/components/gantt-chart/dependency/blockDraggables/right-draggable.tsx`

Este handle aparece no lado **direito** da barra. Ao arrastar daqui para outro
card, cria uma relação **"este bloco deve terminar antes do outro começar"**
(`blocked_by` no alvo).

### Comportamento esperado:

- Visível apenas em hover (`group-hover:opacity-100 opacity-0`)
- Circulo de 10px, cor `bg-accent-primary`, borda branca
- `cursor: crosshair` enquanto paira
- `onMouseDown`: chama `store.startDependencyDrag(block.id, "right", x, y)`
- Adiciona listeners globais `mousemove` e `mouseup` no `document`
  - `mousemove`: chama `store.updateDependencyDrag(x, y, targetBlockId)`
    - `targetBlockId` = lê `document.elementFromPoint(x, y)` e verifica se
      tem `data-gantt-block-id` no atributo ou no ancestral mais próximo
  - `mouseup`: chama `store.endDependencyDrag()` + dispara criação da relação
    se `targetBlockId !== null && targetBlockId !== block.id`
- Remove listeners em cleanup (`useEffect` ou `useCallback`)

### Layout no DOM:

```tsx
<div
  className="absolute right-0 top-1/2 z-[10] -translate-y-1/2 translate-x-1/2
             opacity-0 group-hover:opacity-100 transition-opacity"
>
  <div
    className="h-2.5 w-2.5 rounded-full border-2 border-white bg-accent-primary
               cursor-crosshair shadow-sm"
    onMouseDown={handleMouseDown}
  />
</div>
```

### Atributo de identificação no bloco:

O `div` raiz do `GanttChartBlock` (em `block.tsx`) deve receber
`data-gantt-block-id={block.id}`. Já tem `id="gantt-block-{block.id}"` —
podemos usar `id` ou adicionar o atributo `data-*`.

---

## Passo 2.2 — `LeftDependencyDraggable`

**Ficheiro:** `apps/web/ce/components/gantt-chart/dependency/blockDraggables/left-draggable.tsx`

Idem ao direito, mas:

- Posição: `left-0 -translate-x-1/2`
- Ao arrastar a partir daqui → receber dependência (este card fica bloqueado
  pelo outro que se largar aqui)
- `sourceSide: "left"`
- A lógica de relação inverte-se: ao largar sobre um alvo, o alvo bloqueia este

> **Simplificação para F1/F2:** implementar apenas o handle direito (Finish-to-Start
> que é o mais usado). O handle esquerdo fica como visual mas sem criar relação.
> Documentado como débito técnico no PR.

---

## Passo 2.3 — `TimelineDraggablePath` (linha in-progress)

**Ficheiro:** `apps/web/ce/components/gantt-chart/dependency/draggable-dependency-path.tsx`

Renderizado no mesmo container que as barras. Lê `dependencyDragState` do store.

### Comportamento:

- Se `dependencyDragState === null` → retorna `null` (nada renderizado)
- Se drag ativo → renderiza um SVG `position: absolute; inset: 0; pointer-events: none`
- A seta parte do centro-direito (ou centro-esquerdo) do bloco fonte
- A ponta segue o cursor do rato em tempo real (via observable do store)

### Cálculo de origem da seta:

```ts
// Ponto de origem = posição do bloco no DOM
const sourceBlock = store.getBlockById(dependencyDragState.sourceBlockId);
const originX = sourceBlock.position.marginLeft +
  (sourceSide === "right" ? sourceBlock.position.width : 0);
const originY = // índice do bloco × BLOCK_HEIGHT + BLOCK_HEIGHT / 2
```

### Path SVG (Bezier cúbico):

```ts
// Curva suave de sourceX,sourceY até currentX,currentY
const cx1 = originX + (currentX - originX) * 0.5;
const cy1 = originY;
const cx2 = originX + (currentX - originX) * 0.5;
const cy2 = currentY;

const d = `M ${originX} ${originY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${currentX} ${currentY}`;
```

### Visual:

```tsx
<svg
  className="absolute inset-0 pointer-events-none z-[20]"
  style={{ width: itemsContainerWidth, height: totalHeight }}
>
  {/* Linha */}
  <path d={d} stroke="var(--color-accent-primary)" strokeWidth="2" fill="none" strokeDasharray="6 3" />
  {/* Bolinha no cursor */}
  <circle cx={currentX} cy={currentY} r="5" fill="var(--color-accent-primary)" />
  {/* Anel de destaque no bloco alvo (se targetBlockId != null) */}
  {targetBlockId && (
    <circle cx={targetX} cy={targetY} r="8" fill="none" stroke="var(--color-accent-primary)" strokeWidth="2" />
  )}
</svg>
```

---

## Passo 2.4 — Adicionar `data-gantt-block-id` no bloco

**Ficheiro:** `apps/web/core/components/gantt-chart/blocks/block.tsx`

Linha 66 (div raiz do bloco) — adicionar atributo:

```tsx
<div
  id={`gantt-block-${block.id}`}
  data-gantt-block-id={block.id}   // ← NOVO
  ...
>
```

Isto permite o hit-test no `mousemove`:

```ts
const el = document.elementFromPoint(x, y)?.closest("[data-gantt-block-id]");
const targetBlockId = el?.getAttribute("data-gantt-block-id") ?? null;
```

---

## Passo 2.5 — Prevenir conflito com drag de mover barra

Quando `dependencyDragState !== null`, o `ChartDraggable` não deve processar
`onMouseDown` para mover a barra. Adicionar guard:

```tsx
// Em ChartDraggable:
const isDepDragging = !!store.dependencyDragState;

onMouseDown={(e) => !isDepDragging && enableBlockMove && handleBlockDrag(e, "move")}
```

---

## Checklist do Passo 2

- [ ] `RightDependencyDraggable` mostra circulo em `group-hover`
- [ ] `mousedown` no handle inicia drag (store.startDependencyDrag)
- [ ] `mousemove` global atualiza `dependencyDragState` com posição e target
- [ ] `mouseup` global limpa o estado (endDependencyDrag)
- [ ] `TimelineDraggablePath` renderiza seta Bezier tracejada durante drag
- [ ] Anel de destaque aparece sobre o bloco alvo ao passar por cima
- [ ] `data-gantt-block-id` no div raiz do bloco
- [ ] Drag de mover barra não conflitua com drag de dependência
- [ ] Sem erros de tipos (check:types verde)
