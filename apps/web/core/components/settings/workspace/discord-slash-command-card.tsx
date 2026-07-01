import { Hash, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { IconButton } from "@operoz/propel/icon-button";
import { Badge, cn } from "@operoz/ui";
import type { TDiscordSlashCommand } from "@/services/discord-slash-command.service";
import "./discord-settings.css";

function statusVariant(status: TDiscordSlashCommand["registration_status"]): "success" | "destructive" | "warning" {
  if (status === "synced") return "success";
  if (status === "failed") return "destructive";
  return "warning";
}

function topBarClass(status: TDiscordSlashCommand["registration_status"], enabled: boolean): string {
  if (!enabled) return "bg-subtle";
  if (status === "synced") return "bg-success-primary";
  if (status === "failed") return "bg-danger-primary";
  return "bg-warning-primary";
}

type Props = {
  command: TDiscordSlashCommand;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function DiscordSlashCommandCard(props: Props) {
  const { command, onEdit, onDelete, disabled } = props;
  const { t } = useTranslation();

  return (
    <article
      className={cn(
        "group relative flex min-h-[200px] flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        command.is_enabled && command.registration_status === "synced" && "discord-settings-card-active",
        !command.is_enabled && "opacity-75"
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", topBarClass(command.registration_status, command.is_enabled))}
        aria-hidden
      />

      <button
        type="button"
        className="flex flex-1 flex-col p-5 text-left transition-colors group-hover:bg-layer-1-hover/40"
        onClick={onEdit}
        disabled={disabled}
      >
        <div className="flex items-start gap-3 pr-4">
          <span className="font-mono shadow-sm grid size-11 shrink-0 place-items-center rounded-lg border border-subtle bg-surface-1 text-13 font-semibold text-accent-primary">
            /
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-1 text-14 font-semibold tracking-tight text-primary">/{command.name}</h3>
              {!command.is_enabled && (
                <span className="shrink-0 rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase">
                  {t("workspace_settings.settings.discord.card.disabled")}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-12 leading-relaxed text-secondary">{command.description}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary">
            <Hash className="size-3 opacity-70" strokeWidth={1.75} />
            {command.guild_id
              ? t("workspace_settings.settings.discord.card.guild", { id: command.guild_id })
              : t("workspace_settings.settings.discord.scope_global")}
          </span>
          {command.board_slug ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary">
              <LayoutGrid className="size-3 opacity-70" strokeWidth={1.75} />
              {command.board_slug}
            </span>
          ) : null}
        </div>

        {command.registration_error ? (
          <p className="mt-3 line-clamp-2 text-11 text-danger-primary">{command.registration_error}</p>
        ) : null}
      </button>

      <footer className="flex items-center justify-between gap-2 border-t border-subtle px-4 py-3">
        <Badge variant={statusVariant(command.registration_status)} size="sm" disabled>
          {t(`workspace_settings.settings.discord.status.${command.registration_status}`)}
        </Badge>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={Pencil}
            aria-label={t("workspace_settings.settings.discord.form.save")}
            onClick={onEdit}
            disabled={disabled}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            aria-label={t("workspace_settings.settings.discord.card.delete")}
            onClick={onDelete}
            disabled={disabled}
          />
        </div>
      </footer>
    </article>
  );
}
