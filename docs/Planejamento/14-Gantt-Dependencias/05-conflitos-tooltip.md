# 05 — Conflitos de Datas e Tooltip "Desvincular"

## Contexto

Quando uma dependência viola as datas (o bloco B começa antes do bloco A
terminar), a seta deve mudar para vermelho (danger) para alertar o utilizador.
Ao passar o rato sobre qualquer seta, deve aparecer um tooltip com informação
da dependência e a opção de a remover.

---

## Passo 5.1 — Lógica de conflito de datas

Já definida no Passo 3 (`hasDateConflict`), mas documentamos aqui formalmente:

```ts
// Uma dependência tem conflito quando o successor começa antes do predecessor terminar
function hasDateConflict(predecessor: IGanttBlock, successor: IGanttBlock): boolean {
  if (!predecessor.target_date || !successor.start_date) return false;
  // Comparar apenas datas (sem horas)
  return new Date(successor.start_date) < new Date(predecessor.target_date);
}
```

### Casos especiais:

| Situação                                               | Resultado                           |
| ------------------------------------------------------ | ----------------------------------- |
| Predecessor sem `target_date`                          | Sem conflito (não podemos calcular) |
| Successor sem `start_date`                             | Sem conflito                        |
| Successor começa exatamente quando predecessor termina | Sem conflito (mesmo dia = OK)       |
| Successor começa antes de predecessor terminar         | **Conflito**                        |

---

## Passo 5.2 — Visual do conflito

Na seta SVG (`DependencyArrow`), quando `isConflict = true`:

```tsx
// Cor danger
const color = isConflict ? "var(--color-danger-primary)" : "var(--color-accent-primary)";

// Stroke mais espesso + pontilhado mais longo para chamar atenção
const strokeDasharray = isConflict ? "8 4" : undefined;

// Badge de aviso sobre a seta (no ponto médio)
{
  isConflict && (
    <g transform={`translate(${midX}, ${midY})`}>
      <circle r="8" fill="var(--color-danger-subtle)" stroke="var(--color-danger-primary)" strokeWidth="1.5" />
      <text x="0" y="4" textAnchor="middle" fontSize="10" fill="var(--color-danger-primary)" fontWeight="bold">
        !
      </text>
    </g>
  );
}
```

Ponto médio do Bezier (aproximação):

```ts
const midX = (ox + dx) / 2;
const midY = (oy + dy) / 2;
```

---

## Passo 5.3 — Tooltip na seta

**Onde fica:** o tooltip aparece ao `mouseenter` na área hover invisível da seta
(Passo 3.4). Não usar SVG `<foreignObject>` — usar um portal HTML.

### Abordagem recomendada:

Manter no componente `DependencyArrow` um estado local:

```ts
const [tooltipState, setTooltipState] = useState<{
  x: number;
  y: number;
} | null>(null);
```

Ao `mouseenter` na path invisível:

```ts
onMouseEnter={(e) => setTooltipState({ x: e.clientX, y: e.clientY })}
onMouseLeave={() => setTooltipState(null)}
```

Renderizar o tooltip via `createPortal` no `document.body`:

```tsx
{
  tooltipState &&
    createPortal(
      <DependencyTooltip
        predecessor={predecessorBlock}
        successor={successorBlock}
        isConflict={isConflict}
        position={tooltipState}
        onUnlink={() => {
          onDeleteDependency(successorBlock.id, predecessorBlock.id);
          setTooltipState(null);
        }}
      />,
      document.body
    );
}
```

---

## Passo 5.4 — `DependencyTooltip`

**Ficheiro:** `apps/web/ce/components/gantt-chart/dependency/dependency-tooltip.tsx`

```tsx
type DependencyTooltipProps = {
  predecessor: IGanttBlock;
  successor: IGanttBlock;
  isConflict: boolean;
  position: { x: number; y: number };
  onUnlink: () => void;
};

export function DependencyTooltip(props: DependencyTooltipProps) {
  const { predecessor, successor, isConflict, position, onUnlink } = props;

  return (
    <div
      className="fixed z-[100] w-64 rounded-md bg-layer-1 border border-subtle shadow-lg p-3"
      style={{ top: position.y + 12, left: position.x + 8 }}
    >
      {/* Tipo de relação */}
      <div className="flex items-center gap-1.5 mb-2">
        <ArrowRight size={12} className="text-accent-primary" />
        <span className="text-11 text-tertiary uppercase tracking-wide">blocks</span>
      </div>

      {/* Predecessor → Successor */}
      <div className="text-12 text-primary font-medium truncate">{predecessor.name}</div>
      <div className="flex items-center gap-1 my-1">
        <div className="flex-1 h-px bg-subtle" />
        <span className="text-11 text-tertiary">bloqueia</span>
        <div className="flex-1 h-px bg-subtle" />
      </div>
      <div className="text-12 text-primary font-medium truncate">{successor.name}</div>

      {/* Alerta de conflito */}
      {isConflict && (
        <div className="mt-2 flex items-start gap-1.5 rounded-sm bg-danger-subtle px-2 py-1.5">
          <AlertTriangle size={12} className="text-danger-primary mt-0.5 shrink-0" />
          <span className="text-11 text-danger-primary">
            Datas em conflito — {successor.name} começa antes de {predecessor.name} terminar
          </span>
        </div>
      )}

      {/* Botão Desvincular */}
      <button
        onClick={onUnlink}
        className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-sm
                   border border-subtle bg-layer-1 hover:bg-danger-subtle
                   hover:border-danger-primary hover:text-danger-primary
                   text-12 text-secondary py-1.5 transition-colors"
      >
        <Unlink size={12} />
        Desvincular ticket
      </button>
    </div>
  );
}
```

---

## Passo 5.5 — Fechar tooltip ao clicar fora

Adicionar `useEffect` no `DependencyTooltip`:

```ts
useEffect(() => {
  const handleClickOutside = (e: MouseEvent) => {
    if (!(e.target as Element).closest("[data-dependency-tooltip]")) {
      onClose?.();
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

---

## Passo 5.6 — Indicador de bloco bloqueado na sidebar

Opcional mas de alto valor: mostrar um ícone de cadeado (🔒) no sidebar do
Gantt ao lado do nome de qualquer bloco que tenha `blocked_by_ids.length > 0`.

**Ficheiro:** `apps/web/core/components/gantt-chart/sidebar/issues/block.tsx`

```tsx
{
  block.blocked_by_ids?.length > 0 && (
    <Tooltip content={`Bloqueado por ${block.blocked_by_ids.length} card(s)`}>
      <Lock size={12} className="text-warning-primary shrink-0" />
    </Tooltip>
  );
}
```

---

## Checklist do Passo 5

- [ ] `hasDateConflict` calcula corretamente (testes unitários)
- [ ] Seta vermelha quando há conflito de datas
- [ ] Badge "!" no ponto médio da seta com conflito
- [ ] Tooltip aparece em hover na seta
- [ ] Tooltip mostra predecessor → successor com nomes legíveis
- [ ] Alerta de conflito no tooltip quando aplicável
- [ ] Botão "Desvincular ticket" funcional (chama delete relation API)
- [ ] Tooltip fecha ao clicar fora
- [ ] Ícone de cadeado na sidebar para blocos bloqueados (opcional)
