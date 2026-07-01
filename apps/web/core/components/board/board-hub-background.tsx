import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Image, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { IconButton } from "@operoz/propel/icon-button";
import { Tooltip } from "@operoz/propel/tooltip";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
import { cn } from "@operoz/utils";
import {
  GANTT_BACKGROUND_PRESETS,
  getSavedGanttChartBackground,
  resolveGanttBackgroundImageUrl,
  saveGanttChartBackground,
  type GanttBackgroundPresetId,
  type GanttChartBackgroundValue,
} from "@/components/gantt-chart/helpers/gantt-chart-background-preference";

const PRESET_ORDER: GanttBackgroundPresetId[] = ["forest", "peaks", "ocean", "aurora"];

/** Rotas do hub do board (não a lista `/boards`). */
export function isBoardHubImmersivePath(pathname: string) {
  return /\/boards\/[^/]+/.test(pathname);
}

/** Painel com vidro fosco sobre o wallpaper (estilo Jira). */
export const BOARD_HUB_GLASS_PANEL = "rounded-lg border border-subtle/50 bg-layer-1/60 shadow-sm backdrop-blur-md";

/** Barra de filtros / toolbar sobre wallpaper. */
export const BOARD_HUB_GLASS_BAR = "border-subtle/40 bg-layer-1/45 backdrop-blur-md";

/** Cabeçalho do hub (breadcrumbs + abas) sobre wallpaper. */
export const BOARD_HUB_GLASS_HEADER =
  "border-b border-white/10 bg-surface-1/35 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-1/25";

/** Agrupa layout, filtros, exibir e ações no header do projeto. */
export const BOARD_HUB_TOOLBAR_CLUSTER =
  "flex shrink-0 flex-wrap items-center justify-end gap-1.5 rounded-md border border-subtle/50 bg-layer-1/60 p-1 shadow-sm backdrop-blur-md";

/** Legibilidade do texto branco sobre presets claros (oceano, aurora, etc.). */
export const BOARD_HUB_IMMERSIVE_TEXT_SHADOW = "[text-shadow:0_1px_2px_rgba(0,0,0,0.72),0_0_14px_rgba(0,0,0,0.48)]";

/** Moldura do conteúdo (cronograma, resumo) sobre wallpaper. */
export const BOARD_HUB_CONTENT_PANEL_IMMERSIVE =
  "rounded-lg border border-subtle/40 bg-layer-1/55 shadow-sm backdrop-blur-md";

/** Superfície legível dentro do painel immersive (widgets, tabelas). */
export const BOARD_HUB_PANEL_INNER_SURFACE =
  "bg-surface-1/88 backdrop-blur-sm supports-[backdrop-filter]:bg-surface-1/82";

/** Cartão sólido dentro do painel immersive — sem vidro extra. */
export const BOARD_HUB_PANEL_CARD = "overflow-hidden rounded-md border border-subtle bg-layer-1";

/** Cartão de trabalho do projeto (itens, módulos…) — vidro fosco; o wallpaper continua visível. */
export const BOARD_HUB_PROJECT_WORK_SURFACE =
  "rounded-xl border border-white/10 bg-surface-1/45 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-surface-1/30";

/** Área interna legível (lista/tabela) dentro do cartão com vidro. */
export const BOARD_HUB_PROJECT_WORK_SURFACE_INNER =
  "bg-surface-1/88 backdrop-blur-sm supports-[backdrop-filter]:bg-surface-1/82";

/** Cartão de métrica do ciclo ativo (progresso, burndown, stats). */
export const BOARD_HUB_CYCLE_METRIC_CARD =
  "flex min-h-[11rem] flex-col gap-3 rounded-lg border border-subtle/50 bg-layer-1/75 p-4 shadow-sm backdrop-blur-sm";

/** Faixa de secção colapsável (ciclo ativo / próximo / concluído). */
export const BOARD_HUB_CYCLE_SECTION_HEADER =
  "sticky top-0 z-[2] w-full border-b border-subtle/60 bg-layer-1/90 backdrop-blur-md";

/** Tabela/lista de módulos dentro do painel do hub. */
export const BOARD_HUB_MODULE_LIST_PANEL =
  "w-full rounded-lg border border-subtle/50 bg-layer-1/60 shadow-sm backdrop-blur-sm";

/** Cartão de módulo na vista galeria. */
export const BOARD_HUB_MODULE_CARD = "border border-subtle/50 bg-layer-1/75 shadow-sm backdrop-blur-sm";

/** Painel de histórico (status report, listas densas). */
export const BOARD_HUB_HISTORY_PANEL =
  "flex min-h-[280px] w-full min-w-0 flex-col rounded-lg border border-subtle/50 bg-layer-1/60 shadow-sm backdrop-blur-sm";

/** Coluna da lista de intake (split view). */
export const BOARD_HUB_INTAKE_SIDEBAR =
  "h-full w-full flex-shrink-0 border-r border-subtle/50 bg-layer-1/70 backdrop-blur-sm";

/** Painel de detalhe do item de intake. */
export const BOARD_HUB_INTAKE_DETAIL =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-layer-1/55 backdrop-blur-sm";

/** Faixa de métricas no topo de uma vista hub. */
export const BOARD_HUB_METRICS_STRIP =
  "grid grid-cols-1 gap-2 border-b border-subtle/60 px-4 py-3 sm:grid-cols-3 md:px-5 md:py-4";

/** Painel “semana em curso” do status report. */
export const BOARD_HUB_STATUS_REPORT_WEEK_PANEL =
  "relative overflow-hidden rounded-xl border border-subtle/50 bg-gradient-to-br from-layer-1/80 via-layer-1/65 to-accent-primary/5 p-4 shadow-sm backdrop-blur-md md:p-5";

/** Tile de módulo na semana em curso. */
export const BOARD_HUB_STATUS_REPORT_MODULE_TILE =
  "flex min-h-[7.5rem] flex-col rounded-lg border border-subtle/50 bg-layer-1/70 p-3 shadow-sm backdrop-blur-sm transition-colors hover:border-subtle hover:bg-layer-1/90";

/** Cartão de métrica compacto (status report). */
export const BOARD_HUB_STATUS_REPORT_METRIC =
  "flex items-center gap-3 rounded-lg border border-subtle/45 bg-layer-1/55 px-3 py-2.5 backdrop-blur-sm";

/** Superfícies internas do Gantt (sidebar, chart) sobre wallpaper. */
export const BOARD_HUB_GANTT_SURFACE = "border-subtle/40 bg-layer-1/50 backdrop-blur-md";

type BoardHubBackgroundContextValue = {
  value: GanttChartBackgroundValue;
  imageUrl: string | null;
  applyBackground: (value: GanttChartBackgroundValue) => void;
};

const BoardHubBackgroundContext = createContext<BoardHubBackgroundContextValue | null>(null);

function useBoardHubBackground(workspaceSlug: string, boardSlug: string): BoardHubBackgroundContextValue {
  const scope = `board:${boardSlug}`;
  const [value, setValue] = useState<GanttChartBackgroundValue>(() =>
    getSavedGanttChartBackground(workspaceSlug, scope)
  );

  useEffect(() => {
    setValue(getSavedGanttChartBackground(workspaceSlug, scope));
  }, [workspaceSlug, scope]);

  const applyBackground = (next: GanttChartBackgroundValue) => {
    saveGanttChartBackground(workspaceSlug, scope, next);
    setValue(next);
  };

  const imageUrl = resolveGanttBackgroundImageUrl(value);

  return { value, imageUrl, applyBackground };
}

export function useBoardHubBackgroundOptional(): BoardHubBackgroundContextValue | null {
  return useContext(BoardHubBackgroundContext);
}

export function useBoardHubHasBackground(): boolean {
  return Boolean(useBoardHubBackgroundOptional()?.imageUrl);
}

function useBoardHubBackgroundContext() {
  const ctx = useContext(BoardHubBackgroundContext);
  if (!ctx) {
    throw new Error("BoardHubBackgroundProvider is required");
  }
  return ctx;
}

export function BoardHubBackgroundProvider({
  workspaceSlug,
  boardSlug,
  children,
}: {
  workspaceSlug: string;
  boardSlug: string;
  children: ReactNode;
}) {
  const state = useBoardHubBackground(workspaceSlug, boardSlug);
  return <BoardHubBackgroundContext.Provider value={state}>{children}</BoardHubBackgroundContext.Provider>;
}

/**
 * Envolve cabeçalho + conteúdo do board; o wallpaper preenche esta área (não a barra global nem a sidebar).
 */
export function BoardHubImmersiveShell({ children }: { children: ReactNode }) {
  return <div className="relative flex h-full min-h-0 flex-col overflow-hidden">{children}</div>;
}

export function BoardHubBackgroundLayer() {
  const ctx = useBoardHubBackgroundOptional();
  const imageUrl = ctx?.imageUrl ?? null;
  if (!imageUrl) return null;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${imageUrl}")` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-black/35 to-black/50"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-surface-1/15" aria-hidden />
    </>
  );
}

export function BoardHubBackgroundContent({ children }: { children: ReactNode }) {
  return <div className="relative z-[1] flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>;
}

type BoardHubBackgroundModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BoardHubBackgroundModal({ isOpen, onClose }: BoardHubBackgroundModalProps) {
  const { t } = useTranslation();
  const { value, applyBackground } = useBoardHubBackgroundContext();
  const [customUrl, setCustomUrl] = useState(value.type === "custom" ? value.url : "");

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(value.type === "custom" ? value.url : "");
    }
  }, [isOpen, value]);

  const selectPreset = (preset: GanttBackgroundPresetId) => {
    applyBackground({ type: "preset", preset });
    onClose();
  };

  const selectNone = () => {
    applyBackground({ type: "none" });
    onClose();
  };

  const applyCustomUrl = () => {
    const url = customUrl.trim();
    if (!url) return;
    applyBackground({ type: "custom", url });
    onClose();
  };

  const isPresetActive = (preset: GanttBackgroundPresetId) => value.type === "preset" && value.preset === preset;

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.LG}
      className="overflow-hidden"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-16 font-semibold text-primary">{t("boards.board_bg_title")}</h2>
            <p className="mt-0.5 text-13 text-tertiary">{t("boards.board_bg_subtitle")}</p>
          </div>
          <IconButton variant="ghost" size="sm" icon={X} aria-label={t("close")} onClick={onClose} />
        </div>

        <button
          type="button"
          onClick={selectNone}
          className={cn(
            "rounded-md border px-3 py-2.5 text-left text-13 transition-colors",
            value.type === "none"
              ? "border-accent-primary bg-accent-primary/10 text-primary"
              : "border-subtle bg-layer-2 text-secondary hover:border-strong"
          )}
        >
          {t("boards.board_bg_none")}
        </button>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESET_ORDER.map((preset) => {
            const { url, labelKey } = GANTT_BACKGROUND_PRESETS[preset];
            const active = isPresetActive(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => selectPreset(preset)}
                className={cn(
                  "group overflow-hidden rounded-md border text-left transition-all",
                  active ? "border-accent-primary ring-accent-primary/30 ring-1" : "border-subtle hover:border-strong"
                )}
              >
                <div className="aspect-[4/3] w-full bg-cover bg-center" style={{ backgroundImage: `url("${url}")` }} />
                <span className="block px-2 py-1.5 text-12 font-medium text-secondary group-hover:text-primary">
                  {t(labelKey)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-subtle pt-4">
          <label className="text-12 font-medium text-secondary" htmlFor="board-bg-url">
            {t("boards.board_bg_custom_label")}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="board-bg-url"
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://…"
              className="min-w-[200px] flex-1 rounded-sm border border-subtle bg-layer-2 px-3 py-2 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
            />
            <Button variant="secondary" size="base" onClick={applyCustomUrl} disabled={!customUrl.trim()}>
              {t("boards.board_bg_apply")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
}

export function BoardHubBackgroundPicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { value } = useBoardHubBackgroundContext();
  const [isOpen, setIsOpen] = useState(false);
  const label = t("boards.board_bg_button");

  return (
    <>
      <Tooltip tooltipContent={label}>
        <span className={cn("inline-flex", className)}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={Image}
            aria-label={label}
            className={cn(value.type !== "none" && "text-accent-primary")}
            onClick={() => setIsOpen(true)}
          />
        </span>
      </Tooltip>
      <BoardHubBackgroundModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
