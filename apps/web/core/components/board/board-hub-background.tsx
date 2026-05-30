/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Image, X } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
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
export const BOARD_HUB_GLASS_PANEL =
  "rounded-lg border border-subtle/60 bg-layer-1/75 shadow-sm backdrop-blur-md";

/** Barra de filtros / toolbar sobre wallpaper. */
export const BOARD_HUB_GLASS_BAR =
  "border-subtle/50 bg-layer-1/55 backdrop-blur-md";

/** Cabeçalho do hub (breadcrumbs + abas) sobre wallpaper. */
export const BOARD_HUB_GLASS_HEADER =
  "border-b border-subtle/40 bg-surface-1/35 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-1/25";

/** Agrupa layout, filtros, exibir e ações no header do projeto. */
export const BOARD_HUB_TOOLBAR_CLUSTER =
  "flex shrink-0 flex-wrap items-center justify-end gap-1.5 rounded-md border border-subtle/50 bg-layer-1/70 p-1 shadow-sm backdrop-blur-md";

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
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-surface-1/15"
        aria-hidden
      />
    </>
  );
}

export function BoardHubBackgroundContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-[1] flex h-full min-h-0 w-full flex-col overflow-hidden">{children}</div>
  );
}

export function BoardHubBackgroundPicker({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { value, applyBackground } = useBoardHubBackgroundContext();
  const [isOpen, setIsOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState(value.type === "custom" ? value.url : "");

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(value.type === "custom" ? value.url : "");
    }
  }, [isOpen, value]);

  const label = t("boards.board_bg_button");

  const selectPreset = (preset: GanttBackgroundPresetId) => {
    applyBackground({ type: "preset", preset });
    setIsOpen(false);
  };

  const selectNone = () => {
    applyBackground({ type: "none" });
    setIsOpen(false);
  };

  const applyCustomUrl = () => {
    const url = customUrl.trim();
    if (!url) return;
    applyBackground({ type: "custom", url });
    setIsOpen(false);
  };

  const isPresetActive = (preset: GanttBackgroundPresetId) => value.type === "preset" && value.preset === preset;

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

      <ModalCore
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
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
            <IconButton variant="ghost" size="sm" icon={X} aria-label={t("close")} onClick={() => setIsOpen(false)} />
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
                    active ? "border-accent-primary ring-1 ring-accent-primary/30" : "border-subtle hover:border-strong"
                  )}
                >
                  <div
                    className="aspect-[4/3] w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${url}")` }}
                  />
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
    </>
  );
}
