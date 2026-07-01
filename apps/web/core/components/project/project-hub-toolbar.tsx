import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/utils";

/** Barra unificada: um único bloco com segmentos separados por divisores. */
export const PROJECT_HUB_TOOLBAR_SHELL =
  "inline-flex max-w-full flex-wrap items-center gap-0 rounded-lg border border-subtle/55 bg-layer-1/50 p-1 shadow-sm backdrop-blur-md";

/** Grupo lógico dentro da barra (layout | filtros | ações). */
export const PROJECT_HUB_TOOLBAR_SEGMENT = "flex items-center gap-1 px-0.5";

/** Segmento de alternância de layout (lista / board / gantt). */
export const PROJECT_HUB_LAYOUT_TOGGLE_GROUP =
  "flex items-center gap-0.5 rounded-md bg-layer-2/60 p-0.5 ring-1 ring-inset ring-subtle/40";

/** Botão ícone/texto secundário na toolbar. */
export const PROJECT_HUB_TOOLBAR_BUTTON_CLASS =
  "h-8 min-w-8 gap-1.5 rounded-md border-0 bg-transparent px-2 text-13 font-medium text-secondary shadow-none hover:bg-layer-transparent-hover hover:text-primary";

/** Botão secundário com borda (legado / dropdowns). */
export const PROJECT_HUB_GHOST_BUTTON_CLASS =
  "h-8 gap-1.5 rounded-md border border-subtle/45 bg-layer-2/50 px-2.5 text-13 font-medium text-secondary shadow-none hover:border-subtle hover:bg-layer-transparent-hover hover:text-primary";

/** @deprecated Use PROJECT_HUB_TOOLBAR_SHELL */
export const PROJECT_HUB_TOOLBAR_INSET = PROJECT_HUB_TOOLBAR_SHELL;

type ProjectHubToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function ProjectHubToolbar(props: ProjectHubToolbarProps) {
  const { children, className } = props;
  return <div className={cn(PROJECT_HUB_TOOLBAR_SHELL, className)}>{children}</div>;
}

type ProjectHubToolbarSegmentProps = {
  children: ReactNode;
  className?: string;
};

export function ProjectHubToolbarSegment(props: ProjectHubToolbarSegmentProps) {
  const { children, className } = props;
  return <div className={cn(PROJECT_HUB_TOOLBAR_SEGMENT, className)}>{children}</div>;
}

export function ProjectHubToolbarDivider() {
  return <span className="bg-subtle/70 mx-0.5 h-5 w-px shrink-0" aria-hidden />;
}

type ProjectHubPrimaryActionProps = {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  "data-ph-element"?: string;
};

export function ProjectHubPrimaryAction(props: ProjectHubPrimaryActionProps) {
  const { children, onClick, disabled, loading, className, "data-ph-element": dataPhElement } = props;

  return (
    <Button
      variant="primary"
      size="sm"
      prependIcon={<Plus className="size-3.5" aria-hidden />}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={cn(
        "shadow-sm h-8 shrink-0 rounded-md px-3 text-13 font-medium ring-1 ring-white/10 ring-inset",
        className
      )}
      data-ph-element={dataPhElement}
    >
      {children}
    </Button>
  );
}
