import { useState } from "react";
import { Bookmark, Check, Pencil, Star, Trash2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";
import {
  CLIENT_360_SAVED_VIEWS_MAX,
  isValidClient360SavedViewName,
  sanitizeClient360SavedViewName,
  type Client360SavedView,
} from "@/components/board/client-360/client-360-saved-views";

type Props = {
  views: Client360SavedView[];
  defaultViewId: string | null;
  activeViewId: string | null;
  readOnlyViewIds?: Set<string>;
  onApplyView: (view: Client360SavedView) => void;
  onSaveView: (name: string) => { error?: "limit" | "invalid_name" };
  onRenameView: (viewId: string, name: string) => { error?: "not_found" | "invalid_name" };
  onDeleteView: (viewId: string) => void;
  onSetDefaultView: (viewId: string | null) => void;
  onOverwriteView: (viewId: string) => void;
  onPublishSharedView?: () => void;
  className?: string;
};

export function Client360SavedViewsMenu({
  views,
  defaultViewId,
  activeViewId,
  onApplyView,
  onSaveView,
  onRenameView,
  onDeleteView,
  onSetDefaultView,
  onOverwriteView,
  onPublishSharedView,
  readOnlyViewIds,
  className,
}: Props) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingViewId, setEditingViewId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const label = t("boards.client_360.saved_views_label");
  const hasActiveView = activeViewId !== null;

  const handleSave = () => {
    const trimmed = sanitizeClient360SavedViewName(newName);
    if (!isValidClient360SavedViewName(trimmed)) {
      setSaveError(t("boards.client_360.saved_views_name_required"));
      return;
    }
    const result = onSaveView(trimmed);
    if (result.error === "limit") {
      setSaveError(t("boards.client_360.saved_views_limit", { max: CLIENT_360_SAVED_VIEWS_MAX }));
      return;
    }
    if (result.error === "invalid_name") {
      setSaveError(t("boards.client_360.saved_views_name_required"));
      return;
    }
    setNewName("");
    setSaveError(null);
  };

  const handleRename = (viewId: string) => {
    const trimmed = sanitizeClient360SavedViewName(editName);
    if (!isValidClient360SavedViewName(trimmed)) return;
    const result = onRenameView(viewId, trimmed);
    if (!result.error) {
      setEditingViewId(null);
      setEditName("");
    }
  };

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      customButton={
        <Tooltip tooltipContent={label}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={Bookmark}
              aria-label={label}
              className={cn("shrink-0 rounded-sm", hasActiveView && "text-accent-primary")}
            />
          </span>
        </Tooltip>
      }
    >
      <div className="border-b border-subtle px-3 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
        {label}
      </div>

      {views.length === 0 ? (
        <div className="px-3 py-2 text-12 text-tertiary">{t("boards.client_360.saved_views_empty")}</div>
      ) : (
        views.map((view) => {
          const isActive = view.id === activeViewId;
          const isDefault = view.id === defaultViewId;
          const isEditing = editingViewId === view.id;
          const isConfirmDelete = confirmDeleteId === view.id;
          const isReadOnly = readOnlyViewIds?.has(view.id) ?? false;

          if (isConfirmDelete) {
            return (
              <div key={view.id} className="border-b border-subtle/60 px-3 py-2 last:border-b-0">
                <p className="text-12 text-secondary">
                  {t("boards.client_360.saved_views_delete_confirm", { name: view.name })}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-sm bg-danger-primary px-2 py-1 text-12 text-on-color"
                    onClick={() => {
                      onDeleteView(view.id);
                      setConfirmDeleteId(null);
                    }}
                  >
                    {t("boards.client_360.saved_views_delete_yes")}
                  </button>
                  <button
                    type="button"
                    className="rounded-sm px-2 py-1 text-12 text-tertiary hover:bg-layer-2"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    {t("boards.client_360.saved_views_delete_no")}
                  </button>
                </div>
              </div>
            );
          }

          if (isEditing) {
            return (
              <div key={view.id} className="flex items-center gap-1 border-b border-subtle/60 px-2 py-1.5">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 min-w-0 flex-1 rounded-sm border border-subtle bg-layer-2 px-2 text-12 text-primary focus:border-strong focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(view.id);
                    if (e.key === "Escape") setEditingViewId(null);
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="rounded-sm px-2 py-1 text-12 text-accent-primary hover:bg-layer-2"
                  onClick={() => handleRename(view.id)}
                >
                  {t("boards.client_360.saved_views_rename_save")}
                </button>
              </div>
            );
          }

          return (
            <div
              key={view.id}
              className="flex items-center gap-0.5 border-b border-subtle/60 px-1 py-0.5 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onSetDefaultView(isDefault ? null : view.id)}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-xs transition-colors hover:bg-layer-2",
                  isDefault ? "text-accent-primary" : "text-tertiary"
                )}
                aria-label={
                  isDefault
                    ? t("boards.client_360.saved_views_clear_default")
                    : t("boards.client_360.saved_views_set_default")
                }
              >
                <Star className="size-3.5" strokeWidth={1.75} fill={isDefault ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => onApplyView(view)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-layer-2"
              >
                <span className={cn("truncate text-13", isActive ? "font-medium text-primary" : "text-secondary")}>
                  {view.name}
                  {isReadOnly ? (
                    <span className="font-normal ml-1 text-10 text-tertiary">
                      ({t("boards.client_360.saved_views_shared_badge")})
                    </span>
                  ) : null}
                </span>
                {isActive ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
              </button>
              {!isReadOnly ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingViewId(view.id);
                      setEditName(view.name);
                      setConfirmDeleteId(null);
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-xs text-tertiary transition-colors hover:bg-layer-2 hover:text-secondary"
                    aria-label={t("boards.client_360.saved_views_rename")}
                  >
                    <Pencil className="size-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteId(view.id);
                      setEditingViewId(null);
                    }}
                    className="grid size-7 shrink-0 place-items-center rounded-xs text-tertiary transition-colors hover:bg-layer-2 hover:text-danger-primary"
                    aria-label={t("boards.client_360.saved_views_delete")}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                </>
              ) : null}
            </div>
          );
        })
      )}

      {activeViewId && onPublishSharedView ? (
        <CustomMenu.MenuItem className="flex items-center gap-2 text-12" onClick={onPublishSharedView}>
          <Star className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate">{t("boards.client_360.saved_views_publish_shared")}</span>
        </CustomMenu.MenuItem>
      ) : null}

      {activeViewId ? (
        <CustomMenu.MenuItem className="flex items-center gap-2 text-12" onClick={() => onOverwriteView(activeViewId)}>
          <Bookmark className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 truncate">{t("boards.client_360.saved_views_update_active")}</span>
        </CustomMenu.MenuItem>
      ) : null}

      <div className="border-t border-subtle p-2">
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              setSaveError(null);
            }}
            placeholder={t("boards.client_360.saved_views_name_placeholder")}
            className="h-8 min-w-0 flex-1 rounded-sm border border-subtle bg-layer-2 px-2 text-12 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={views.length >= CLIENT_360_SAVED_VIEWS_MAX}
            className="shrink-0 rounded-sm bg-accent-primary px-2.5 py-1.5 text-12 font-medium text-on-color transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {t("boards.client_360.saved_views_save")}
          </button>
        </div>
        {saveError ? <p className="mt-1 text-11 text-danger-primary">{saveError}</p> : null}
        <p className="mt-1 text-10 text-tertiary">
          {t("boards.client_360.saved_views_hint", {
            count: views.length,
            max: CLIENT_360_SAVED_VIEWS_MAX,
          })}
        </p>
      </div>
    </CustomMenu>
  );
}
