import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ALargeSmall, AtSign, Ban, ChevronDown, Paperclip, Smile } from "lucide-react";
import type { EditorRefApi } from "@operis/editor";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";
import type { ToolbarMenuItem } from "@/constants/editor";
import { ISSUE_MODAL_EDITOR_COLORS, ISSUE_MODAL_TOOLBAR_GROUPS } from "@/constants/editor";

type Props = {
  editorRef: React.MutableRefObject<EditorRefApi | null>;
  editorReady?: boolean;
  endSlot?: React.ReactNode;
};

const PANEL_BASE_CLASS =
  "rounded-md border-[0.5px] border-subtle bg-surface-1 shadow-raised-200";

function ToolbarIconButton({
  isActive,
  tooltip,
  disabled,
  onClick,
  children,
}: {
  isActive?: boolean;
  tooltip: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip tooltipContent={tooltip}>
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn(
          "grid aspect-square size-7 shrink-0 place-items-center rounded-xs text-placeholder hover:bg-layer-1",
          {
            "bg-layer-1 text-primary": isActive,
          }
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/** Menu ancorado ao botão via portal (evita corte por overflow do modal/toolbar). */
function ToolbarAnchoredMenu({
  isOpen,
  onClose,
  panelClassName,
  trigger,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  panelClassName?: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePanelPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setPanelPosition({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPanelPosition(null);
      return;
    }
    updatePanelPosition();
    const handleReposition = () => updatePanelPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    // Adia o listener para o clique que abriu o menu não fechar imediatamente.
    const timeoutId = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDownOutside, true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handlePointerDownOutside, true);
    };
  }, [isOpen, onClose]);

  const panel =
    isOpen &&
    panelPosition &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        role="menu"
        data-prevent-outside-click
        className={cn(PANEL_BASE_CLASS, panelClassName)}
        style={{
          position: "fixed",
          top: panelPosition.top,
          left: panelPosition.left,
          zIndex: 10000,
        }}
      >
        {children}
      </div>,
      document.body
    );

  return (
    <div ref={containerRef} className="relative shrink-0">
      {trigger}
      {panel}
    </div>
  );
}

export function IssueModalEditorToolbar(props: Props) {
  const { editorRef, editorReady = false, endSlot } = props;
  const { t } = useTranslation();

  const getEditorApi = useCallback(() => editorRef.current, [editorRef]);
  const isEditorAvailable = !!getEditorApi() || editorReady;
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({});
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const activeStatesRef = useRef<Record<string, boolean>>({});

  const closeAllMenus = useCallback(() => {
    setTypographyOpen(false);
    setColorOpen(false);
    setLinkOpen(false);
  }, []);

  const updateActiveStates = useCallback(() => {
    const api = getEditorApi();
    if (!api) return;
    const newActiveStates: Record<string, boolean> = {};
    ISSUE_MODAL_TOOLBAR_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        newActiveStates[item.renderKey] = api.isMenuItemActive({
          itemKey: item.itemKey,
          ...item.extraProps,
        } as Parameters<EditorRefApi["isMenuItemActive"]>[0]);
      });
    });

    const prev = activeStatesRef.current;
    const hasChanged = Object.keys(newActiveStates).some((key) => prev[key] !== newActiveStates[key]);
    if (!hasChanged) return;

    activeStatesRef.current = newActiveStates;
    setActiveStates(newActiveStates);
  }, [getEditorApi]);

  const runEditorCommand = useCallback(
    (command: (api: EditorRefApi) => void) => {
      const api = getEditorApi();
      if (!api) return;
      api.focus(null);
      command(api);
      requestAnimationFrame(updateActiveStates);
    },
    [getEditorApi, updateActiveStates]
  );

  const executeCommand = useCallback(
    (item: ToolbarMenuItem) => {
      runEditorCommand((api) => {
        api.executeMenuItemCommand({
          itemKey: item.itemKey,
          ...item.extraProps,
        } as Parameters<EditorRefApi["executeMenuItemCommand"]>[0]);
      });
    },
    [runEditorCommand]
  );

  useEffect(() => {
    if (!isEditorAvailable) {
      activeStatesRef.current = {};
      setActiveStates({});
      return;
    }
    updateActiveStates();
  }, [isEditorAvailable, updateActiveStates]);

  const activeTypography =
    ISSUE_MODAL_TOOLBAR_GROUPS.find((g) => g.key === "typography")?.items.find((item) => activeStates[item.renderKey]) ??
    ISSUE_MODAL_TOOLBAR_GROUPS.find((g) => g.key === "typography")?.items[0];

  const applyLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    runEditorCommand((api) => {
      api.executeMenuItemCommand({
        itemKey: "link",
        url: normalizedUrl,
        text: api.getSelectedText() ?? undefined,
      });
    });
    setLinkUrl("");
    setLinkOpen(false);
  };

  const applyTextColor = (color: string | undefined) => {
    runEditorCommand((api) => {
      api.executeMenuItemCommand({ itemKey: "text-color", color });
    });
    setColorOpen(false);
  };

  const applyBackgroundColor = (color: string | undefined) => {
    runEditorCommand((api) => {
      api.executeMenuItemCommand({ itemKey: "background-color", color });
    });
    setColorOpen(false);
  };

  return (
    <div
      className="relative z-0 min-h-9 w-full overflow-visible px-2 py-1.5"
      data-prevent-outside-click
      onMouseDown={(e) => {
        // Mantém seleção/foco no editor ao usar a toolbar (não exige re-selecionar texto).
        if ((e.target as HTMLElement).closest("button, input, a")) return;
        getEditorApi()?.focus(null);
      }}
    >
      <div className="flex w-full items-center gap-2 overflow-x-auto overflow-y-visible">
      <div className="flex min-w-0 flex-1 items-stretch gap-0.5">
        <ToolbarAnchoredMenu
          isOpen={typographyOpen}
          onClose={() => setTypographyOpen(false)}
          panelClassName="min-w-[10rem] p-1"
          trigger={
            <button
              type="button"
              className={cn(
                "flex h-7 shrink-0 items-center gap-0.5 rounded-xs px-1.5 text-placeholder hover:bg-layer-1",
                typographyOpen && "bg-layer-1 text-primary"
              )}
              disabled={!isEditorAvailable}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                closeAllMenus();
                setTypographyOpen((open) => !open);
              }}
            >
              {activeTypography && <activeTypography.icon className="size-3.5" strokeWidth={2.5} />}
              <ChevronDown className="size-3" />
            </button>
          }
        >
          {ISSUE_MODAL_TOOLBAR_GROUPS.find((g) => g.key === "typography")?.items.map((item) => (
            <button
              key={item.renderKey}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-xs px-2 py-1.5 text-13 text-secondary hover:bg-layer-1",
                {
                  "bg-layer-1 text-primary": activeStates[item.renderKey],
                }
              )}
              onClick={() => {
                executeCommand(item);
                setTypographyOpen(false);
              }}
            >
              <item.icon className="size-3.5 shrink-0" strokeWidth={2.5} />
              <span>{item.name}</span>
            </button>
          ))}
        </ToolbarAnchoredMenu>

        {ISSUE_MODAL_TOOLBAR_GROUPS.filter((g) => g.key !== "typography").map((group, groupIndex) => (
          <div
            key={group.key}
            className={cn("flex shrink-0 items-center gap-0.5 border-l border-subtle pl-1.5", {
              "ml-0.5": groupIndex === 0,
            })}
          >
            {group.items.map((item) => {
              if (item.itemKey === "link") {
                return (
                  <ToolbarAnchoredMenu
                    key={item.renderKey}
                    isOpen={linkOpen}
                    onClose={() => setLinkOpen(false)}
                    panelClassName="w-64 p-2"
                    trigger={
                      <Tooltip tooltipContent={item.name}>
                        <button
                          type="button"
                          className={cn(
                            "grid aspect-square size-7 shrink-0 place-items-center rounded-xs text-placeholder hover:bg-layer-1",
                            {
                              "bg-layer-1 text-primary": activeStates[item.renderKey] || linkOpen,
                            }
                          )}
                          disabled={!isEditorAvailable}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            closeAllMenus();
                            setLinkOpen((open) => !open);
                          }}
                        >
                          <item.icon className="size-3.5" strokeWidth={2.5} />
                        </button>
                      </Tooltip>
                    }
                  >
                    <p className="mb-1.5 text-11 font-medium text-tertiary">{t("issue_modal_toolbar_link")}</p>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          applyLink();
                        }
                      }}
                      placeholder="https://"
                      className="w-full rounded-xs border border-subtle bg-layer-2 px-2 py-1.5 text-13 text-primary outline-none focus:border-accent-primary"
                    />
                    <button
                      type="button"
                      className="mt-2 w-full rounded-xs bg-accent-primary px-2 py-1 text-11 font-medium text-on-color hover:bg-accent-primary/90"
                      onClick={applyLink}
                    >
                      {t("issue_modal_toolbar_link_apply")}
                    </button>
                  </ToolbarAnchoredMenu>
                );
              }

              const Icon = item.itemKey === "image" ? Paperclip : item.icon;

              return (
                <ToolbarIconButton
                  key={item.renderKey}
                  isActive={activeStates[item.renderKey]}
                  tooltip={item.name}
                  disabled={!isEditorAvailable}
                  onClick={() => {
                    closeAllMenus();
                    executeCommand(item);
                  }}
                >
                  <Icon className="size-3.5" strokeWidth={2.5} />
                </ToolbarIconButton>
              );
            })}
          </div>
        ))}

        <div className="flex shrink-0 items-center border-l border-subtle pl-1.5">
          <ToolbarAnchoredMenu
            isOpen={colorOpen}
            onClose={() => setColorOpen(false)}
            panelClassName="p-2"
            trigger={
              <button
                type="button"
                className={cn(
                  "flex h-7 shrink-0 items-center gap-0.5 rounded-xs px-1 text-placeholder hover:bg-layer-1",
                  colorOpen && "bg-layer-1 text-primary"
                )}
                disabled={!isEditorAvailable}
                title={t("issue_modal_toolbar_color")}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  closeAllMenus();
                  setColorOpen((open) => !open);
                }}
              >
                <ALargeSmall className="size-3.5" strokeWidth={2.5} />
                <span className="mb-0.5 block h-0.5 w-3 rounded-full bg-accent-primary" />
                <ChevronDown className="size-3" />
              </button>
            }
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-11 font-semibold text-tertiary">{t("issue_modal_toolbar_text_color")}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ISSUE_MODAL_EDITOR_COLORS.map((color) => (
                    <button
                      key={color.key}
                      type="button"
                      className="size-6 shrink-0 rounded-sm border-[0.5px] border-strong transition-opacity hover:opacity-70"
                      style={{ backgroundColor: color.textColor }}
                      onClick={() => applyTextColor(color.key)}
                    />
                  ))}
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-sm border-[0.5px] border-strong text-tertiary hover:bg-layer-1"
                    onClick={() => applyTextColor(undefined)}
                  >
                    <Ban className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-11 font-semibold text-tertiary">{t("issue_modal_toolbar_bg_color")}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ISSUE_MODAL_EDITOR_COLORS.map((color) => (
                    <button
                      key={`bg-${color.key}`}
                      type="button"
                      className="size-6 shrink-0 rounded-sm border-[0.5px] border-strong transition-opacity hover:opacity-70"
                      style={{ backgroundColor: color.backgroundColor }}
                      onClick={() => applyBackgroundColor(color.key)}
                    />
                  ))}
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-sm border-[0.5px] border-strong text-tertiary hover:bg-layer-1"
                    onClick={() => applyBackgroundColor(undefined)}
                  >
                    <Ban className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </ToolbarAnchoredMenu>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 border-l border-subtle pl-1.5">
          <ToolbarIconButton
            tooltip={t("issue_modal_toolbar_mention")}
            onClick={() => {
              closeAllMenus();
              const api = getEditorApi();
              api?.focus(null);
              api?.setEditorValueAtCursorPosition("@");
            }}
          >
            <AtSign className="size-3.5" strokeWidth={2.5} />
          </ToolbarIconButton>
          <ToolbarIconButton
            tooltip={t("issue_modal_toolbar_emoji")}
            onClick={() => {
              closeAllMenus();
              runEditorCommand((api) => {
                api.openEmojiPicker();
              });
            }}
          >
            <Smile className="size-3.5" strokeWidth={2.5} />
          </ToolbarIconButton>
        </div>
      </div>

      {endSlot && <div className="flex shrink-0 items-center gap-1 border-l border-subtle pl-2">{endSlot}</div>}
      </div>
    </div>
  );
}
