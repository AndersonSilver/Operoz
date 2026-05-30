---
name: operis-design-sistema
description: >-
  Design system Operis: tokens semânticos (canvas, surface, layer, accent,
  success, danger), temas claro/escuro. Usar ao estilizar UI, criar componentes
  ou revisar CSS/Tailwind — nunca cores hex fixas de Jira ou outras referências.
---

# Design sistema — Operis OS

Skill de **engenharia visual** alinhada ao monorepo real. Complementa `.cursorrules` na raiz.

## Fontes de verdade (ler antes de estilizar)

| Ficheiro | Conteúdo |
|----------|----------|
| `packages/tailwind-config/variables.css` | Tokens CSS (`--bg-*`, `--txt-*`, `--border-*`) |
| `packages/tailwind-config/AGENTS.md` | Canvas → Surface → Layer, hovers, erros comuns |
| `packages/tailwind-config/index.css` | Import Tailwind + `body` com `bg-canvas text-primary` |

## Mapa rápido de classes Tailwind

### Fundos

```tsx
// App root (único)
<div className="bg-canvas min-h-screen">

// Página
<div className="bg-surface-1">

// Card / linha de lista
<div className="bg-layer-1 hover:bg-layer-1-hover border border-subtle rounded-md">

// Item clicável sem fundo base
<button className="hover:bg-layer-transparent-hover">
```

### Texto e bordas

```tsx
<h1 className="text-primary font-semibold" />
<p className="text-secondary text-13" />
<span className="text-tertiary text-11" />
<div className="border-b border-subtle" />
```

### Semântica (ícones pontuais, badges, barras)

```tsx
<span className="text-accent-primary" />
<span className="text-success-primary bg-success-subtle/40" />
<span className="text-warning-primary" />
<span className="text-danger-primary" />
```

Exemplo real: `apps/web/core/components/board/client-360/client-360-tokens.ts` (`CLIENT_360_TONE`).

## O que NÃO fazer

- Cores hex literais (`#0052CC`, `#F4F5F7`, …) em JSX/CSS novo.
- `bg-white`, `text-gray-500`, `border-gray-200` em features Operis (quebram dark mode).
- Aninhar `bg-surface-*` dentro de `bg-surface-*` no mesmo plano.
- `bg-layer-2` em card filho de `bg-surface-1` (usar `layer-1`; exceção rara só em inputs em modais — ver AGENTS.md).

## Densidade e raio (padrão Operis)

Referência: `apps/web/core/components/board/client-360/`, `board-overview-dashboard.tsx`.

- Bordas: `rounded-sm`, `rounded-md`
- Texto denso: `text-11`, `text-12`, `text-13`
- Padding: `px-3 py-2`, `px-4 py-3`, `p-4`

## Temas

O utilizador pode escolher light / dark / contrastes nas preferências. Classes semânticas adaptam-se via `variables.css` — não duplicar paleta manualmente.

## Checklist antes de entregar UI

- [ ] Sem hex hardcoded
- [ ] `bg-canvas` só na raiz da app
- [ ] Superfícies e layers corretos
- [ ] `text-primary` / `secondary` / `tertiary`
- [ ] `border-subtle` para divisores
- [ ] Accent / success / warning / danger via tokens
- [ ] Funciona conceptualmente em dark mode
- [ ] Marca **Operis** na copy

## Pasta irmã

Layout tipo issue (70/30, filtros): `OPERIS ENGENHARIA/EXPERIÊNCIA JIRA/` — sem duplicar tokens aqui.
