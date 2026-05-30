# Etapa 0 — Design da sidebar: Boards → Projetos (épico)

**Tech4Humans · Boards**  
**Validado contra:** `apps/web/app/(all)/[workspaceSlug]/(projects)/sidebar.tsx`, `projects-list.tsx`, `projects-list-item.tsx`  
**Hierarquia:** Workspace → Board (time) → Projeto (épico) — **sem cards na sidebar**

**Status:** aprovada (maio/2026).

---

## 1. Onde isto vive na sidebar hoje

Ordem atual em `sidebar.tsx`:

```text
SidebarWrapper ("Projects")
├── SidebarMenuItems          ← Home, Rascunhos, Seu trabalho, Anotações, Workspace…
├── SidebarFavoritesMenu      ← se houver favoritos
├── SidebarTeamsList          ← stub (return null)  → SERÁ SUBSTITUÍDO
└── SidebarProjectsList       ← lista plana "Projetos" → SERÁ SUBSTITUÍDO
```

**Proposta:** um único bloco **`SidebarBoardsList`** substitui `SidebarTeamsList` + `SidebarProjectsList` (com feature flag).

Favoritos e menu superior **não mudam**.

---

## 2. Wireframe (estado expandido)

```text
┌─ Sidebar ─────────────────────────────┐
│  [≡] Tech4Humans                        │
│  … menu workspace (inalterado) …         │
│  … favoritos (inalterado) …            │
│                                         │
│  ▼ Boards                          [+] │  ← só admin; título secção
│    ▼ Squad as a Service            [·] │  ← board (time); chevron expande
│        ○ [Allianz] Ouvidoria            │  ← projeto (épico); indent ~16px
│        ○ [MAPFRE] Agiliza Corretor      │
│    ▶ Implantação Esteira                 │  ← board colapsado
│    ▼ Webapp                             │
│        ○ Portal interno                 │
│                                         │
│  ▼ Sem board                            │  ← só se existir projeto legado
│        ○ Projeto antigo X               │     (board_id null)
│                                         │
└─────────────────────────────────────────┘
```

Legenda:

- `○` = logo/emoji do projeto + nome (mesmo componente visual que hoje em `SidebarProjectsListItem`, sem accordion de tabs do projeto na sidebar principal).
- Clicar no **nome do board** → `/tech4humans/boards/squad-as-a-service` (overview).
- Clicar no **projeto** → `/tech4humans/projects/{id}/issues` (comportamento atual).

---

## 3. Hierarquia visual (indentação)

| Nível | Indentação | Tipografia (igual `projects-list`) |
|-------|------------|-------------------------------------|
| Secção «Boards» | `px-2` | `text-13 font-semibold text-placeholder` |
| Nome do board | `pl-2` (1º nível) | `text-13 font-medium text-secondary` |
| Nome do projeto | `pl-6` ou `pl-7` (2º nível) | `text-13 font-medium` — reutilizar item atual |

**Não mostrar:** cards, subtarefas, módulos, ciclos na árvore da sidebar.

---

## 4. Comportamentos

### 4.1 Secção «Boards» (Disclosure exterior)

- Mesmo padrão Headless UI `Disclosure` que `projects-list.tsx` (linhas 173–274).
- Estado aberto/fechado persistido em `localStorage` (chave nova: `isBoardsListOpen`).
- Chevron rota 90° quando aberto.
- **`[+]`** à direita (só workspace admin): abre modal «Criar board» (Etapa 3).

### 4.2 Cada board (Disclosure interior)

- **Aberto por defeito** se a rota atual for um projeto desse board ou a página do board.
- Chevron à esquerda do nome do board.
- Clique no **texto do board** (não só chevron) → navega para overview do board.
- **`[·]`** menu opcional (admin): renomear, arquivar, criar projeto neste board — pode ficar para Etapa 6+; MVP mock só com `+` na secção.

### 4.3 Projeto (épico)

- Reutilizar `SidebarProjectsListItem` com prop `indentLevel="board-child"` (ou wrapper) para não duplicar drag-and-drop.
- Drag-and-drop: reordenar projetos **dentro do mesmo board** (mantém `ProjectUserProperty.sort_order`).
- Reordenar boards: `Board.sort_order` (backend Etapa 5+).

### 4.4 Secção «Sem board»

- Aparece **somente** se `unassignedProjectIds.length > 0` (projetos legados D10).
- Mesmo estilo Disclosure, label `t("boards.without_board")` → PT: **«Sem board»**.
- Sem botão criar projeto aqui sem escolher board (novos projetos exigem board — D2).

### 4.5 «Mais» / lista longa

- Se muitos projetos num board: reutilizar padrão `sidebar_show_more` / extended sidebar **por board** ou global — **MVP:** limite igual ao atual (`showLimitedProjects`) aplicado ao total de projetos visíveis, depois refinar.

---

## 5. Estados vazios

| Situação | UI |
|----------|-----|
| Zero boards no workspace | Texto: «Nenhum board ainda.» + botão admin «Criar board» |
| Board sem projetos | Dentro do board: «Nenhum projeto neste board.» + admin «Adicionar projeto» |
| Zero boards mas projetos legados | Só secção «Sem board» visível |
| Member (não admin) sem boards | Mensagem informativa; não vê `[+]` criar board |

---

## 6. Textos i18n (proposta PT / EN)

| Chave | PT | EN |
|-------|----|----|
| `boards.title` | Boards | Boards |
| `boards.create` | Criar board | Create board |
| `boards.without_board` | Sem board | Without board |
| `boards.empty` | Nenhum board ainda | No boards yet |
| `boards.empty_projects` | Nenhum projeto neste board | No projects in this board |
| `boards.add_project` | Adicionar projeto | Add project |

Label de secção na sidebar: **«Boards»** (decisão D1 — não «Times» na UI principal para alinhar com doc produto).

---

## 7. Página overview do board (contexto sidebar)

Quando o utilizador clica no board:

```text
┌─ Conteúdo principal ────────────────────┐
│  Tech4Humans / Boards / Squad as a Service │
│                                         │
│  Squad as a Service                     │
│  [Descrição opcional]                   │
│                                         │
│  Projetos (3)                    [+ Projeto] │
│  ┌─────────────────────────────────────┐ │
│  │ [Allianz] Ouvidoria          →      │ │
│  │ [MAPFRE] Agiliza Corretor    →      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  (Tabs Cronograma / Backlog — MVP-2)    │
└─────────────────────────────────────────┘
```

Breadcrumb: **Workspace → Board** (projeto entra ao abrir épico).

---

## 8. O que não fazer neste design

- Não colocar issues/cards na sidebar.
- Não misturar com layout Kanban «quadro» de itens.
- Não reativar `SidebarTeamsList` — substituir por boards.
- Não alterar `SidebarMenuItems` nem favoritos na Etapa 2.

---

## 9. Feature flag

```env
NEXT_PUBLIC_ENABLE_BOARDS=false
```

- `false`: sidebar atual (`SidebarProjectsList` só, `SidebarTeamsList` null).
- `true`: novo `SidebarBoardsList`.

Implementação em `sidebar.tsx`:

```tsx
{ENABLE_BOARDS ? <SidebarBoardsList /> : (
  <>
    <SidebarTeamsList />
    <SidebarProjectsList />
  </>
)}
```

---

## 10. Checklist de aprovação (Etapa 0)

Marca mentalmente ou responde no chat:

- [ ] Hierarquia sidebar só até Projeto (épico)
- [ ] Indentação Board → Projeto clara
- [ ] Secção «Sem board» para legado
- [ ] Labels «Boards» na secção
- [ ] Admin com `+` criar board
- [ ] Overview do board ao clicar no nome do time

**Quando tudo OK:** responder «aprovado etapa 0» → seguimos **Etapa 1** (i18n + tipos, ainda sem sidebar visível ou só textos).

---

*Documento gerado para Etapa 0 — sem alterações de código até aprovação.*
