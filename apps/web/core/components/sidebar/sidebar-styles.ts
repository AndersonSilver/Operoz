import { cn } from "@operis/utils";

/** Item de navegação principal da sidebar do app. */
export function sidebarNavItemClass(isActive?: boolean) {
  return cn(
    "group/nav relative flex w-full cursor-pointer items-center justify-between gap-1.5 rounded-md py-1.5 pr-2 pl-2.5 outline-none transition-colors duration-150",
    isActive
      ? "bg-accent-subtle/35 text-primary"
      : "text-secondary hover:bg-layer-transparent-hover hover:text-primary"
  );
}

/** Barra de destaque do item ativo (estilo Operoz, não pill cinza do Plane). */
export const SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS =
  "pointer-events-none absolute top-1/2 left-1 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-primary";

/** Cabeçalho de secção (Boards, Espaço de trabalho…). */
export const SIDEBAR_SECTION_LABEL_CLASS =
  "text-11 font-semibold tracking-[0.04em] text-tertiary uppercase";

/** Ícone de item de navegação. */
export function sidebarNavIconClass(isActive?: boolean) {
  return cn(
    "flex size-4 shrink-0 items-center justify-center [&_svg]:size-3.5",
    isActive ? "text-accent-primary" : "text-tertiary group-hover/nav:text-secondary"
  );
}

/** Indentação dos filhos na árvore. */
export const SIDEBAR_TREE_CHILD_INDENT_CLASS = "pl-6";

/** Linha tracejada fina (estilo original da sidebar). */
export const SIDEBAR_TREE_GUIDE_LINE_CLASS =
  "pointer-events-none absolute top-0 bottom-1 left-[15px] border-l border-dashed border-subtle";

/** Chevron da árvore — sempre visível, mais forte no hover. */
export const SIDEBAR_TREE_CHEVRON_CLASS =
  "shrink-0 text-tertiary opacity-75 transition-opacity duration-150 group-hover/board-row:opacity-100 group-hover/project-item:opacity-100";

/** Item aninhado sob board (projetos na árvore). */
export function sidebarNestedNavItemClass(isActive?: boolean) {
  return cn(
    sidebarNavItemClass(isActive),
    "group/project-item relative",
    isActive
      ? "bg-accent-subtle/50 ring-1 ring-accent-primary/25"
      : "hover:bg-accent-subtle/25 hover:ring-1 hover:ring-accent-primary/10"
  );
}
