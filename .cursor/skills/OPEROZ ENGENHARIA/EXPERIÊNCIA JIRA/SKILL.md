---
name: operoz-experiencia-jira
description: >-
  UX de gestão de trabalho no Operoz: detalhe 70/30, transições de status,
  squads/boards, filtros rápidos e velocidade tipo Plane/Jira — sempre com
  tokens do design system e consistência cross-tela.
---

# Experiência de issues e squads — Operoz

Skill de **layout e comportamento** para cards, boards, backlog e custos por squad. Cores e fundos: regras `operoz-frontend-design.mdc` + `operoz-issue-ux.mdc`.

## Pré-requisitos

1. `operoz-design-sistema` — tokens e regra de telas irmãs.
2. `operoz-desenvolvedor-senior` — permissões e API alinhadas à UI.

---

## Princípio de velocidade Operoz

- **Menos cliques** que Jira clássico: transição de status em 1–2 interações (dropdown no painel direito ou atalho de teclado quando existir).
- **Feedback imediato**: optimistic UI com rollback se a API falhar.
- **Sem modais** para ações frequentes (mudar assignee, status, sprint/ciclo).
- **Modais** só para destrutivo, bulk ou formulários longos.

---

## Layout detalhe de card (70 / 30)

| Zona | Conteúdo |
|------|----------|
| **Esquerda (~70%)** | Título inline; descrição rich text; subtarefas; comentários / atividade |
| **Direita (~30%)** | Status, responsável, squad/board, cliente, datas, labels, custo estimado/real (se Harness) |

```tsx
<div className="flex gap-4 bg-surface-1">
  <main className="min-w-0 flex-[7] border-r border-subtle">...</main>
  <aside className="w-72 shrink-0 bg-layer-1 p-3 space-y-3">...</aside>
</div>
```

Ao alterar este layout, atualizar **todas** as vistas de detalhe de issue/card no board (regra mestre do design system).

---

## Transições de status

- Mostrar **workflow visível**: estados permitidos a partir do atual (não lista completa irrelevante).
- Cores de estado via tokens (`success`, `warning`, `danger`, `accent`) — sem hex por estado.
- Drag no board Kanban: mesma API que dropdown no detalhe (uma fonte de verdade).
- Registar atividade: «Fulano moveu de Em progresso → Em revisão» na timeline.
- Bloqueios: se transição exige campo (ex. resolução), inline no painel direito, não wizard de 3 passos.

---

## Squads (boards) e visibilidade

- Contexto sempre claro: **workspace → board (squad) → projeto/cliente**.
- Filtros rápidos no topo: «Minhas», «Sem responsável», «Prazo esta semana», «Bloqueado», «Com custo acima do orçamento».
- Chips (padrão `Client360FilterChip`):

```tsx
<button
  className={cn(
    "rounded-sm px-2.5 py-1.5 text-12 font-medium",
    active
      ? "bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/25"
      : "text-tertiary hover:bg-layer-transparent-hover hover:text-secondary"
  )}
/>
```

- Vista squad: agregar por membro ou por estado; densidade de lista, não cards flutuantes por linha.

---

## Listagens densas

- `divide-y divide-subtle` + `hover:bg-layer-transparent-hover`
- Linhas `py-2.5` / `py-3`
- Identificador: `font-mono text-11 text-tertiary` (`WEB-104`, `OP-104` — usar API, não inventar)
- Bulk select: checkbox à esquerda; barra de ações fixa no fundo quando ≥1 selecionado

---

## Edição inline

- Título e campos simples: clique → editar → `onBlur` ou Enter para guardar.
- Foco: `ring-1 ring-accent-primary/25 border-strong`
- Erro: toast discreto + reverter valor

---

## Formatação (Brasil)

| Tipo | Formato |
|------|---------|
| Moeda / custo | `R$ 1.234,56` |
| Duração | `2d 4h` |
| Data relativa | «há 2 h», «ontem» em listas; data absoluta no detalhe |

Reutilizar utilitários do monorepo; não duplicar formatadores.

---

## Critérios de aceitação UX

- [ ] Transição de status ≤2 cliques no fluxo principal
- [ ] Metadados visíveis no painel direito
- [ ] 100% tokens Operoz
- [ ] Telas irmãs consistentes após mudança
- [ ] Copy pt-BR; produto **Operoz**

---

## Quando aplicar

- Detalhe de issue, board Kanban/list, backlog, Cliente 360
- Configuração de workflow por projeto/board
- Dashboards de squad com custo Harness

## Skills relacionadas

- `OPEROZ FLUXO/CONTEXTO` — Git, Harness, domínio
- `OPEROZ ENGENHARIA/DESIGN SISTEMA` — tokens e irmãs
