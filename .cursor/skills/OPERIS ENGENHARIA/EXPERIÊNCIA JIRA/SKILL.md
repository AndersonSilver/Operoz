---
name: operis-experiencia-jira
description: >-
  Layout e UX densos estilo gestão enterprise (detalhe 70/30, identificadores
  OP-XXX, filtros chips, edição inline) no Operis OS, sempre com tokens do
  design system. Usar ao criar UI de cards, detalhe de tarefa e listagens.
---

# Experiência tipo issue — Operis OS

Skill de **layout e comportamento** inspirados em ferramentas enterprise (ex. Jira), aplicados com o **tema Operis** — cores e fundos vêm de `DESIGN SISTEMA/` e `.cursorrules`, não de paletas externas.

## Pré-requisito

Antes de estilizar, aplicar skill **`operis-design-sistema`** (classes `bg-surface-*`, `bg-layer-*`, `text-*`, `border-subtle`, etc.).

## Layout de duas colunas (detalhe de card)

Proporção **70% / 30%**:

| Zona | Conteúdo |
|------|----------|
| **Esquerda (70%)** | Título editável inline; descrição (rich text); comentários / atividade |
| **Direita (30%)** | Metadados em lista vertical: Status, Responsável (avatar + nome), Cliente (tag), datas / SLA |

Container sugerido:

```tsx
<div className="flex gap-4 bg-surface-1">
  <main className="min-w-0 flex-[7] border-r border-subtle">...</main>
  <aside className="w-72 shrink-0 bg-layer-1 p-3">...</aside>
</div>
```

## Identificadores

Código de rastreio do projeto (ex. `WEB-104`, `OP-104`):

- Cabeçalho e listagem: `font-mono text-11 text-tertiary` ou `text-secondary`
- Não inventar formato; usar `sequence_id` / identificador do projeto existente na API

## Listagens densas

- `divide-y divide-subtle` + `hover:bg-layer-transparent-hover`
- Linhas com `py-2.5` / `py-3`, não cards flutuantes por item em vistas matriciais
- Tabela: `text-13`, cabeçalho `text-11 uppercase text-tertiary bg-layer-2`

## Filtros rápidos

Chips no topo («Minhas tarefas», «Prazo a esgotar», «Crítico»):

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

(Padrão alinhado a `Client360FilterChip`.)

## Edição inline

Título e campos simples: edição ao clicar, persistência em `onBlur`, feedback discreto (`border-strong` em foco).

## Formatação de dados (Brasil)

| Tipo | Formato |
|------|---------|
| Moeda | `R$ 1.234,56` |
| Duração | `2d 4h` em vez de segundos brutos |

Usar utilitários existentes do monorepo quando houver; não criar formatadores duplicados.

## Critérios de aceitação

- Navegação rápida; evitar animações pesadas.
- Metadados visíveis no painel direito no detalhe.
- **100% tokens Operis** para cor e fundo.
- Copy em português; produto **Operis OS**.
- Reutilizar `@operis/ui` / `@operis/propel` quando existir equivalente.

## Quando aplicar

- Detalhe de card / issue
- Boards, listas, backlog, Cliente 360 (vistas densas)
- Filtros e painéis laterais de metadados

## Relação com outras skills

- `OPERIS FLUXO/CONTEXTO` — domínio (board, projeto, cliente)
- `OPERIS ENGENHARIA/DESIGN SISTEMA` — tokens e hierarquia visual
