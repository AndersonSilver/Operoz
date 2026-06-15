---
name: operoz-design-sistema
description: >-
  Design system Operoz: tokens semânticos, estilo minimalista Linear/Plane,
  Tailwind do monorepo. Antes de criar ou alterar qualquer tela, analisar
  telas irmãs com a mesma funcionalidade e replicar mudanças para consistência.
---

# Design sistema — Operoz

Skill de **engenharia visual** e **consistência funcional** em todo o produto. Complementa `.cursor/rules/operoz-frontend-design.mdc` e o orquestrador.

**Pensamento UX (obrigatório antes de codar):** skill mestre `OPEROZ ENGENHARIA/SKILL.md` — JTBD, estados, copy, acessibilidade, anti-patterns de URL crua.

## Regra mestre (obrigatória antes de qualquer UI)

Antes de **criar ou alterar** uma tela, modal, tabela, filtro, empty state ou formulário:

1. **Inventariar telas irmãs** — mesma função ou contexto (ex.: listagem com tabela densa, drawer de detalhe, modal de confirmação, painel de metadados).
2. **Comparar padrões** — estrutura DOM, classes Tailwind, densidade, ações primárias/secundárias, estados vazio/loading/erro.
3. **Replicar ou propor** a mesma mudança em todas as irmãs no mesmo PR (ou listar explicitamente as que faltam e porquê).
4. **Não introduzir** um padrão visual novo numa só tela se outra já resolve o mesmo caso.

### Onde procurar referências

| Contexto         | Pastas de referência                           |
| ---------------- | ---------------------------------------------- |
| Board / hub      | `apps/web/core/components/board/`              |
| Cliente 360      | `apps/web/core/components/board/client-360/`   |
| Issues / detalhe | `apps/web/core/components/issues/`, CE headers |
| Tabelas densas   | `client-360-*`, `board-overview-dashboard.tsx` |
| Chips de filtro  | `Client360FilterChip` e equivalentes           |

Estilo alvo: **minimalista, denso, rápido** — inspiração Linear/Plane, **sempre** com tokens Operoz (nunca paleta Jira copiada).

---

## Fontes de verdade

| Ficheiro                                 | Conteúdo                          |
| ---------------------------------------- | --------------------------------- |
| `packages/tailwind-config/variables.css` | `--bg-*`, `--txt-*`, `--border-*` |
| `packages/tailwind-config/AGENTS.md`     | Canvas → Surface → Layer          |
| `packages/tailwind-config/index.css`     | Tailwind + `body`                 |

---

## Mapa Tailwind

### Fundos

```tsx
<div className="bg-canvas min-h-screen">           {/* raiz app — uma vez */}
<div className="bg-surface-1">                     {/* página */}
<div className="bg-layer-1 hover:bg-layer-1-hover border border-subtle rounded-md">
<button className="hover:bg-layer-transparent-hover">
```

### Texto e bordas

```tsx
<h1 className="text-primary font-semibold" />
<p className="text-secondary text-13" />
<span className="text-tertiary text-11" />
<div className="border-b border-subtle" />
```

### Semântica

```tsx
<span className="text-accent-primary" />
<span className="text-success-primary bg-success-subtle/40" />
<span className="text-danger-primary" />
```

Exemplo de tom sem hex: `client-360-tokens.ts` (`CLIENT_360_TONE`).

---

## Componentes transversais (manter iguais)

| Padrão            | Especificação                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Tabela densa      | `text-13`, header `text-11 uppercase text-tertiary`, `divide-y divide-subtle`                                       |
| Modal             | `bg-backdrop`, corpo `bg-surface-1`, `p-6 gap-4`, `w-[min(100vw-2rem,28rem)]`, ações à direita, `danger` destrutivo |
| Formulário inline | `border-strong` em foco, `onBlur` para persistir                                                                    |
| Empty state       | ícone `size={16}`, título `text-secondary`, CTA `accent`, próximo passo claro                                       |
| Loading           | skeleton `bg-layer-2` animado, sem spinners pesados em listas                                                       |
| Copiar link       | `IconButton` + `Tooltip` + toast — **nunca** URL crua em `<p break-all>`                                            |
| Toolbar compacta  | `IconButton` `variant="ghost                                                                                        | secondary"`+`Tooltip`+`aria-label` |

Reutilizar `@operis/ui` e `@operis/propel` antes de primitives novas.

### IconButton + Tooltip (padrão Operoz)

```tsx
<Tooltip tooltipContent={label} position="bottom">
  <IconButton variant="ghost" size="lg" icon={SomeIcon} onClick={onAction} aria-label={label} />
</Tooltip>
```

Referências: `copy-link-control.tsx`, `client-360-ui.tsx`, `PageReviewShareButton`.

---

## O que NÃO fazer

- Hex literais (`#0052CC`, `#F4F5F7`) ou `bg-white` / `text-gray-*` em features novas.
- Aninhar `bg-surface-*` dentro de `bg-surface-*` no mesmo plano.
- Uma tabela «bonita» e outra «legada» no mesmo fluxo de board.
- Animações longas; preferir transições de opacidade/cor ≤ 150ms.

---

## Densidade Operoz

- Raio: `rounded-sm`, `rounded-md`
- Tipografia: `text-11`, `text-12`, `text-13`
- Espaçamento: `px-3 py-2`, `p-4`, `gap-2` / `gap-3`
- Ícones: `lucide-react`, `size={14|16}`, `strokeWidth={1.75}`

---

## Checklist antes de entregar UI

Ver checklist completo em `OPEROZ ENGENHARIA/SKILL.md` §9. Resumo:

- [ ] JTBD + estados vazio/loading/erro/sucesso planeados
- [ ] Telas irmãs revistas e alinhadas (ou débito listado)
- [ ] Sem hex hardcoded; hierarquia canvas / surface / layer
- [ ] Sem URL/token cru; copiar via IconButton + toast
- [ ] i18n pt-BR + en; sem chaves visíveis na UI
- [ ] Dark mode OK; acessibilidade (foco, aria-label, Escape no modal)
- [ ] Copy marca **Operoz**

---

## Pasta irmã

Layout issue (70/30, chips): `OPEROZ ENGENHARIA/EXPERIÊNCIA JIRA/` + regra `operoz-issue-ux.mdc`.
