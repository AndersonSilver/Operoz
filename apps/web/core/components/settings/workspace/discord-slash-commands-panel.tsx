import { useCallback, useMemo, useState } from "react";
import { Loader2, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { EmptyStateCompact } from "@operis/propel/empty-state";
import { Input } from "@operis/propel/input";
import { setToast, TOAST_TYPE } from "@operis/propel/toast";
import { TextArea, ToggleSwitch } from "@operis/ui";
import { cn } from "@operis/utils";
import {
  DiscordSlashCommandService,
  type TDiscordSlashCommand,
  type TDiscordSlashCommandPayload,
} from "@/services/discord-slash-command.service";

type FormState = {
  name: string;
  description: string;
  prompt_instructions: string;
  guild_id: string;
  board_slug: string;
  default_project: string;
  is_enabled: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  prompt_instructions: "",
  guild_id: "",
  board_slug: "",
  default_project: "",
  is_enabled: true,
};

function toFormState(command?: TDiscordSlashCommand | null): FormState {
  if (!command) return { ...EMPTY_FORM };
  return {
    name: command.name,
    description: command.description,
    prompt_instructions: command.prompt_instructions,
    guild_id: command.guild_id ?? "",
    board_slug: command.board_slug ?? "",
    default_project: command.default_project ?? "",
    is_enabled: command.is_enabled,
  };
}

function toPayload(form: FormState): TDiscordSlashCommandPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    prompt_instructions: form.prompt_instructions.trim(),
    guild_id: form.guild_id.trim() || null,
    board_slug: form.board_slug.trim(),
    default_project: form.default_project.trim() || null,
    is_enabled: form.is_enabled,
  };
}

function StatusBadge({ status }: { status: TDiscordSlashCommand["registration_status"] }) {
  const { t } = useTranslation();
  const tone =
    status === "synced"
      ? "text-success-primary bg-success-subtle/40"
      : status === "failed"
        ? "text-danger-primary bg-danger-subtle/40"
        : "text-warning-primary bg-warning-subtle/40";

  return (
    <span className={cn("inline-flex rounded-sm px-2 py-0.5 text-11 font-medium", tone)}>
      {t(`workspace_settings.settings.discord.status.${status}`)}
    </span>
  );
}

function CommandForm(props: {
  form: FormState;
  onChange: (next: FormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  editing: boolean;
}) {
  const { t } = useTranslation();
  const { form, onChange, onSubmit, onCancel, submitting, editing } = props;

  return (
    <div className="space-y-4 rounded-xl border border-subtle bg-surface-1 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.name")}
          </label>
          <Input
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value.toLowerCase() })}
            placeholder="resumo-squad"
            disabled={submitting}
          />
        </div>
        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.guild_id")} *
          </label>
          <Input
            value={form.guild_id}
            onChange={(event) => onChange({ ...form, guild_id: event.target.value })}
            placeholder="123456789012345678"
            disabled={submitting}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-11 font-medium text-tertiary">
          {t("workspace_settings.settings.discord.form.description")}
        </label>
        <Input
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          disabled={submitting}
        />
      </div>

      <div>
        <label className="mb-1 block text-11 font-medium text-tertiary">
          {t("workspace_settings.settings.discord.form.prompt_instructions")}
        </label>
        <TextArea
          value={form.prompt_instructions}
          onChange={(event) => onChange({ ...form, prompt_instructions: event.target.value })}
          rows={5}
          disabled={submitting}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.board_slug")}
          </label>
          <Input
            value={form.board_slug}
            onChange={(event) => onChange({ ...form, board_slug: event.target.value })}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="mb-1 block text-11 font-medium text-tertiary">
            {t("workspace_settings.settings.discord.form.default_project")}
          </label>
          <Input
            value={form.default_project}
            onChange={(event) => onChange({ ...form, default_project: event.target.value })}
            placeholder="uuid do projeto"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-md border border-subtle bg-layer-2/30 px-3 py-2">
        <div>
          <p className="text-13 font-medium text-primary">{t("workspace_settings.settings.discord.form.enabled")}</p>
          <p className="text-12 text-tertiary">{t("workspace_settings.settings.discord.form.enabled_hint")}</p>
        </div>
        <ToggleSwitch
          value={form.is_enabled}
          onChange={(value) => onChange({ ...form, is_enabled: value })}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={submitting}>
          {t("cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={onSubmit} loading={submitting}>
          {editing
            ? t("workspace_settings.settings.discord.form.save")
            : t("workspace_settings.settings.discord.form.create")}
        </Button>
      </div>
    </div>
  );
}

export function WorkspaceDiscordSlashCommandsPanel({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const service = useMemo(() => new DiscordSlashCommandService(), []);
  const swrKey = `DISCORD_SLASH_COMMANDS_${workspaceSlug}`;

  const { data: commands, isLoading, mutate } = useSWR(swrKey, () => service.list(workspaceSlug));

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TDiscordSlashCommand | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = toPayload(form);
      if (editing) {
        await service.update(workspaceSlug, editing.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.updated") });
      } else {
        await service.create(workspaceSlug, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.created") });
      }
      await mutate();
      resetForm();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.discord.toast.error") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (command: TDiscordSlashCommand) => {
    setSubmitting(true);
    try {
      await service.remove(workspaceSlug, command.id);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("workspace_settings.settings.discord.toast.deleted") });
      await mutate();
      if (editing?.id === command.id) resetForm();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("workspace_settings.settings.discord.toast.error") });
    } finally {
      setSubmitting(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const startEdit = (command: TDiscordSlashCommand) => {
    setEditing(command);
    setForm(toFormState(command));
    setShowForm(true);
  };

  if (isLoading && !commands) {
    return (
      <div className="flex min-h-[16rem] items-center justify-center rounded-xl border border-subtle bg-layer-1">
        <Loader2 className="size-6 animate-spin text-accent-primary" strokeWidth={1.75} />
      </div>
    );
  }

  const list = commands ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-subtle bg-layer-2/25 p-4">
        <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">
          {t("workspace_settings.settings.discord.setup_title")}
        </p>
        <p className="mt-1 text-12 leading-relaxed text-secondary">
          {t("workspace_settings.settings.discord.setup_description")}
        </p>
        <code className="mt-2 block rounded-sm bg-layer-2 px-2 py-1 text-11 text-primary">
          POST /api/discord/interactions/
        </code>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-13 font-semibold text-primary">
            {t("workspace_settings.settings.discord.commands_title")}
          </h3>
          <p className="text-12 text-tertiary">{t("workspace_settings.settings.discord.commands_description")}</p>
        </div>
        {!showForm ? (
          <Button variant="primary" size="sm" onClick={startCreate}>
            <MessageSquarePlus className="size-4" strokeWidth={1.75} />
            {t("workspace_settings.settings.discord.add_command")}
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <CommandForm
          form={form}
          onChange={setForm}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          submitting={submitting}
          editing={Boolean(editing)}
        />
      ) : null}

      {list.length === 0 && !showForm ? (
        <EmptyStateCompact
          assetKey="webhook"
          title={t("workspace_settings.settings.discord.empty_title")}
          description={t("workspace_settings.settings.discord.empty_description")}
          actions={[{ label: t("workspace_settings.settings.discord.add_command"), onClick: startCreate }]}
          align="start"
          rootClassName="py-16"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <table className="w-full text-left text-13">
            <thead className="border-b border-subtle bg-layer-2/40 text-11 tracking-wide text-tertiary uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">{t("workspace_settings.settings.discord.table.command")}</th>
                <th className="px-4 py-3 font-medium">{t("workspace_settings.settings.discord.table.scope")}</th>
                <th className="px-4 py-3 font-medium">{t("workspace_settings.settings.discord.table.status")}</th>
                <th className="px-4 py-3 text-right font-medium">
                  {t("workspace_settings.settings.discord.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {list.map((command) => (
                <tr key={command.id} className="hover:bg-layer-transparent-hover">
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary">/{command.name}</p>
                    <p className="text-12 text-tertiary">{command.description}</p>
                  </td>
                  <td className="px-4 py-3 text-12 text-secondary">
                    {command.guild_id
                      ? `guild:${command.guild_id}`
                      : t("workspace_settings.settings.discord.scope_global")}
                    {command.board_slug ? (
                      <span className="mt-1 block text-11 text-tertiary">board:{command.board_slug}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={command.registration_status} />
                    {command.registration_error ? (
                      <p className="mt-1 max-w-xs truncate text-11 text-danger-primary">{command.registration_error}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(command)} disabled={submitting}>
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(command)} disabled={submitting}>
                        <Trash2 className="size-3.5 text-danger-primary" strokeWidth={1.75} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
